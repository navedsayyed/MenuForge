// src/navigation/AppNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

// Screens
// Screens
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
          height: 60 + (Platform.OS === 'android' ? insets.bottom : 0), // Add safe area inset
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0, // Push content up
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
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>🏠</Text>
          )
        }}
      />
      <Tab.Screen
        name="QRTab"
        component={QRScreen}
        options={{
          tabBarLabel: 'Generate QR',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>📱</Text>
          )
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>👤</Text>
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
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 4
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2
  },
  tabIcon: {
    marginBottom: 2
  },
  icon: {
    fontSize: 22,
    opacity: 0.5
  },
  iconActive: {
    opacity: 1
  }
});

export default AppNavigator;
