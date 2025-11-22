// src/services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { account, APPWRITE_CONFIG, databases, ID } from '../../../api/client/appwrite';
import { User } from '../../../types';

// ============================================
// Authentication Service
// ============================================

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

      // Find restaurant by ID (we use userId as restaurantId)
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
      // Try to get from local storage first
      const userData = await AsyncStorage.getItem('userData');

      if (userData) {
        // Verify session is still valid
        try {
          await account.get();
          return JSON.parse(userData);
        } catch (error) {
          // Session expired, clear local data
          await AsyncStorage.removeItem('userData');
          return null;
        }
      }

      return null;
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
