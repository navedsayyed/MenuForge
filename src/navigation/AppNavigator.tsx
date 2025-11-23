// src/navigation/AppNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

// Screens
// Screens
import { HomeIcon, QRIcon, UserIcon } from '../components/common/Icons';
import LoginScreen from '../features/auth/screens/LoginScreen';
import SignupScreen from '../features/auth/screens/SignupScreen';
import AddDishScreen from '../features/dishes/screens/AddDishScreen';
import DashboardScreen from '../features/dishes/screens/DashboardScreen';
import EditDishScreen from '../features/dishes/screens/EditDishScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import QRScreen from '../features/qr/screens/QRScreen';
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator for Dashboard, QR, and Profile
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: Platform.OS === 'android' ? 70 + insets.bottom : 90,
          paddingBottom: Platform.OS === 'android' ? insets.bottom + 10 : 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} width={24} height={24} strokeWidth={focused ? 2.5 : 2} />
          )
        }}
      />
      <Tab.Screen
        name="QRTab"
        component={QRScreen}
        options={{
          tabBarLabel: 'Generate QR',
          tabBarIcon: ({ color, focused }) => (
            <QRIcon color={color} width={24} height={24} strokeWidth={focused ? 2.5 : 2} />
          )
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <UserIcon color={color} width={24} height={24} strokeWidth={focused ? 2.5 : 2} />
          )
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AddDish" component={AddDishScreen} />
        <Stack.Screen name="EditDish" component={EditDishScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  tabIcon: {
    marginTop: 4
  },
  // Removed old icon styles
});

export default AppNavigator;
