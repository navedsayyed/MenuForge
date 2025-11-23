// src/screens/DashboardScreen.tsx
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeleteIcon, DishIcon, EditIcon, PlusIcon, SearchIcon } from '../../../components/common/Icons';
import ToggleSwitch from '../../../components/common/ToggleSwitch';
import { Dish, User } from '../../../types';
import { MainTabParamList, RootStackParamList } from '../../../types/navigation';
import authService from '../../auth/services/authService';
import dishService from '../services/dishService';

type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'DashboardTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [statusBarStyle, setStatusBarStyle] = useState<'light-content' | 'dark-content'>('light-content');

  const insets = useSafeAreaInsets();

  // Animation Values
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 200;
  // Dynamic height: Top inset + 80 (50px search bar + 15px padding top/bottom)
  const HEADER_MIN_HEIGHT = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 40 : 20)) + 80;
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // Use focus effect to ensure status bar is transparent on Android
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent');
      }
    }, [])
  );

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const shouldBeDark = value > SCROLL_DISTANCE / 2;
      // Imperatively update for faster/more reliable response
      StatusBar.setBarStyle(shouldBeDark ? 'dark-content' : 'light-content');
      setStatusBarStyle(shouldBeDark ? 'dark-content' : 'light-content');
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [SCROLL_DISTANCE]);

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
      setDishes(fetchedDishes);
    } catch (error) {
      console.error('Fetch dishes error:', error);
      Alert.alert('Error', 'Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDishes();
    setRefreshing(false);
  }, [userData]);

  const handleDeleteDish = (dish: Dish) => {
    Alert.alert(
      'Delete Dish',
      `Are you sure you want to delete "${dish.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!userData) {
                Alert.alert('Error', 'User not authenticated');
                return;
              }
              await dishService.deleteDish(userData.restaurantId, dish.$id);
              Alert.alert('Success', 'Dish deleted successfully');
              fetchDishes();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete dish');
            }
          }
        }
      ]
    );
  };

  const handleToggleAvailability = async (dish: Dish, newValue: boolean) => {
    try {
      // Optimistic update
      const updatedDishes = dishes.map(d =>
        d.$id === dish.$id ? { ...d, isAvailable: newValue } : d
      );
      setDishes(updatedDishes);

      await dishService.toggleAvailability(dish.$id, newValue);
    } catch (error) {
      console.error('Toggle availability error:', error);
      Alert.alert('Error', 'Failed to update availability');
      fetchDishes(); // Revert on error
    }
  };

  const renderDishCard = ({ item }: { item: Dish }) => {
    // images is stored as a single URL string in the database
    const imageUrl = item.images || null;

    return (
      <View style={styles.dishCard}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.dishImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <DishIcon color="#CBD5E0" width={50} height={50} />
            </View>
          )}

          <View style={[
            styles.availabilityBadge,
            item.isAvailable ? styles.availableBadge : styles.unavailableBadge
          ]}>
            <Text style={styles.badgeText}>
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>

        <View style={styles.dishInfo}>
          <Text style={styles.dishName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.dishCategory}>{item.category}</Text>
          <Text style={styles.dishDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.dishPrice}>₹{item.price.toFixed(2)}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('EditDish', { dish: item })}
          >
            <EditIcon color="#4A5568" width={18} height={18} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <View style={[styles.actionButton, styles.toggleContainer]}>
            <ToggleSwitch
              value={item.isAvailable}
              onValueChange={(val) => handleToggleAvailability(item, val)}
            />
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteDish(item)}
          >
            <DeleteIcon color="#E53E3E" width={18} height={18} />
            <Text style={[styles.actionButtonText, { color: '#E53E3E' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <DishIcon color="#CBD5E0" width={80} height={80} />
      <Text style={styles.emptyTitle}>No Dishes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start adding dishes to your menu
      </Text>
    </View>
  );

  // Animation Interpolations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp'
  });

  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: ['#FF6B6B', '#FFFFFF'],
    extrapolate: 'clamp'
  });

  const headerTitleColor = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: ['#FFFFFF', '#2C3E50'],
    extrapolate: 'clamp'
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const headerSubtitleOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const searchBarWidth = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: ['100%', '90%'],
    extrapolate: 'clamp'
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading dishes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            backgroundColor: headerBackgroundColor,
            zIndex: 1000,
            elevation: 5
          }
        ]}
      >
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <View>
                <Animated.Text style={[styles.headerTitle, { opacity: headerTitleOpacity, color: '#FFFFFF' }]}>
                  My Dishes
                </Animated.Text>
                <Animated.Text style={[styles.headerSubtitle, { opacity: headerSubtitleOpacity }]}>
                  {userData?.restaurantName || 'Restaurant'}
                </Animated.Text>
              </View>
              {/* Add profile/actions here if needed */}
            </View>

            {/* Search Bar */}
            <Animated.View
              style={[
                styles.searchContainer,
                {
                  width: searchBarWidth,
                  // transform: [{ translateY: searchBarY }] // Removed translation
                }
              ]}
            >
              <SearchIcon color="#95A5A6" width={20} height={20} style={{ marginRight: 10 }} />
              <Text style={styles.searchText}>Search "Biryani"...</Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Content */}
      <Animated.FlatList
        data={dishes}
        renderItem={renderDishCard}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: HEADER_MAX_HEIGHT + 20 }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
        ListEmptyComponent={renderEmptyList}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDish')}
      >
        <PlusIcon color="#FFFFFF" width={28} height={28} />
      </TouchableOpacity>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7F8C8D'
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 15,
    justifyContent: 'flex-end'
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  searchText: {
    fontSize: 16,
    color: '#95A5A6'
  },
  listContent: {
    padding: 15,
    paddingBottom: 100
  },
  dishCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200
  },
  dishImage: {
    width: '100%',
    height: '100%'
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  availabilityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden'
  },
  availableBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.9)'
  },
  unavailableBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)'
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  dishInfo: {
    padding: 16
  },
  dishName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4
  },
  dishCategory: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  dishDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginBottom: 12
  },
  dishPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3748'
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    height: 50
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F7FAFC'
  },
  toggleContainer: {
    backgroundColor: '#FFFFFF'
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginLeft: 8
  },
  editButton: {
    backgroundColor: '#FFFFFF'
  },
  toggleButton: {
    backgroundColor: '#FFFFFF'
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
    borderRightWidth: 0
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  }
});

export default DashboardScreen;
