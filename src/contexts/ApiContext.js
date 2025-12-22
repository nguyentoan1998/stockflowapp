import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ApiContext = createContext();

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

export function ApiProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // API Configuration - Server running on localhost:3001
  // For React Native: Use your computer's IP address, not localhost
  // For Expo Tunnel/ngrok: Use your ngrok URL
  const BASE_URL = __DEV__ 
    ? process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.139:3001'  // Development - use env var or IP
    : 'http://localhost:3001';     // Production

  // Get API key from AsyncStorage with default fallback
  const getApiKey = async () => {
    try {
      const apiKey = await AsyncStorage.getItem('api_key');
      return apiKey || process.env.EXPO_PUBLIC_API_KEY || 'Domaytimduockeynaycuatao';
    } catch (error) {
      console.error('Error getting API key:', error);
      return 'Domaytimduockeynaycuatao';
    }
  };

  const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    withCredentials: true,  // Enable cookies for authentication
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor để thêm API key header
  api.interceptors.request.use(
    async (config) => {
      const apiKey = await getApiKey();
      if (apiKey) {
        config.headers['X-API-Key'] = apiKey;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor để handle errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Session expired, clear user data
        AsyncStorage.removeItem('userData');
      }
      return Promise.reject(error);
    }
  );

  // Set API key function
  const setApiKey = async (apiKey) => {
    try {
      await AsyncStorage.setItem('api_key', apiKey);
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      return false;
    }
  };

  // Test connection
  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await api.get('/health');
      if (response.status === 200) {
        setIsConnected(true);
        return true;
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      setIsConnected(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initialize default API key on first app launch
  useEffect(() => {
    const initializeApiKey = async () => {
      try {
        const existingKey = await AsyncStorage.getItem('api_key');
        if (!existingKey) {
          await AsyncStorage.setItem('api_key', 'Domaytimduockeynaycuatao');
        }
      } catch (error) {
        console.error('Error initializing API key:', error);
      }
    };

    initializeApiKey();
  }, []);

  useEffect(() => {
    testConnection();
  }, []);

  const value = {
    api,
    isConnected,
    loading,
    testConnection,
    setApiKey,
    getApiKey,
    baseUrl: BASE_URL
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}