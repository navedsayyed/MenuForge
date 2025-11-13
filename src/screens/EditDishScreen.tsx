// src/screens/EditDishScreen.tsx
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
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
import authService from '../services/authService';
import dishService from '../services/dishService';
import { getImageUrl } from '../services/uploadService';
import { Category } from '../types';
import { RootStackParamList } from '../types/navigation';

type EditDishScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditDish'>;
type EditDishScreenRouteProp = RouteProp<RootStackParamList, 'EditDish'>;

interface Props {
  navigation: EditDishScreenNavigationProp;
  route: EditDishScreenRouteProp;
}

const EditDishScreen: React.FC<Props> = ({ navigation, route }) => {
  const { dish } = route.params;

  const [name, setName] = useState(dish.name);
  const [description, setDescription] = useState(dish.description);
  const [price, setPrice] = useState(dish.price.toString());
  const [category, setCategory] = useState<Category>(dish.category as Category);
  const [existingImages, setExistingImages] = useState<string[]>(dish.images || []);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const categories: Category[] = ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Other'];

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload images');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const totalImages = existingImages.length + newImages.length;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3]
      });

      if (!result.canceled) {
        const selectedImages = result.assets || [result];
        const newImageUris = selectedImages.map(img => img.uri);
        
        if (totalImages + newImageUris.length > 5) {
          Alert.alert('Limit Exceeded', 'You can only have up to 5 images');
          return;
        }

        setNewImages([...newImages, ...newImageUris]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos');
      return;
    }

    const totalImages = existingImages.length + newImages.length;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [4, 3]
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (totalImages >= 5) {
          Alert.alert('Limit Exceeded', 'You can only have up to 5 images');
          return;
        }

        const photoUri = result.assets[0].uri;
        setNewImages([...newImages, photoUri]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeExistingImage = (index: number) => {
    const newExistingImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExistingImages);
  };

  const removeNewImage = (index: number) => {
    const updatedNewImages = newImages.filter((_, i) => i !== index);
    setNewImages(updatedNewImages);
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

    if (existingImages.length === 0 && newImages.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one image');
      return false;
    }

    return true;
  };

  const handleUpdateDish = async () => {
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
        restaurantId: user.restaurantId,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category,
        isAvailable: dish.isAvailable
      };

      await dishService.updateDish(
        dish.$id,
        dishData,
        newImages,
        existingImages
      );

      Alert.alert(
        'Success',
        'Dish updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Update dish error:', error);
      Alert.alert('Error', error.message || 'Failed to update dish');
    } finally {
      setLoading(false);
    }
  };

  const totalImages = existingImages.length + newImages.length;

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
        <Text style={styles.headerTitle}>Edit Dish</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          
          {existingImages.length > 0 && (
            <>
              <Text style={styles.subLabel}>Current Images</Text>
              <View style={styles.imageGrid}>
                {existingImages.map((fileId, index) => (
                  <View key={`existing-${index}`} style={styles.imageItem}>
                    <Image
                      source={{ uri: getImageUrl(fileId) || '' }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeExistingImage(index)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {newImages.length > 0 && (
            <>
              <Text style={styles.subLabel}>New Images</Text>
              <View style={styles.imageGrid}>
                {newImages.map((uri, index) => (
                  <View key={`new-${index}`} style={styles.imageItem}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeNewImage(index)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickImages}
              disabled={loading || totalImages >= 5}
            >
              <Text style={styles.imageButtonIcon}>🖼️</Text>
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageButton}
              onPress={takePhoto}
              disabled={loading || totalImages >= 5}
            >
              <Text style={styles.imageButtonIcon}>📷</Text>
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.imageHint}>
            {totalImages}/5 images
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleUpdateDish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Update Dish</Text>
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
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
    marginTop: 5
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
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B'
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
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF6B6B',
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

export default EditDishScreen;
