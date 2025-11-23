import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import RNPrint from 'react-native-print';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, ShareIcon } from '../../../components/common/Icons';
import { APP_CONFIG } from '../../../constants/config';
import { Dish, User } from '../../../types';
import { MainTabParamList, RootStackParamList } from '../../../types/navigation';
import authService from '../../auth/services/authService';
import dishService from '../../dishes/services/dishService';

type QRScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'QRTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: QRScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');
// A4 Aspect Ratio is roughly 1:1.414
const PAGE_WIDTH = width - 40;
const PAGE_HEIGHT = PAGE_WIDTH * 1.414;

const QRScreen: React.FC<Props> = ({ navigation }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [availableDishes, setAvailableDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const viewShotRef = useRef<ViewShot>(null);
  const insets = useSafeAreaInsets();

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
      // Filter only available dishes
      const active = fetchedDishes.filter((d: Dish) => d.isAvailable);
      setAvailableDishes(active);
    } catch (error) {
      console.error('Fetch dishes error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chunk dishes into groups of 3
  const pages: Dish[][] = [];
  for (let i = 0; i < availableDishes.length; i += 3) {
    pages.push(availableDishes.slice(i, i + 3));
  }

  const generateFullMenuPDF = async () => {
    try {
      setGenerating(true);

      let htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page {
                margin: 20px;
              }
              body { 
                font-family: 'Helvetica', 'Arial', sans-serif; 
                margin: 0; 
                padding: 0;
                background: white;
              }
              .page { 
                page-break-after: always; 
                padding: 30px 20px;
              }
              .page:last-child {
                page-break-after: auto;
              }
              .header { 
                text-align: center; 
                border-bottom: 3px solid #FF6B6B; 
                padding-bottom: 15px; 
                margin-bottom: 25px; 
              }
              .restaurant-name { 
                font-size: 28px; 
                font-weight: bold; 
                color: #2C3E50; 
                text-transform: uppercase; 
                letter-spacing: 2px;
                margin: 0 0 8px 0;
              }
              .subtitle { 
                font-size: 12px; 
                color: #7F8C8D; 
                margin: 0;
                font-style: italic;
              }
              .dish-row { 
                display: flex; 
                align-items: center; 
                margin-bottom: 25px; 
                border-bottom: 1px solid #E0E0E0; 
                padding-bottom: 20px;
                page-break-inside: avoid;
              }
              .dish-image {
                width: 100px;
                height: 100px;
                border-radius: 8px;
                object-fit: cover;
                margin-right: 15px;
                background-color: #F0F0F0;
              }
              .dish-details { 
                flex: 1;
              }
              .dish-name { 
                font-size: 18px; 
                font-weight: bold; 
                color: #2C3E50; 
                margin: 0 0 5px 0;
              }
              .dish-category { 
                font-size: 11px; 
                color: #FF6B6B; 
                font-weight: bold; 
                text-transform: uppercase; 
                margin: 0 0 5px 0;
              }
              .dish-price { 
                font-size: 16px; 
                font-weight: bold; 
                color: #2C3E50;
                margin: 0;
              }
              .qr-code {
                width: 80px;
                height: 80px;
                margin-left: 15px;
              }
              .qr-label {
                font-size: 9px;
                color: #7F8C8D;
                text-align: center;
                margin-top: 5px;
              }
              .footer { 
                text-align: center;
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #E0E0E0;
                font-size: 11px;
                color: #95A5A6;
              }
              .website { 
                color: #FF6B6B; 
                font-weight: bold;
                margin-top: 5px;
              }
            </style>
          </head>
          <body>
      `;

      for (let i = 0; i < pages.length; i++) {
        const pageDishes = pages[i];
        htmlContent += `
          <div class="page">
            <div class="header">
              <h1 class="restaurant-name">${userData?.restaurantName || 'Restaurant Menu'}</h1>
              <p class="subtitle">Scan QR code to view dish photo - Page ${i + 1} of ${pages.length}</p>
            </div>
            
            <div class="dishes">
              ${pageDishes.map((dish: Dish) => `
                <div class="dish-row">
                  <img src="${dish.images || 'https://via.placeholder.com/100'}" class="dish-image" onerror="this.src='https://via.placeholder.com/100?text=No+Image'" />
                  <div class="dish-details">
                    <p class="dish-name">${dish.name}</p>
                    <p class="dish-category">${dish.category}</p>
                    <p class="dish-price">₹${dish.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(dish.images || 'https://example.com')}" class="qr-code" />
                    <p class="qr-label">Scan Me</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="footer">
              <div>Page ${i + 1} of ${pages.length}</div>
              <div class="website">${APP_CONFIG.WEB_URL.replace('https://', '')}</div>
            </div>
          </div>
        `;
      }

      htmlContent += `</body></html>`;

      await RNPrint.print({
        html: htmlContent,
      });

    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      Alert.alert('Error', 'Failed to generate PDF menu');
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePage = async () => {
    try {
      setGenerating(true);
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await Share.open({
          url: uri,
          title: 'Save Menu Page',
          message: `Menu Page ${currentPage + 1} - ${userData?.restaurantName}`,
          type: 'image/jpeg',
        });
      }
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to save menu page');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSharePage = async () => {
    try {
      setGenerating(true);
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await Share.open({
          url: uri,
          title: 'Share Menu Page',
          message: `Check out our menu! Page ${currentPage + 1}`,
          type: 'image/jpeg',
        });
      }
    } catch (error: any) {
      // Ignore user cancelled
    } finally {
      setGenerating(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const renderMenuPage = ({ item: pageDishes, index }: { item: Dish[], index: number }) => {
    return (
      <View style={styles.pageContainer}>
        <View style={styles.menuHeader}>
          <Text style={styles.restaurantName}>{userData?.restaurantName}</Text>
          <Text style={styles.menuSubtitle}>Scan QR code to see dish photo</Text>
        </View>

        <View style={styles.dishesContainer}>
          {pageDishes.map((dish) => (
            <View key={dish.$id} style={styles.dishRow}>
              {/* Dish Image */}
              <View style={styles.dishImageContainer}>
                {dish.images ? (
                  <Image source={{ uri: dish.images }} style={styles.dishImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.dishImage, styles.placeholderImage]} />
                )}
              </View>

              {/* Dish Details */}
              <View style={styles.dishDetails}>
                <Text style={styles.dishName} numberOfLines={2}>{dish.name}</Text>
                <Text style={styles.dishCategory}>{dish.category}</Text>
                <Text style={styles.dishPrice}>₹{dish.price.toFixed(2)}</Text>
              </View>

              {/* QR Code */}
              <View style={styles.qrContainer}>
                <QRCode
                  value={dish.images || 'https://example.com'}
                  size={80}
                  color="#2C3E50"
                  backgroundColor="#FFFFFF"
                />
                <Text style={styles.scanMeText}>Scan Me</Text>
              </View>
            </View>
          ))}

          {/* Fill empty spots if less than 3 dishes */}
          {Array.from({ length: 3 - pageDishes.length }).map((_, i) => (
            <View key={`empty-${i}`} style={[styles.dishRow, { opacity: 0 }]} />
          ))}
        </View>

        <View style={styles.pageFooter}>
          <Text style={styles.pageNumber}>Page {index + 1} of {pages.length}</Text>
          <Text style={styles.websiteUrl}>{APP_CONFIG.WEB_URL.replace('https://', '')}</Text>
        </View>
      </View>
    );
  };

  if (loading && !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (availableDishes.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.headerTitle}>Menu Generator</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No available dishes found.</Text>
          <Text style={styles.emptySubtext}>Mark dishes as 'Available' in the Dashboard to generate a menu.</Text>
        </View>
      </View>
    );
  }

  const currentDishes = pages[currentPage] || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>Menu Generator</Text>
        <Text style={styles.headerSubtitle}>{availableDishes.length} Available Dishes</Text>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Menu Page Preview */}
        <View style={styles.previewWrapper}>
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }} style={{ backgroundColor: '#fff' }}>
            {renderMenuPage({ item: currentDishes, index: currentPage })}
          </ViewShot>
        </View>

        {/* Navigation Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
            onPress={handlePrevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeftIcon color={currentPage === 0 ? "#BDC3C7" : "#2C3E50"} width={24} height={24} />
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>
            Page {currentPage + 1} of {pages.length}
          </Text>

          <TouchableOpacity
            style={[styles.navButton, currentPage === pages.length - 1 && styles.navButtonDisabled]}
            onPress={handleNextPage}
            disabled={currentPage === pages.length - 1}
          >
            <ChevronRightIcon color={currentPage === pages.length - 1 ? "#BDC3C7" : "#2C3E50"} width={24} height={24} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleSavePage}
            disabled={generating}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <DownloadIcon color="#2ECC71" width={24} height={24} />
            </View>
            <Text style={styles.actionText}>Save Page</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={generateFullMenuPDF}
            disabled={generating}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
              <DownloadIcon color="#FF9800" width={24} height={24} />
            </View>
            <Text style={styles.actionText}>Full PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleSharePage}
            disabled={generating}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <ShareIcon color="#3498DB" width={24} height={24} />
            </View>
            <Text style={styles.actionText}>Share Page</Text>
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
    alignItems: 'center',
    backgroundColor: '#F8F9FA'
  },
  header: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40
  },
  previewWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20
  },
  pageContainer: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'space-between'
  },
  menuHeader: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
    paddingBottom: 15,
    marginBottom: 10
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 5,
    fontStyle: 'italic'
  },
  dishesContainer: {
    flex: 1,
    justifyContent: 'space-evenly'
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    height: '30%'
  },
  dishImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0'
  },
  dishImage: {
    width: '100%',
    height: '100%'
  },
  placeholderImage: {
    backgroundColor: '#E0E0E0'
  },
  dishDetails: {
    flex: 1,
    paddingHorizontal: 15,
    justifyContent: 'center'
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4
  },
  dishCategory: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  dishPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50'
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  scanMeText: {
    fontSize: 8,
    color: '#7F8C8D',
    marginTop: 4,
    fontWeight: '600'
  },
  pageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginTop: 10
  },
  pageNumber: {
    fontSize: 10,
    color: '#95A5A6'
  },
  websiteUrl: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: 'bold'
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20
  },
  navButton: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  navButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5'
  },
  pageIndicator: {
    marginHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50'
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 15,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'center'
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: 120
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center'
  }
});

export default QRScreen;
