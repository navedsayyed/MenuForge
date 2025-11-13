// src/screens/QRScreen.tsx
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import authService from '../services/authService';
import { User } from '../types';
import { RootStackParamList } from '../types/navigation';

type QRScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QR'>;

interface Props {
  navigation: QRScreenNavigationProp;
}

const QRScreen: React.FC<Props> = ({ navigation }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [menuUrl, setMenuUrl] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

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

  const handleCopyUrl = () => {
    Alert.alert('Info', `Menu URL: ${menuUrl}`);
  };

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu QR Code</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.restaurantName}>{userData.restaurantName}</Text>
          <Text style={styles.infoText}>
            Share this QR code with your customers to let them view your menu
          </Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>📱</Text>
            <Text style={styles.qrPlaceholderLabel}>QR Code</Text>
          </View>
          <Text style={styles.qrLabel}>Scan to view menu</Text>
        </View>

        <View style={styles.urlCard}>
          <Text style={styles.urlLabel}>Menu URL</Text>
          <View style={styles.urlContainer}>
            <Text style={styles.urlText} numberOfLines={1}>
              {menuUrl}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
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
    justifyContent: 'space-between',
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
    color: '#FFFFFF'
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
  }
});

export default QRScreen;
