// src/screens/LoginScreen.tsx
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EyeIcon } from '../../../components/icons/EyeIcon';
import { EyeOffIcon } from '../../../components/icons/EyeOffIcon';
import { COLORS } from '../../../constants/colors';
import { RootStackParamList } from '../../../types/navigation';
import authService from '../../auth/services/authService';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const headerHeight = useRef(new Animated.Value(180)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const user = await authService.login(email.trim(), password);
      console.log('Login successful:', user);
      navigation.replace('Main', { screen: 'DashboardTab' });
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const navigateToSignup = () => {
    navigation.navigate('Signup');
  };

  const handleForgotPassword = async () => {
    console.log('Forgot Password button clicked');
    if (!email.trim()) {
      console.log('Email is empty');
      Alert.alert('Forgot Password', 'Please enter your email address in the email field first.');
      return;
    }

    if (!validateEmail(email)) {
      console.log('Email is invalid:', email);
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      console.log('Attempting to send reset email to:', email);
      setLoading(true);
      await authService.sendPasswordResetEmail(email.trim());
      console.log('Reset email sent successfully');
      Alert.alert(
        'Success',
        'Password reset email sent! Please check your inbox and follow the instructions to reset your password.'
      );
    } catch (error: any) {
      console.error('Forgot password error caught:', error);
      Alert.alert('Error', error.message || 'Failed to send password reset email');
    } finally {
      console.log('Finished forgot password flow');
      setLoading(false);
    }
  };

  const handleFocus = () => {
    Animated.parallel([
      Animated.timing(headerHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false
      })
    ]).start();
  };

  const handleBlur = () => {
    Animated.parallel([
      Animated.timing(headerHeight, {
        toValue: 180,
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      })
    ]).start();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0F2F5' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#F0F2F5" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Header (Logo) */}
          <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity, overflow: 'hidden' }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🍽️</Text>
            </View>
            <Text style={styles.appName}>Restrodent Admin</Text>
          </Animated.View>

          {/* Login Card (The Box) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#95A5A6"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#95A5A6"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeIcon size={20} color="#7F8C8D" />
                    ) : (
                      <EyeOffIcon size={20} color="#7F8C8D" />
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                  Don't have an account?{' '}
                  <Text style={styles.signupLink} onPress={navigateToSignup}>Sign Up</Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5'
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%'
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  icon: {
    fontSize: 40
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50'
  },
  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  cardHeader: {
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D'
  },
  form: {
    width: '100%'
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    color: '#2C3E50'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#2C3E50'
  },
  eyeButton: {
    padding: 15
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8
  },
  forgotPasswordText: {
    color: COLORS.primary, // Using theme primary color
    fontSize: 14,
    fontWeight: '600'
  },
  loginButton: {
    backgroundColor: COLORS.primary, // Using theme primary color
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  loginButtonDisabled: {
    backgroundColor: '#FFB8B8'
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  signupContainer: {
    alignItems: 'center',
    marginTop: 24
  },
  signupText: {
    fontSize: 16,
    color: '#7F8C8D'
  },
  signupLink: {
    color: COLORS.primary, // Using theme primary color
    fontWeight: 'bold'
  }
});

export default LoginScreen;
