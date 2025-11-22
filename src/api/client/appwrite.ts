// src/config/appwrite.ts
import { Account, Client, Databases, ID, Query, Storage } from 'appwrite';
import { AppwriteConfig } from '../../types';

// ============================================
// Appwrite Configuration
// ============================================
const APPWRITE_CONFIG: AppwriteConfig = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '69158587001456a2ed0e',
  databaseId: '6915966a0012532e403b',
  restaurantsCollectionId: '6915976d00276f1ef417',
  dishesCollectionId: '691597c10037117695bb',
  bucketId: '69159810000861e30e86'
};

// ============================================
// Initialize Appwrite Client
// ============================================
const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// ============================================
// Initialize Services
// ============================================
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// ============================================
// Export Everything
// ============================================
export {
  account, APPWRITE_CONFIG, client, databases, ID, Query, storage
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get file preview URL from Appwrite Storage
 */
export const getFileUrl = (bucketId: string, fileId: string): string => {
  return storage.getFileView(bucketId, fileId).href;
};

/**
 * Upload file to Appwrite Storage
 */
export const uploadFile = async (bucketId: string, file: File) => {
  try {
    const fileId = ID.unique();
    const result = await storage.createFile(bucketId, fileId, file);
    return result;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Appwrite Storage
 */
export const deleteFile = async (bucketId: string, fileId: string): Promise<boolean> => {
  try {
    await storage.deleteFile(bucketId, fileId);
    return true;
  } catch (error) {
    console.error('File delete error:', error);
    throw error;
  }
};
