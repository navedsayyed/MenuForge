// src/services/dishService.ts
import { APPWRITE_CONFIG, databases, ID, Query } from '../config/appwrite';
import { Dish, DishFormData } from '../types';
import { deleteImagesFromDish, uploadImages } from './uploadService';

// ============================================
// Dish Service - CRUD Operations
// ============================================

const dishService = {
  /**
   * Add new dish with images
   */
  async addDish(restaurantId: string, dishData: DishFormData, images: string[]): Promise<Dish> {
    try {
      const dishId = ID.unique();
      console.log('Creating dish with ID:', dishId);

      // Upload images to Appwrite Storage
      const imageUrls = await uploadImages(restaurantId, dishId, images);
      console.log('Images uploaded, URLs:', imageUrls);

      // Prepare dish data
      const dishDocumentData = {
        restaurantId: restaurantId,
        name: dishData.name,
        description: dishData.description,
        price: parseFloat(dishData.price.toString()),
        category: dishData.category,
        images: imageUrls[0] || '' // Use first image URL only
      };
      
      console.log('Creating dish document with data:', dishDocumentData);

      // Create dish document in database
      const dish = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.dishesCollectionId,
        dishId,
        dishDocumentData
      );

      console.log('Dish created successfully:', dish.$id);
      return dish as unknown as Dish;
    } catch (error: any) {
      console.error('Add dish error:', error);
      throw new Error(error.message || 'Failed to add dish');
    }
  },

  /**
   * Get all dishes for a restaurant
   */
  async getDishes(restaurantId: string): Promise<Dish[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.dishesCollectionId,
        [
          Query.equal('restaurantId', restaurantId),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );

      return response.documents as unknown as Dish[];
    } catch (error: any) {
      console.error('Get dishes error:', error);
      throw new Error(error.message || 'Failed to fetch dishes');
    }
  },

  /**
   * Get single dish by ID
   */
  async getDishById(dishId: string): Promise<Dish> {
    try {
      const dish = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.dishesCollectionId,
        dishId
      );

      return dish as unknown as Dish;
    } catch (error: any) {
      console.error('Get dish error:', error);
      throw new Error(error.message || 'Failed to fetch dish');
    }
  },

  /**
   * Update existing dish
   */
  async updateDish(
    dishId: string, 
    dishData: DishFormData & { restaurantId: string }, 
    newImages: string[] = [], 
    existingImages: string[] = []
  ): Promise<Dish> {
    try {
      const restaurantId = dishData.restaurantId;
      
      // Upload new images if provided
      let uploadedImageUrls: string[] = [];
      if (newImages.length > 0) {
        uploadedImageUrls = await uploadImages(restaurantId, dishId, newImages);
      }

      // Combine existing and new image URLs
      const allImageUrls = [...existingImages, ...uploadedImageUrls];

      // Update dish document
      const updatedDish = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.dishesCollectionId,
        dishId,
        {
          name: dishData.name,
          description: dishData.description,
          price: parseFloat(dishData.price.toString()),
          category: dishData.category,
          images: allImageUrls[0] || '' // Use first image URL only
        }
      );

      return updatedDish as unknown as Dish;
    } catch (error: any) {
      console.error('Update dish error:', error);
      throw new Error(error.message || 'Failed to update dish');
    }
  },

  /**
   * Delete dish and all associated images
   */
  async deleteDish(dishId: string, imageUrls: string[]): Promise<{ success: boolean; message: string }> {
    try {
      // Delete all images from storage
      if (imageUrls && imageUrls.length > 0) {
        await deleteImagesFromDish(imageUrls);
      }

      // Delete dish document from database
      await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.dishesCollectionId,
        dishId
      );

      return { success: true, message: 'Dish deleted successfully' };
    } catch (error: any) {
      console.error('Delete dish error:', error);
      throw new Error(error.message || 'Failed to delete dish');
    }
  },

  /**
   * Toggle dish availability (disabled - not supported by collection)
   */
  async toggleAvailability(dishId: string, isAvailable: boolean): Promise<Dish> {
    // Note: isAvailable field doesn't exist in the dishes collection
    // This function is disabled but kept for backward compatibility
    console.warn('toggleAvailability is not supported - isAvailable field does not exist in collection');
    return this.getDishById(dishId);
  },

  /**
   * Search dishes by name or category
   */
  async searchDishes(restaurantId: string, searchQuery: string): Promise<Dish[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.dishesCollectionId,
        [
          Query.equal('restaurantId', restaurantId),
          Query.search('name', searchQuery)
        ]
      );

      return response.documents as unknown as Dish[];
    } catch (error: any) {
      console.error('Search dishes error:', error);
      throw new Error(error.message || 'Failed to search dishes');
    }
  }
};

export default dishService;
