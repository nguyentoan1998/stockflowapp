import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Contexts
import { AuthProvider } from './src/contexts/AuthContext';
import { ApiProvider } from './src/contexts/ApiContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <ApiProvider>
          <AuthProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </ApiProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}