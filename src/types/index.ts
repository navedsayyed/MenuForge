// Type definitions for the restaurant app

export interface User {
  userId: string;
  email: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
}

export interface Dish {
  $id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  isAvailable: boolean;
  createdAt: string;
}

export interface DishFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export interface Restaurant {
  $id: string;
  name: string;
  email: string;
  userId: string;
  createdAt: string;
}

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  restaurantsCollectionId: string;
  dishesCollectionId: string;
  bucketId: string;
}

export interface PasswordValidation {
  isValid: boolean;
  strength: 'Weak' | 'Medium' | 'Strong';
  score: number;
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChar: boolean;
  };
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

export type Category = 'Appetizer' | 'Main Course' | 'Dessert' | 'Beverage' | 'Other';
