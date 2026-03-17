// src/screens/AddDishScreen.tsx
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackIcon, CameraIcon, GalleryIcon } from '../../../components/common/Icons';
import { Category } from '../../../types';
import { RootStackParamList } from '../../../types/navigation';
import authService from '../../auth/services/authService';
import dishService from '../services/dishService';

type AddDishScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddDish'>;

interface Props {
  navigation: AddDishScreenNavigationProp;
}

const AddDishScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const categories: Category[] = ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Other'];

  const pickImages = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 5 - images.length,
        quality: 0.8,
      });

      if (result.assets) {
        const newImages = result.assets
          .map((asset: Asset) => asset.uri)
          .filter((uri): uri is string => uri !== undefined);

        if (images.length + newImages.length > 5) {
          Alert.alert('Limit Exceeded', 'You can only upload up to 5 images');
          return;
        }

        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      });

      if (result.assets && result.assets.length > 0) {
        if (images.length >= 5) {
          Alert.alert('Limit Exceeded', 'You can only upload up to 5 images');
          return;
        }

        const photoUri = result.assets[0].uri;
        if (photoUri) {
          setImages([...images, photoUri]);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter dish name');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter description');
      return false;
    }

    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return false;
    }

    if (!category) {
      Alert.alert('Validation Error', 'Please select a category');
      return false;
    }

    if (images.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one image');
      return false;
    }

    return true;
  };

  const handleAddDish = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const user = await authService.getCurrentUser();

      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        navigation.replace('Login');
        return;
      }

      const dishData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category as Category,
        isAvailable: true
      };

      await dishService.addDish(user.restaurantId, dishData, images);

      Alert.alert(
        'Success',
        'Dish added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Add dish error:', error);
      Alert.alert('Error', error.message || 'Failed to add dish');
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon color="#FFFFFF" width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Dish</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dish Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter dish name"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter dish description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive
                ]}
                onPress={() => setCategory(cat)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Images * (Max 5)</Text>

          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickImages}
              disabled={loading || images.length >= 5}
            >
              <GalleryIcon color="#2C3E50" width={24} height={24} style={{ marginBottom: 5 }} />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageButton}
              onPress={takePhoto}
              disabled={loading || images.length >= 5}
            >
              <CameraIcon color="#2C3E50" width={24} height={24} style={{ marginBottom: 5 }} />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.imageHint}>
            {images.length}/5 images selected
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleAddDish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Add Dish</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    backgroundColor: '#E8480A',
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
    flex: 1,
    padding: 20
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  textArea: {
    height: 100,
    paddingTop: 15
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  categoryButtonActive: {
    backgroundColor: '#E8480A',
    borderColor: '#E8480A'
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600'
  },
  categoryButtonTextActive: {
    color: '#FFFFFF'
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15
  },
  imageItem: {
    position: 'relative',
    width: 100,
    height: 100
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center'
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  imageButtonIcon: {
    fontSize: 30,
    marginBottom: 5
  },
  imageButtonText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600'
  },
  imageHint: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center'
  },
  submitButton: {
    backgroundColor: '#E8480A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#E8480A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  submitButtonDisabled: {
    backgroundColor: '#FFB8B8'
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  bottomPadding: {
    height: 30
  }
});

export default AddDishScreen;
