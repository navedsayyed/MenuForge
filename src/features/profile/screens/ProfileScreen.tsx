import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APPWRITE_CONFIG, databases } from '../../../api/client/appwrite';
import {
  ChevronRightIcon,
  DishIcon,
  EditIcon,
  LogoutIcon,
  StarIcon,
  UserIcon
} from '../../../components/common/Icons';
import { APP_CONFIG } from '../../../constants/config';
import { useTheme } from '../../../providers/AuthProvider';
import { User } from '../../../types';
import { MainTabParamList, RootStackParamList } from '../../../types/navigation';
import authService from '../../auth/services/authService';

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
  const { themeMode, setThemeMode, isDark } = useTheme();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
    name: '',
    address: '',
    phone: '',
    timing: '',
    location: '',
    description: ''
  });
  const insets = useSafeAreaInsets();

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

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void,
    isLast?: boolean
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconContainer}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        {rightElement || <ChevronRightIcon color="#CBD5E0" width={20} height={20} />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData?.name || 'Owner'}</Text>
            <Text style={styles.restaurantName}>{restaurantInfo.name || 'Restaurant Name'}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userData?.name?.charAt(0).toUpperCase() || 'O'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Banner */}
        <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.9}>
          <View style={styles.premiumContent}>
            <View style={styles.premiumIconContainer}>
              <Text style={{ fontSize: 16 }}>👑</Text>
            </View>
            <View>
              <Text style={styles.premiumText}>Premium Plan</Text>
              <Text style={styles.premiumSubtext}>Active until Dec 2025</Text>
            </View>
          </View>
          <ChevronRightIcon color="#FFFFFF" width={20} height={20} />
        </TouchableOpacity>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{restaurantInfo.name ? '✓' : '✗'}</Text>
            <Text style={styles.statLabel}>Profile</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.8★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Restaurant Management */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIndicator} />
          <Text style={styles.sectionTitle}>Restaurant Management</Text>
        </View>

        <View style={styles.menuSection}>
          {renderMenuItem(
            <EditIcon color="#4A5568" width={22} height={22} />,
            "Restaurant Settings",
            "Edit name, address, hours",
            undefined,
            () => Alert.alert('Info', 'Restaurant settings coming soon!')
          )}

          {renderMenuItem(
            <DishIcon color="#4A5568" width={22} height={22} />,
            "Menu Management",
            "Manage dishes & categories",
            undefined,
            () => navigation.navigate('DashboardTab')
          )}

          {renderMenuItem(
            <Text style={{ fontSize: 20 }}>📊</Text>,
            "Analytics & Reports",
            "View sales & performance",
            undefined,
            () => Alert.alert('Info', 'Analytics coming soon!')
          )}

          {renderMenuItem(
            <Text style={{ fontSize: 20 }}>👥</Text>,
            "Staff Management",
            "Manage team access",
            undefined,
            () => Alert.alert('Info', 'Staff management coming soon!'),
            true
          )}
        </View>

        {/* Business Tools */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIndicator} />
          <Text style={styles.sectionTitle}>Business Tools</Text>
        </View>

        <View style={styles.menuSection}>
          {renderMenuItem(
            <Text style={{ fontSize: 20 }}>🎟️</Text>,
            "QR Code Generator",
            "Generate menu QR codes",
            undefined,
            () => navigation.navigate('QRTab')
          )}
          {renderMenuItem(
            <Text style={{ fontSize: 20 }}>💳</Text>,
            "Subscription & Billing",
            "Manage your plan",
            undefined,
            () => Alert.alert('Info', 'Billing coming soon!')
          )}
          {renderMenuItem(
            <Text style={{ fontSize: 20 }}>📢</Text>,
            "Promotions & Offers",
            "Create special deals",
            undefined,
            () => Alert.alert('Info', 'Promotions coming soon!'),
            true
          )}
        </View>

        {/* Settings & Support */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIndicator} />
          <Text style={styles.sectionTitle}>Settings & Support</Text>
        </View>

        <View style={styles.menuSection}>
          {renderMenuItem(
            <UserIcon color="#4A5568" width={22} height={22} />,
            "Account Settings",
            "Update profile & password",
            undefined,
            () => Alert.alert('Info', 'Account settings coming soon!')
          )}

          {renderMenuItem(
            <Text style={{ fontSize: 20 }}>🎨</Text>,
            "Appearance",
            isDark ? "Dark Mode" : "Light Mode",
            <Switch
              value={isDark}
              onValueChange={() => setThemeMode(isDark ? 'light' : 'dark')}
              trackColor={{ false: "#E2E8F0", true: "#C6F6D5" }}
              thumbColor={isDark ? "#48BB78" : "#F7FAFC"}
            />
          )}

          {renderMenuItem(
            <Text style={{ fontSize: 20 }}>�</Text>,
            "Notifications",
            "Manage alerts",
            undefined,
            () => Alert.alert('Info', 'Notification settings coming soon!')
          )}

          {renderMenuItem(
            <Text style={{ fontSize: 20 }}>❓</Text>,
            "Help & Support",
            "FAQs, Contact us",
            undefined,
            () => Alert.alert('Info', 'Support coming soon!')
          )}

          {renderMenuItem(
            <StarIcon color="#4A5568" width={22} height={22} />,
            "Rate Our App",
            "Share your feedback",
            undefined,
            () => Alert.alert('Thank you!', 'We appreciate your feedback!'),
            true
          )}
        </View>

        {/* Logout */}
        <View style={[styles.menuSection, { marginTop: 20, marginBottom: 40 }]}>
          {renderMenuItem(
            <LogoutIcon color="#E53E3E" width={22} height={22} />,
            "Logout",
            undefined,
            <ChevronRightIcon color="#E53E3E" width={20} height={20} />,
            handleLogout,
            true
          )}
        </View>

        <Text style={styles.versionText}>
          {APP_CONFIG.NAME} v{APP_CONFIG.VERSION}
        </Text>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA'
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6'
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4
  },
  restaurantName: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500'
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A5568'
  },
  scrollView: {
    flex: 1
  },
  premiumBanner: {
    margin: 16,
    backgroundColor: '#1A202C',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  premiumIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  premiumText: {
    color: '#F6E05E',
    fontSize: 16,
    fontWeight: 'bold'
  },
  premiumSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  statValue: {
    fontSize: 20,
    color: '#2D3748',
    fontWeight: 'bold',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
    textAlign: 'center'
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 24
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC'
  },
  menuItemLast: {
    borderBottomWidth: 0
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  menuTextContainer: {
    flex: 1
  },
  menuTitle: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500'
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12
  },
  sectionIndicator: {
    width: 3,
    height: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
    marginRight: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  versionText: {
    textAlign: 'center',
    color: '#CBD5E0',
    fontSize: 12,
    marginBottom: 20
  }
});

export default ProfileScreen;
