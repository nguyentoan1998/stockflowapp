import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Typography } from '../theme';
import CustomTabBar from '../components/CustomTabBar';

// Screens
import LoginScreen from '../screens/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ProductSummaryScreen from '../screens/ProductSummaryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManagementStack from './ManagementStack';
import ChatScreen from '../screens/ChatScreen';
import CategoriesScreen from '../screens/CategoriesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: styles.header,
        headerTintColor: Colors.surface,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      {/* Chấm công */}
      <Tab.Screen 
        name="Attendance" 
        component={AttendanceScreen}
        options={{ title: 'Chấm công' }}
      />

      {/* Sản phẩm */}
      <Tab.Screen 
        name="Products" 
        component={CategoriesScreen}
        options={{ title: 'Sản phẩm' }}
      />

      {/* Chat - Center button */}
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />

      {/* Quản lý */}
      <Tab.Screen 
        name="Management" 
        component={ManagementStack}
        options={{ title: 'Quản lý', headerShown: false }}
      />

      {/* Hệ thống */}
      <Tab.Screen 
        name="System" 
        component={ProfileScreen}
        options={{ title: 'Hệ thống' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {user ? (
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{
            animationTypeForReplace: user ? 'push' : 'pop',
          }}
        />
      ) : (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
          }}
        />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.surface,
  },
});
