import { FONT_SIZE } from '../constants/dimensions';

/**
 * Typography Configuration
 */

export const typography = {
    fontSizes: FONT_SIZE,
    fontWeights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
} as const;

export type Typography = typeof typography;
