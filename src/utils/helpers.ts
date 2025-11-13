// src/utils/helpers.ts
import { PasswordValidation } from '../types';

// ============================================
// Utility Helper Functions
// ============================================

/**
 * Format price with currency
 */
export const formatPrice = (price: number, currency: string = '₹'): string => {
  return `${currency}${parseFloat(price.toString()).toFixed(2)}`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): PasswordValidation => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isValid = password.length >= minLength;
  
  let strength: 'Weak' | 'Medium' | 'Strong' = 'Weak';
  let score = 0;
  
  if (password.length >= minLength) score++;
  if (hasUpperCase) score++;
  if (hasLowerCase) score++;
  if (hasNumbers) score++;
  if (hasSpecialChar) score++;

  if (score >= 4) strength = 'Strong';
  else if (score >= 2) strength = 'Medium';

  return {
    isValid,
    strength,
    score,
    requirements: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    }
  };
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Get time ago string
 */
export const getTimeAgo = (date: string | Date): string => {
  if (!date) return '';
  
  const now = new Date();
  const dateObj = new Date(date);
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals: Record<string, number> = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'Just now';
};

/**
 * Generate unique ID
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Capitalize first letter
 */
export const capitalizeFirst = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T, 
  wait: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if object is empty
 */
export const isEmptyObject = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Sort array by key
 */
export const sortByKey = <T extends Record<string, any>>(
  array: T[], 
  key: keyof T, 
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return array.sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
};

/**
 * Filter array by search term
 */
export const filterBySearch = <T extends Record<string, any>>(
  array: T[], 
  searchTerm: string, 
  keys: (keyof T)[]
): T[] => {
  if (!searchTerm) return array;
  
  const lowerSearch = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerSearch);
      }
      return false;
    });
  });
};

/**
 * Generate random color
 */
export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Check if string is valid URL
 */
export const isValidUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

export default {
  formatPrice,
  isValidEmail,
  validatePassword,
  truncateText,
  formatDate,
  getTimeAgo,
  generateUniqueId,
  capitalizeFirst,
  formatFileSize,
  debounce,
  isEmptyObject,
  deepClone,
  sortByKey,
  filterBySearch,
  getRandomColor,
  isValidUrl
};
