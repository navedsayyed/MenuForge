import { COLORS } from '../constants/colors';

/**
 * Theme Colors Configuration
 */

export const lightTheme = {
    primary: COLORS.primary,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
    textSecondary: COLORS.textSecondary,
    border: COLORS.border,
    error: COLORS.error,
    success: COLORS.success,
    warning: COLORS.warning,
    info: COLORS.info,
} as const;

export const darkTheme = {
    primary: COLORS.primary,
    background: COLORS.backgroundDark,
    surface: COLORS.surfaceDark,
    text: COLORS.textDark,
    textSecondary: COLORS.textSecondaryDark,
    border: COLORS.borderDark,
    error: COLORS.error,
    success: COLORS.success,
    warning: COLORS.warning,
    info: COLORS.info,
} as const;

export type Theme = typeof lightTheme;
