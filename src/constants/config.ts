/**
 * App Configuration Constants
 */

export const APP_CONFIG = {
    NAME: 'Restaurant Admin',
    VERSION: '1.0.0',
    BUNDLE_ID: 'com.restrodentnative',
    WEB_URL: 'https://restaurant-admin.app',
} as const;

export const API_CONFIG = {
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
} as const;

export const STORAGE_KEYS = {
    AUTH_TOKEN: '@auth_token',
    USER_DATA: '@user_data',
    THEME: '@theme',
} as const;
