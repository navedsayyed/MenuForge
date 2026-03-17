// src/screens/EditDishScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
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
  View,
} from "react-native";
import {
  Asset,
  launchCamera,
  launchImageLibrary,
} from "react-native-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BackIcon,
  CameraIcon,
  DeleteIcon,
  GalleryIcon,
} from "../../../components/common/Icons";
import { Category } from "../../../types";
import { RootStackParamList } from "../../../types/navigation";
import authService from "../../auth/services/authService";
import dishService from "../services/dishService";

type EditDishScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditDish"
>;
type EditDishScreenRouteProp = RouteProp<RootStackParamList, "EditDish">;

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
  const [existingImages, setExistingImages] = useState<string[]>(
    dish.images ? dish.images.split(',').filter(Boolean) : [],
  );
  const [newImages, setNewImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const categories: Category[] = [
    "Appetizer",
    "Main Course",
    "Dessert",
    "Beverage",
    "Other",
  ];

  const pickImages = async () => {
    const totalImages = existingImages.length + newImages.length;

    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 5 - totalImages,
        quality: 0.8,
      });

      if (result.assets) {
        const newImageUris = result.assets
          .map((asset: Asset) => asset.uri)
          .filter((uri): uri is string => uri !== undefined);

        if (totalImages + newImageUris.length > 5) {
          Alert.alert("Limit Exceeded", "You can only have up to 5 images");
          return;
        }

        setNewImages([...newImages, ...newImageUris]);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const takePhoto = async () => {
    const totalImages = existingImages.length + newImages.length;

    try {
      const result = await launchCamera({
        mediaType: "photo",
        quality: 0.8,
        saveToPhotos: true,
      });

      if (result.assets && result.assets.length > 0) {
        if (totalImages >= 5) {
          Alert.alert("Limit Exceeded", "You can only have up to 5 images");
          return;
        }

        const photoUri = result.assets[0].uri;
        if (photoUri) {
          setNewImages([...newImages, photoUri]);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const removeExistingImage = (index: number) => {
    const updatedImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(updatedImages);
  };

  const removeNewImage = (index: number) => {
    const updatedImages = newImages.filter((_, i) => i !== index);
    setNewImages(updatedImages);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter dish name");
      return false;
    }

    if (!description.trim()) {
      Alert.alert("Validation Error", "Please enter description");
      return false;
    }

    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid price");
      return false;
    }

    if (!category) {
      Alert.alert("Validation Error", "Please select a category");
      return false;
    }

    if (existingImages.length + newImages.length === 0) {
      Alert.alert("Validation Error", "Please add at least one image");
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
        Alert.alert("Error", "User not authenticated");
        navigation.replace("Login");
        return;
      }

      const dishData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category as Category,
        isAvailable: dish.isAvailable,
      };

      await dishService.updateDish(
        user.restaurantId,
        dish.$id,
        dishData,
        newImages,
        existingImages,
      );

      Alert.alert("Success", "Dish updated successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error("Update dish error:", error);
      Alert.alert("Error", error.message || "Failed to update dish");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDish = async () => {
    Alert.alert("Delete Dish", "Are you sure you want to delete this dish?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            const user = await authService.getCurrentUser();

            if (!user) {
              Alert.alert("Error", "User not authenticated");
              navigation.replace("Login");
              return;
            }

            await dishService.deleteDish(user.restaurantId, dish.$id);

            Alert.alert("Success", "Dish deleted successfully!", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
          } catch (error: any) {
            console.error("Delete dish error:", error);
            Alert.alert("Error", error.message || "Failed to delete dish");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon color="#FFFFFF" width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Dish</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteDish}
          disabled={loading}
        >
          <DeleteIcon color="#FFFFFF" width={24} height={24} />
        </TouchableOpacity>
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
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive,
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
              <Text style={styles.subLabel}>Existing Images</Text>
              <View style={styles.imageGrid}>
                {existingImages.map((imagePath, index) => (
                  <View key={`existing-${index}`} style={styles.imageItem}>
                    <Image
                      source={{ uri: imagePath }}
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
              disabled={
                loading || existingImages.length + newImages.length >= 5
              }
            >
              <GalleryIcon
                color="#2C3E50"
                width={24}
                height={24}
                style={{ marginBottom: 5 }}
              />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageButton}
              onPress={takePhoto}
              disabled={
                loading || existingImages.length + newImages.length >= 5
              }
            >
              <CameraIcon
                color="#2C3E50"
                width={24}
                height={24}
                style={{ marginBottom: 5 }}
              />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.imageHint}>
            {existingImages.length + newImages.length}/5 images
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#E8480A",
    padding: 20,
    paddingTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  textArea: {
    height: 100,
    paddingTop: 15,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  categoryButtonActive: {
    backgroundColor: "#E8480A",
    borderColor: "#E8480A",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "600",
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  imageItem: {
    position: "relative",
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  imageButtonsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  imageButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  imageButtonIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  imageButtonText: {
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "600",
  },
  imageHint: {
    fontSize: 12,
    color: "#7F8C8D",
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#E8480A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#E8480A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#FFB8B8",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomPadding: {
    height: 30,
  },
});

export default EditDishScreen;
