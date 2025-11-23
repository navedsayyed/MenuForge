// src/services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { account, APPWRITE_CONFIG, databases, ID } from '../../../api/client/appwrite';
import { User } from '../../../types';

// ============================================
// Authentication Service
// ============================================

// DEVELOPMENT MODE: Set to true to always show login screen on app reload
// Set to false for production (sessions will persist)
const DEV_MODE = false; // Change to false for production

// Track if we've already handled the DEV_MODE logout for this session
let hasDevModeRun = false;

const authService = {
  /**
   * Sign up new restaurant owner
   */
  async signup(name: string, email: string, password: string): Promise<User> {
    try {
      // Create account
      const userId = ID.unique();
      const user = await account.create(userId, email, password, name);

      // Create email session (auto login)
      await account.createEmailSession(email, password);

      // Create restaurant document matching Appwrite collection structure
      const restaurantId = user.$id; // Use userId as restaurantId for linking
      const restaurant = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.restaurantsCollectionId,
        restaurantId,
        {
          address: 'Not specified',
          phoneNumber: 'Not specified',
          operatingHours: 'Not specified',
          cuisineType: '',
          priceRange: ''
        }
      );

      // Save restaurant data locally
      const userData: User = {
        userId: user.$id,
        email: user.email,
        name: user.name,
        restaurantId: restaurant.$id,
        restaurantName: user.name
      };

      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      return userData;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  },

  /**
   * Login restaurant owner
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // Delete any existing session first
      try {
        await account.deleteSession('current');
      } catch (e) {
        // No active session, continue
      }

      // Create email session
      await account.createEmailSession(email, password);

      // Get user account details
      const user = await account.get();

      // Get restaurant data using userId
      const restaurants = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.restaurantsCollectionId
      );

      // Find restaurant by ID (we use userId as restaurantId for linking)
      let restaurant = restaurants.documents.find((r: any) => r.$id === user.$id);

      // If not found, create restaurant record matching collection structure
      if (!restaurant) {
        const restaurantId = user.$id; // Use userId as restaurantId for linking
        restaurant = await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.restaurantsCollectionId,
          restaurantId,
          {
            address: 'Not specified',
            phoneNumber: 'Not specified',
            operatingHours: 'Not specified',
            cuisineType: '',
            priceRange: ''
          }
        );
      }

      // Save user data locally
      const userData: User = {
        userId: user.$id,
        email: user.email,
        name: user.name,
        restaurantId: restaurant.$id,
        restaurantName: user.name
      };

      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      return userData;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Get current logged-in user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // In development mode, clear sessions ONLY ONCE per app reload
      if (DEV_MODE && !hasDevModeRun) {
        console.log('DEV_MODE: Clearing session for fresh login...');
        try {
          await account.deleteSession('current');
        } catch (e) {
          // No session to delete
        }
        await AsyncStorage.removeItem('userData');
        hasDevModeRun = true; // Mark as run so we don't clear it again this session
        return null;
      }

      // 1. Check local storage FIRST (Fastest & works offline)
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        return JSON.parse(userDataString);
      }

      // 2. If no local data, check Appwrite session
      try {
        await account.get();
        // We have a session but no local data. 
        // Ideally we should fetch the restaurant data here to reconstruct userData.
        // For now, we'll return null to force re-login to ensure data consistency.
        return null;
      } catch (error) {
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<boolean> {
    try {
      // Delete current session
      await account.deleteSession('current');

      // Clear local storage
      await AsyncStorage.removeItem('userData');

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage even if API call fails
      await AsyncStorage.removeItem('userData');
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await account.get();
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      // Using google.com as redirect URL since we don't have deep linking set up yet
      // The user will receive an email with a link to reset their password
      await account.createRecovery(email, 'https://google.com');
    } catch (error: any) {
      console.error('Send password reset email error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },

  /**
   * Update user password
   */
  async updatePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      await account.updatePassword(newPassword, oldPassword);
      return true;
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'Password update failed');
    }
  }
};

export default authService;
