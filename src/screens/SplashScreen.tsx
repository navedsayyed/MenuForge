import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../features/auth/services/authService';
import { RootStackParamList } from '../types/navigation';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const user = await authService.getCurrentUser();

      if (user) {
        navigation.replace('Main', { screen: 'DashboardTab' });
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Splash screen error:', error);
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />

      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🍽️</Text>
          </View>
          <Text style={styles.appName}>Restaurant Admin</Text>
          <Text style={styles.tagline}>Manage your dishes with ease</Text>
        </View>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Appwrite</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B6B',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)'
  },
  iconText: {
    fontSize: 60
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center'
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center'
  },
  loaderContainer: {
    alignItems: 'center',
    marginTop: 40
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500'
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 10
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14
  }
});

export default SplashScreen;
