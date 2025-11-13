// src/screens/ProfileScreen.tsx
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { APPWRITE_CONFIG, databases } from '../config/appwrite';
import authService from '../services/authService';
import { User } from '../types';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'ProfileTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  timing: string;
  location: string;
  description: string;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
    name: '',
    address: '',
    phone: '',
    timing: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (user) {
        setUserData(user);
        await loadRestaurantInfo(user.restaurantId);
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Load user error:', error);
      navigation.replace('Login');
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantInfo = async (restaurantId: string) => {
    try {
      const response = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.restaurantsCollectionId,
        restaurantId
      );
      
      setRestaurantInfo({
        name: response.name || '',
        address: response.address || '',
        phone: response.phone || '',
        timing: response.timing || '',
        location: response.location || '',
        description: response.description || ''
      });
    } catch (error) {
      console.error('Load restaurant info error:', error);
    }
  };

  const handleSave = async () => {
    if (!userData) return;

    if (!restaurantInfo.name.trim()) {
      Alert.alert('Error', 'Restaurant name is required');
      return;
    }

    try {
      setSaving(true);
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.restaurantsCollectionId,
        userData.restaurantId,
        {
          name: restaurantInfo.name.trim(),
          address: restaurantInfo.address.trim(),
          phone: restaurantInfo.phone.trim(),
          timing: restaurantInfo.timing.trim(),
          location: restaurantInfo.location.trim(),
          description: restaurantInfo.description.trim()
        }
      );
      Alert.alert('Success', 'Restaurant information updated successfully');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to update restaurant information');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      
      <View style={styles.header}>
        <View style={styles.backButton} />
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* User Info Section */}
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userData?.name?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </View>
            <Text style={styles.userName}>{userData?.name}</Text>
            <Text style={styles.userEmail}>{userData?.email}</Text>
          </View>

          {/* Restaurant Information Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Restaurant Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Restaurant Name *</Text>
              <TextInput
                style={styles.input}
                value={restaurantInfo.name}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, name: text})}
                placeholder="Enter restaurant name"
                placeholderTextColor="#95A5A6"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={restaurantInfo.address}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, address: text})}
                placeholder="Enter full address"
                placeholderTextColor="#95A5A6"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={restaurantInfo.phone}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, phone: text})}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor="#95A5A6"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Operating Hours</Text>
              <TextInput
                style={styles.input}
                value={restaurantInfo.timing}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, timing: text})}
                placeholder="e.g., Mon-Sun: 10:00 AM - 10:00 PM"
                placeholderTextColor="#95A5A6"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location / Area</Text>
              <TextInput
                style={styles.input}
                value={restaurantInfo.location}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, location: text})}
                placeholder="e.g., MG Road, Bangalore"
                placeholderTextColor="#95A5A6"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={restaurantInfo.description}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, description: text})}
                placeholder="Tell customers about your restaurant"
                placeholderTextColor="#95A5A6"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>💾 Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  flex: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7F8C8D'
  },
  header: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  content: {
    padding: 20,
    paddingBottom: 100
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  avatarText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5
  },
  userEmail: {
    fontSize: 14,
    color: '#7F8C8D'
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E74C3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C'
  }
});

export default ProfileScreen;
