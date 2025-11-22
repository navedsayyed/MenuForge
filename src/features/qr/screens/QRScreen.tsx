import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import authService from '../../auth/services/authService';
import dishService from '../services/dishService';
import { Dish, User } from '../../../types';
import { MainTabParamList, RootStackParamList } from '../../../types/navigation';

type QRScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'QRTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: QRScreenNavigationProp;
}

const QRScreen: React.FC<Props> = ({ navigation }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [menuUrl, setMenuUrl] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchDishes();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserData(user);
        const url = `https://yourdomain.com/menu/${user.restaurantId}`;
        setMenuUrl(url);
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Load user error:', error);
      navigation.replace('Login');
    }
  };

  const fetchDishes = async () => {
    if (!userData) return;

    try {
      setLoading(true);
      const fetchedDishes = await dishService.getDishes(userData.restaurantId);
      setDishes(fetchedDishes);
    } catch (error) {
      console.error('Fetch dishes error:', error);
      Alert.alert('Error', 'Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    Alert.alert('Info', `Menu URL: ${menuUrl}`);
  };

  const handleDownloadMenu = async () => {
    try {
      setGenerating(true);

      // Capture the view as image
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();

        // Use react-native-share
        await Share.open({
          url: uri,
          title: 'Save or Share Menu',
          message: 'Check out our menu!',
          type: 'image/jpeg',
        });
        Alert.alert('Success', 'Menu image shared successfully!');
      }
    } catch (error: any) {
      console.error('Download menu error:', error);
      if (error.message !== 'User did not share') {
        Alert.alert('Error', `Failed to generate menu: ${error.message}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleShareMenu = async (uri?: string) => {
    try {
      let imageUri = uri;

      if (!imageUri && viewShotRef.current && viewShotRef.current.capture) {
        imageUri = await viewShotRef.current.capture();
      }

      if (imageUri) {
        await Share.open({
          url: imageUri,
          title: 'Share Menu',
          message: 'Check out our menu!',
          type: 'image/jpeg',
        });
      }
    } catch (error: any) {
      console.error('Share menu error:', error);
      if (error.message !== 'User did not share') {
        Alert.alert('Error', `Failed to share menu: ${error.message}`);
      }
    }
  };

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu & QR Code</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Printable Menu View */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'jpg', quality: 1.0 }}
          style={styles.menuPrintView}
        >
          {/* Restaurant Header */}
          <View style={styles.printHeader}>
            <Text style={styles.printRestaurantName}>{userData.restaurantName}</Text>
            <Text style={styles.printTagline}>Our Menu</Text>
            <View style={styles.printDivider} />
          </View>

          {/* QR Code Section */}
          <View style={styles.printQRSection}>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={menuUrl}
                size={120}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
            <Text style={styles.printQRText}>Scan for Digital Menu</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.printMenuItems}>
            {loading ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : dishes.length > 0 ? (
              <>
                {/* Group by category */}
                {['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Other'].map((category) => {
                  const categoryDishes = dishes.filter((d) => d.category === category);
                  if (categoryDishes.length === 0) return null;

                  return (
                    <View key={category} style={styles.printCategory}>
                      <Text style={styles.printCategoryTitle}>{category}</Text>
                      <View style={styles.printCategoryDivider} />

                      {categoryDishes.map((dish) => (
                        <View key={dish.$id} style={styles.printDishItem}>
                          <View style={styles.printDishInfo}>
                            <Text style={styles.printDishName}>{dish.name}</Text>
                            <Text style={styles.printDishDescription} numberOfLines={2}>
                              {dish.description}
                            </Text>
                          </View>
                          {dish.images && (
                            <Image
                              source={{ uri: dish.images }}
                              style={styles.printDishImage}
                              resizeMode="cover"
                            />
                          )}
                          <Text style={styles.printDishPrice}>₹{dish.price}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </>
            ) : (
              <Text style={styles.printNoDishes}>No dishes added yet</Text>
            )}
          </View>

          {/* Footer */}
          <View style={styles.printFooter}>
            <View style={styles.printDivider} />
            <Text style={styles.printFooterText}>Thank you for visiting!</Text>
            <Text style={styles.printUrlText}>{menuUrl}</Text>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.downloadButton]}
            onPress={handleDownloadMenu}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>💾 Download Menu</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => handleShareMenu()}
            disabled={generating}
          >
            <Text style={styles.actionButtonText}>📤 Share Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.copyButton]}
            onPress={handleCopyUrl}
          >
            <Text style={styles.actionButtonText}>📋 Copy URL</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1
  },
  content: {
    padding: 20
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10
  },
  infoText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  qrPlaceholderText: {
    fontSize: 80
  },
  qrPlaceholderLabel: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 10
  },
  qrLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600'
  },
  urlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10
  },
  urlContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15
  },
  urlText: {
    fontSize: 14,
    color: '#7F8C8D'
  },
  actionsContainer: {
    gap: 10
  },
  actionButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  downloadButton: {
    backgroundColor: '#4CAF50'
  },
  shareButton: {
    backgroundColor: '#2196F3'
  },
  copyButton: {
    backgroundColor: '#FF9800'
  },
  // Print Menu Styles
  menuPrintView: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    marginBottom: 20
  },
  printHeader: {
    alignItems: 'center',
    marginBottom: 25
  },
  printRestaurantName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8
  },
  printTagline: {
    fontSize: 18,
    color: '#7F8C8D',
    fontStyle: 'italic'
  },
  printDivider: {
    width: '100%',
    height: 2,
    backgroundColor: '#FF6B6B',
    marginTop: 15
  },
  printQRSection: {
    alignItems: 'center',
    marginVertical: 25,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15
  },
  qrCodeWrapper: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  printQRText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
    marginTop: 12
  },
  printMenuItems: {
    marginTop: 20
  },
  printCategory: {
    marginBottom: 30
  },
  printCategoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10
  },
  printCategoryDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#FF6B6B',
    marginBottom: 15
  },
  printDishItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    alignItems: 'center'
  },
  printDishInfo: {
    flex: 1,
    marginRight: 10
  },
  printDishName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4
  },
  printDishDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20
  },
  printDishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10
  },
  printDishPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    minWidth: 80,
    textAlign: 'right'
  },
  printNoDishes: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    padding: 40
  },
  printFooter: {
    alignItems: 'center',
    marginTop: 30
  },
  printFooterText: {
    fontSize: 16,
    color: '#2C3E50',
    marginVertical: 15
  },
  printUrlText: {
    fontSize: 12,
    color: '#7F8C8D'
  }
});

export default QRScreen;
