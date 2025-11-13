// src/services/uploadService.ts
import * as FileSystem from 'expo-file-system';
import { APPWRITE_CONFIG, ID, storage } from '../config/appwrite';

// ============================================
// Upload Service - Image Upload & Management
// ============================================

/**
 * Convert URI to File object for Appwrite
 */
const uriToFile = async (uri: string, fileName: string): Promise<File> => {
  try {
    // For Expo/React Native, we need to fetch the file as blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Create File object from blob
    const file = new File([blob], fileName, {
      type: blob.type || 'image/jpeg'
    });
    
    return file;
  } catch (error) {
    console.error('URI to File conversion error:', error);
    throw error;
  }
};

/**
 * Get file info from URI
 */
const getFileInfo = async (uri: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo;
  } catch (error) {
    console.error('Get file info error:', error);
    return null;
  }
};

/**
 * Upload single image to Appwrite Storage
 */
export const uploadSingleImage = async (
  restaurantId: string,
  dishId: string, 
  imageUri: string, 
  index: number
): Promise<string> => {
  try {
    const fileId = ID.unique();
    const fileName = `${dishId}_${index}_${Date.now()}.jpg`;

    // Convert URI to File
    const file = await uriToFile(imageUri, fileName);

    // Upload to Appwrite Storage
    const result = await storage.createFile(
      APPWRITE_CONFIG.bucketId,
      fileId,
      file
    );

    console.log('Image uploaded:', result.$id);
    return result.$id;
  } catch (error: any) {
    console.error('Upload single image error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload multiple images to Appwrite Storage
 */
export const uploadImages = async (
  restaurantId: string, 
  dishId: string, 
  imageUris: string[]
): Promise<string[]> => {
  try {
    if (!imageUris || imageUris.length === 0) {
      return [];
    }

    console.log('Uploading images:', imageUris.length);

    // Upload all images in parallel
    const uploadPromises = imageUris.map((uri, index) =>
      uploadSingleImage(restaurantId, dishId, uri, index)
    );

    const fileIds = await Promise.all(uploadPromises);

    console.log('All images uploaded successfully:', fileIds);
    return fileIds;
  } catch (error: any) {
    console.error('Upload images error:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
};

/**
 * Get image URL from file ID
 */
export const getImageUrl = (fileId: string): string | null => {
  try {
    if (!fileId) return null;
    
    const url = storage.getFileView(
      APPWRITE_CONFIG.bucketId,
      fileId
    );

    return url.href;
  } catch (error) {
    console.error('Get image URL error:', error);
    return null;
  }
};

/**
 * Delete single image from storage
 */
export const deleteSingleImage = async (fileId: string): Promise<boolean> => {
  try {
    await storage.deleteFile(APPWRITE_CONFIG.bucketId, fileId);
    console.log('Image deleted:', fileId);
    return true;
  } catch (error) {
    console.error('Delete single image error:', error);
    return false;
  }
};

/**
 * Delete multiple images from dish
 */
export const deleteImagesFromDish = async (
  fileIds: string[]
): Promise<{ success: boolean; deleted: number; total: number }> => {
  try {
    if (!fileIds || fileIds.length === 0) {
      return { success: true, deleted: 0, total: 0 };
    }

    console.log('Deleting images:', fileIds.length);

    // Delete all images in parallel
    const deletePromises = fileIds.map(fileId => deleteSingleImage(fileId));
    const results = await Promise.all(deletePromises);

    const deletedCount = results.filter(r => r === true).length;

    console.log(`Successfully deleted ${deletedCount}/${fileIds.length} images`);

    return {
      success: true,
      deleted: deletedCount,
      total: fileIds.length
    };
  } catch (error: any) {
    console.error('Delete images error:', error);
    throw new Error(`Failed to delete images: ${error.message}`);
  }
};

/**
 * Get image preview URL with dimensions
 */
export const getImagePreview = (
  fileId: string, 
  width: number = 500, 
  height: number = 500
): string | null => {
  try {
    if (!fileId) return null;

    const url = storage.getFilePreview(
      APPWRITE_CONFIG.bucketId,
      fileId,
      width,
      height,
      'center',
      100
    );

    return url.href;
  } catch (error) {
    console.error('Get image preview error:', error);
    return null;
  }
};

/**
 * Validate image file
 */
export const validateImage = async (
  uri: string, 
  maxSizeMB: number = 5
): Promise<{ valid: boolean; error?: string; size?: number }> => {
  try {
    const fileInfo = await getFileInfo(uri);

    if (!fileInfo || !fileInfo.exists) {
      return { valid: false, error: 'File not found' };
    }

    const fileSizeMB = fileInfo.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
      };
    }

    return { valid: true, size: fileSizeMB };
  } catch (error: any) {
    console.error('Validate image error:', error);
    return { valid: false, error: error.message };
  }
};

export default {
  uploadSingleImage,
  uploadImages,
  getImageUrl,
  deleteSingleImage,
  deleteImagesFromDish,
  getImagePreview,
  validateImage
};
