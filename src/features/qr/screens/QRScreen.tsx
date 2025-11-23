import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import { CopyIcon, DownloadIcon, ShareIcon } from '../../../components/common/Icons';
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

type TemplateType = 'classic' | 'modern' | 'minimal';

const { width } = Dimensions.get('window');

const QRScreen: React.FC<Props> = ({ navigation }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [menuUrl, setMenuUrl] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');

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
        // In a real app, this would be a dynamic link
        const url = `${APP_CONFIG.WEB_URL}/menu/${user.restaurantId}`;
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
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    // In a real app, use Clipboard.setString(menuUrl);
    Alert.alert('Copied!', 'Menu URL copied to clipboard.');
  };

  const handleDownloadMenu = async () => {
    try {
      setGenerating(true);
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await Share.open({
          url: uri,
          title: 'Save Menu',
          message: `Check out the menu for ${userData?.restaurantName}!`,
          type: 'image/jpeg',
        });
      }
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to save menu image');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleShareMenu = async () => {
    try {
      setGenerating(true);
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await Share.open({
          url: uri,
          title: 'Share Menu',
          message: `Check out the menu for ${userData?.restaurantName}!`,
          type: 'image/jpeg',
        });
      }
    } catch (error: any) {
    } finally {
      setGenerating(false);
    }
  };

  const renderTemplateSelector = () => (
    <View style={styles.templateSelector}>
      <Text style={styles.sectionTitle}>Choose Style</Text>
      <View style={styles.templateButtons}>
        {(['classic', 'modern', 'minimal'] as TemplateType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.templateButton,
              selectedTemplate === type && styles.templateButtonActive
            ]}
            onPress={() => setSelectedTemplate(type)}
          >
            <Text style={[
              styles.templateButtonText,
              selectedTemplate === type && styles.templateButtonTextActive
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPreview = () => {
    if (!userData) return null;

    // Template Styles
    const isModern = selectedTemplate === 'modern';
    const isMinimal = selectedTemplate === 'minimal';
    const isClassic = selectedTemplate === 'classic';

    const bgColors = {
      classic: '#FFFFFF',
      modern: '#2C3E50',
      minimal: '#F8F9FA'
    };

    const textColors = {
      classic: '#2C3E50',
      modern: '#FFFFFF',
      minimal: '#333333'
    };

    const accentColor = '#FF6B6B';

    return (
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 1.0 }}
        style={[
          styles.previewCard,
          { backgroundColor: bgColors[selectedTemplate] }
        ]}
      >
        {/* Header Decoration */}
        {isModern && (
          <View style={styles.modernHeaderDeco} />
        )}

        <View style={styles.previewContent}>
          {/* Restaurant Info */}
          <View style={styles.previewHeader}>
            <Text style={[
              styles.previewTitle,
              { color: textColors[selectedTemplate] },
              isMinimal && { fontWeight: '300', letterSpacing: 2 }
            ]}>
              {userData.restaurantName}
            </Text>
            <Text style={[
              styles.previewSubtitle,
              { color: isModern ? '#BDC3C7' : '#7F8C8D' }
            ]}>
              Scan to view our digital menu
            </Text>
          </View>

          {/* QR Code */}
          <View style={[
            styles.qrContainer,
            isModern && styles.qrContainerModern,
            isClassic && styles.qrContainerClassic,
            isMinimal && styles.qrContainerMinimal
          ]}>
            <QRCode
              value={menuUrl || 'https://example.com'}
              size={180}
              color={isModern ? '#2C3E50' : '#000000'}
              backgroundColor="#FFFFFF"
              quietZone={10}
            />
            {/* Logo Overlay (Optional) */}
            <View style={styles.qrLogoOverlay}>
              <Text style={{ fontSize: 24 }}>🍽️</Text>
            </View>
          </View>

          {/* Footer / Call to Action */}
          <View style={styles.previewFooter}>
            <Text style={[
              styles.previewFooterText,
              { color: isModern ? '#ECF0F1' : '#2C3E50' }
            ]}>
              {dishes.length} Dishes Available
            </Text>

            {!isMinimal && (
              <View style={[
                styles.divider,
                { backgroundColor: isModern ? 'rgba(255,255,255,0.2)' : '#E0E0E0' }
              ]} />
            )}

            <Text style={[
              styles.urlText,
              { color: accentColor }
            ]}>
              {APP_CONFIG.WEB_URL.replace('https://', '')}
            </Text>
          </View>
        </View>
      </ViewShot>
    );
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>Menu Generator</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {renderTemplateSelector()}

        <Text style={styles.sectionTitle}>Live Preview</Text>
        <View style={styles.previewContainer}>
          {renderPreview()}
        </View>

        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleDownloadMenu}
            disabled={generating}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <DownloadIcon color="#2ECC71" width={24} height={24} />
            </View>
            <Text style={styles.actionText}>Save Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleShareMenu}
            disabled={generating}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <ShareIcon color="#3498DB" width={24} height={24} />
            </View>
            <Text style={styles.actionText}>Share Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCopyUrl}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
              <CopyIcon color="#F39C12" width={24} height={24} />
            </View>
            <Text style={styles.actionText}>Copy Link</Text>
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
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
    marginLeft: 4
  },
  templateSelector: {
    marginBottom: 24
  },
  templateButtons: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  templateButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  templateButtonActive: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  templateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D'
  },
  templateButtonTextActive: {
    color: '#FFFFFF'
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  previewCard: {
    width: width - 60,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden'
  },
  modernHeaderDeco: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#FF6B6B'
  },
  previewContent: {
    width: '100%',
    alignItems: 'center'
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 24
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  previewSubtitle: {
    fontSize: 13,
    textAlign: 'center'
  },
  qrContainer: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    position: 'relative'
  },
  qrContainerModern: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  qrContainerClassic: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8
  },
  qrContainerMinimal: {
    padding: 0,
    backgroundColor: 'transparent'
  },
  qrLogoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  previewFooter: {
    width: '100%',
    alignItems: 'center'
  },
  previewFooterText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12
  },
  divider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginBottom: 12
  },
  urlText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50'
  }
});

export default QRScreen;
