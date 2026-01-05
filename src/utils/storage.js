import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Detect if running on web
const isWeb = Platform.OS === 'web';

// Token Storage (SecureStore on mobile, localStorage on web)
export const TokenStorage = {
  save: async (token) => {
    try {
      if (isWeb) {
        // Use AsyncStorage (which uses localStorage on web)
        await AsyncStorage.setItem('authToken', token);
      } else {
        await SecureStore.setItemAsync('authToken', token);
      }
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  get: async () => {
    try {
      if (isWeb) {
        return await AsyncStorage.getItem('authToken');
      } else {
        return await SecureStore.getItemAsync('authToken');
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  remove: async () => {
    try {
      if (isWeb) {
        await AsyncStorage.removeItem('authToken');
      } else {
        await SecureStore.deleteItemAsync('authToken');
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  exists: async () => {
    try {
      if (isWeb) {
        const token = await AsyncStorage.getItem('authToken');
        return !!token;
      } else {
        const token = await SecureStore.getItemAsync('authToken');
        return !!token;
      }
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  },
};

// User Profile Storage (AsyncStorage - persistent, instant loading)
export const UserProfileStorage = {
  save: async (user) => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  },

  get: async () => {
    try {
      const profile = await AsyncStorage.getItem('userProfile');
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error retrieving user profile:', error);
      return null;
    }
  },

  remove: async () => {
    try {
      await AsyncStorage.removeItem('userProfile');
    } catch (error) {
      console.error('Error removing user profile:', error);
    }
  },

  exists: async () => {
    try {
      const profile = await AsyncStorage.getItem('userProfile');
      return profile !== null;
    } catch (error) {
      console.error('Error checking user profile:', error);
      return false;
    }
  },
};

// Cache Storage (AsyncStorage - for screen data)
export const CacheStorage = {
  set: async (key, data) => {
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving cache ${key}:`, error);
    }
  },

  get: async (key) => {
    try {
      const data = await AsyncStorage.getItem(`cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error retrieving cache ${key}:`, error);
      return null;
    }
  },

  remove: async (key) => {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error(`Error removing cache ${key}:`, error);
    }
  },

  clear: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cachKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cachKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  exists: async (key) => {
    try {
      const data = await AsyncStorage.getItem(`cache_${key}`);
      return data !== null;
    } catch (error) {
      console.error(`Error checking cache ${key}:`, error);
      return false;
    }
  },
};

// Clear only auth data on logout (keep query cache)
export const clearAuthStorage = async () => {
  try {
    // Clear token from SecureStore
    await TokenStorage.remove();

    // Clear user profile from MMKV
    UserProfileStorage.remove();

    console.log('Auth storage cleared');
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
};

// Clear all sensitive data including query cache (called on logout)
export const clearAllStorage = async () => {
  try {
    // Clear auth data
    await clearAuthStorage();

    // Clear all cache from MMKV (optional - only if user explicitly wants to)
    CacheStorage.clear();

    console.log('All storage cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

export default {
  TokenStorage,
  UserProfileStorage,
  CacheStorage,
  clearAuthStorage,
  clearAllStorage,
};
