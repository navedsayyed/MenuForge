/**
 * Color Constants
 */

export const COLORS = {
    // Primary colors
    primary: '#E8480A',
    primaryDark: '#C53D09',
    primaryLight: '#F07A4C',

    // Secondary colors
    secondary: '#4ECDC4',
    secondaryDark: '#3DB8B0',
    secondaryLight: '#6FD9D1',

    // Neutral colors
    white: '#FFFFFF',
    black: '#000000',
    gray: '#9E9E9E',
    lightGray: '#F5F5F5',
    darkGray: '#424242',

    // Status colors
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',

    // Background colors
    background: '#FFFFFF',
    backgroundDark: '#121212',
    surface: '#F5F5F5',
    surfaceDark: '#1E1E1E',

    // Text colors
    text: '#212121',
    textSecondary: '#757575',
    textDark: '#FFFFFF',
    textSecondaryDark: '#B0B0B0',

    // Border colors
    border: '#E0E0E0',
    borderDark: '#424242',
} as const;

export type ColorName = keyof typeof COLORS;
