import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import CustomTabBar from '../components/CustomTabBar';

// Import screens
import AttendanceScreen from '../screens/AttendanceScreen';
import ChatScreen from '../screens/ChatScreen';
import ManagementStack from './ManagementStack';
import CategoriesScreen from '../screens/CategoriesScreen';

// Import for System tab
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Products Stack
function ProductsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProductsList"
        component={CategoriesScreen}
        options={{ 
          title: 'Sản phẩm',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// System Stack
function SystemStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SystemMain"
        component={ProfileScreen}
        options={{ 
          title: 'Hệ thống',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Left: Chấm công */}
      <Tab.Screen 
        name="Attendance" 
        component={AttendanceScreen}
        options={{ title: 'Chấm công' }}
      />

      {/* Second: Sản phẩm */}
      <Tab.Screen 
        name="Products" 
        component={ProductsStack}
        options={{ title: 'Sản phẩm' }}
      />

      {/* Center: Chat (Large button) */}
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />

      {/* Fourth: Quản lý */}
      <Tab.Screen 
        name="Management" 
        component={ManagementStack}
        options={{ title: 'Quản lý' }}
      />

      {/* Right: Hệ thống */}
      <Tab.Screen 
        name="System" 
        component={SystemStack}
        options={{ title: 'Hệ thống' }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}
