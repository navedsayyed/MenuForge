// src/screens/ProfileScreen.tsx
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
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
import { APPWRITE_CONFIG, databases } from '../../../api/client/appwrite';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../../auth/services/authService';
import { User } from '../../../types';
import { MainTabParamList, RootStackParamList } from '../../../types/navigation';

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
  const { themeMode, setThemeMode, isDark, colors } = useTheme();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
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

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showSettings ? 0 : Dimensions.get('window').width,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [showSettings]);

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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.primary} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => setShowSettings(!showSettings)}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* User Info Section */}
          <View style={[styles.userSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {userData?.name?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>{userData?.name}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{userData?.email}</Text>
          </View>



          {/* Restaurant Information Form */}
          <View style={[styles.formSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🏪 Restaurant Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Restaurant Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={restaurantInfo.name}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, name: text})}
                placeholder="Enter restaurant name"
                placeholderTextColor={colors.inactive}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={restaurantInfo.address}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, address: text})}
                placeholder="Enter full address"
                placeholderTextColor={colors.inactive}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={restaurantInfo.phone}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, phone: text})}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor={colors.inactive}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Operating Hours</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={restaurantInfo.timing}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, timing: text})}
                placeholder="e.g., Mon-Sun: 10:00 AM - 10:00 PM"
                placeholderTextColor={colors.inactive}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Location / Area</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={restaurantInfo.location}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, location: text})}
                placeholder="e.g., MG Road, Bangalore"
                placeholderTextColor={colors.inactive}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={restaurantInfo.description}
                onChangeText={(text) => setRestaurantInfo({...restaurantInfo, description: text})}
                placeholder="Tell customers about your restaurant"
                placeholderTextColor={colors.inactive}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.saveButtonDisabled]}
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
            style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.error }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutButtonText, { color: colors.error }]}>🚪 Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Settings Drawer Overlay */}
      {showSettings && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowSettings(false)}
        >
          <View style={{ flex: 1 }} />
        </TouchableOpacity>
      )}

      {/* Settings Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.background,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <View style={[styles.drawerHeader, { backgroundColor: colors.primary, borderBottomColor: colors.border }]}>
          <Text style={styles.drawerTitle}>⚙️ Settings</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.drawerContent}>
          <View style={styles.drawerSection}>
            <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>Coming Soon...</Text>
          </View>
        </ScrollView>
      </Animated.View>
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
    justifyContent: 'flex-start',
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
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingsButtonText: {
    fontSize: 24,
    color: '#FFFFFF'
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1
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
  settingsSection: {
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
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  themeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative'
  },
  themeOptionActive: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)'
  },
  themeIcon: {
    fontSize: 28,
    marginBottom: 8
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600'
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold'
  },
  themeHint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  drawerContent: {
    flex: 1
  },
  drawerSection: {
    padding: 20
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  comingSoonText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 40
  }
});

export default ProfileScreen;
