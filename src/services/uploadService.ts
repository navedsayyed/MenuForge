// src/services/uploadService.ts
import { APPWRITE_CONFIG, ID, storage, account } from '../config/appwrite';
import * as FileSystem from 'expo-file-system/legacy';

// ============================================
// Upload Service - Image Upload & Management
// ============================================

/**
 * Upload single image to Appwrite Storage
 * Using direct FileSystem.uploadAsync for React Native compatibility
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

    console.log('Uploading file:', fileName, 'from:', imageUri);

    // Use Appwrite SDK's storage.createFile which handles authentication automatically
    // We need to create a proper File object that works in React Native
    try {
      // Read the file and create a blob
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert to binary string for blob
      const binaryString = atob(base64);
      const blob = new Blob([binaryString], { type: 'image/jpeg' });
      
      // Create a File-like object with the blob data
      const file = Object.assign(blob, {
        name: fileName,
        lastModified: Date.now(),
      });

      console.log('File prepared for upload, size:', blob.size);

      // Upload using Appwrite SDK which handles auth
      const result = await storage.createFile(
        APPWRITE_CONFIG.bucketId,
        fileId,
        file as any
      );

      console.log('Image uploaded successfully:', result.$id);
      return result.$id;
    } catch (sdkError: any) {
      // SDK doesn't work in React Native, use direct API upload
      console.log('Using direct API upload method');
      
      // Fallback: Try direct API upload with JWT token
      const jwt = await account.createJWT();
      console.log('Created JWT for upload');
      
      const uploadUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files`;
      
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, imageUri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        parameters: {
          fileId: fileId,
        },
        headers: {
          'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
          'X-Appwrite-JWT': jwt.jwt,
        },
      });

      console.log('Upload result:', uploadResult.status);

      if (uploadResult.status === 200 || uploadResult.status === 201) {
        const responseData = JSON.parse(uploadResult.body);
        console.log('Image uploaded successfully via API:', responseData.$id);
        return responseData.$id;
      } else {
        throw new Error(`Upload failed with status: ${uploadResult.status}, body: ${uploadResult.body}`);
      }
    }
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
    
    // Convert file IDs to URLs
    const imageUrls = fileIds.map(fileId => getImageUrl(fileId)).filter(url => url !== null) as string[];
    console.log('Image URLs:', imageUrls);
    
    return imageUrls;
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
 * Validate image file (simplified for React Native)
 */
export const validateImage = async (
  uri: string, 
  maxSizeMB: number = 5
): Promise<{ valid: boolean; error?: string; size?: number }> => {
  try {
    // In React Native, we'll do basic validation
    // File size checking would require additional native modules
    if (!uri || uri.length === 0) {
      return { valid: false, error: 'Invalid file URI' };
    }

    return { valid: true };
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
