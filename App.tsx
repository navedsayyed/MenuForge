import React from 'react';
import { LogBox, StatusBar } from 'react-native';
import 'react-native-url-polyfill/auto';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// ============================================
// Main App Component
// ============================================

export default function App() {
  return (
    <ThemeProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator />
    </ThemeProvider>
  );
}
