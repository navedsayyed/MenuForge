/**
 * Route Names Constants
 */

export const ROUTES = {
    // Auth routes
    SPLASH: 'Splash',
    LOGIN: 'Login',
    SIGNUP: 'Signup',

    // Main routes
    MAIN: 'Main',
    DASHBOARD_TAB: 'DashboardTab',
    PROFILE_TAB: 'ProfileTab',

    // Dish routes
    DASHBOARD: 'Dashboard',
    ADD_DISH: 'AddDish',
    EDIT_DISH: 'EditDish',

    // Other routes
    QR: 'QR',
    PROFILE: 'Profile',
} as const;

export type RouteName = typeof ROUTES[keyof typeof ROUTES];
