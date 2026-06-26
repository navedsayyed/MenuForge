# TECHNICAL DEEP DIVE - Restaurant Admin (MenuForge)

## 1. Project Overview

**MenuForge** is a React Native mobile application that allows restaurant owners to manage their menu digitally. The app handles CRUD operations for dishes (with image uploads), generates QR code-enabled menu pages, and exports professional PDF menus.

### Core Architecture

The application follows a **feature-based folder structure** with these layers:

1. **Presentation Layer**: React Native screens with navigation (Stack + Bottom Tabs)
2. **Business Logic Layer**: Service modules for auth, dishes, and file uploads
3. **Data Layer**: Appwrite BaaS (Backend as a Service) for authentication, database, and storage
4. **State Management**: Local component state + AsyncStorage for persistence (no Redux/Context API for global state)

### Data Flow Pattern

```
User Action (Screen) 
  → Service Function (authService/dishService/uploadService)
    → Appwrite SDK (account/databases/storage)
      → Appwrite Cloud API
        → Response back through chain
          → UI Update via setState
```

The app does NOT use centralized state management. Each screen manages its own state and fetches data on mount/focus.

---

## 2. Tech Stack & Why (Based on Actual Usage)

### Core Dependencies (from package.json)


#### **React Native 0.82.1**
- **Where**: App.tsx (entry point), all screen files
- **Why**: Cross-platform mobile development. This version supports React 19.1.1 which is bleeding edge.
- **Real usage**: Standard React Native with functional components and hooks throughout. No class components found.

#### **TypeScript 5.8.3**
- **Where**: Every .tsx/.ts file (100% TypeScript)
- **Why**: Type safety for props, navigation params, API responses
- **Real usage**: Extensive type definitions in `src/types/index.ts` and `src/types/navigation.ts`. All components are properly typed with interfaces for props.

#### **Appwrite 13.0.1** 
- **Where**: `src/config/appwrite.ts` for initialization, used across all services
- **Why**: Backend as a service eliminates need for custom backend. Provides auth, database, and file storage.
- **Real usage**: 
  - Authentication: `account.create()`, `account.createEmailSession()`, `account.get()`, `account.deleteSession()`
  - Database: `databases.createDocument()`, `databases.listDocuments()`, `databases.updateDocument()`, `databases.deleteDocument()`
  - Storage: `storage.createFile()`, `storage.getFileView()`, `storage.deleteFile()`
  - Configured with hardcoded credentials in `src/config/appwrite.ts` (projectId: '69158587001456a2ed0e', endpoint: 'https://fra.cloud.appwrite.io/v1')


#### **@react-navigation/native 7.1.0 + @react-navigation/native-stack 7.1.0 + @react-navigation/bottom-tabs 7.8.4**
- **Where**: `src/navigation/AppNavigator.tsx`
- **Why**: De-facto standard for React Native navigation. Provides native-like stack and tab navigation.
- **Real usage**: Hybrid navigation setup:
  - Root level: Stack Navigator (Splash → Login → Signup → Main → AddDish → EditDish)
  - Main Tab Navigator nested inside root stack (DashboardTab, QRTab, ProfileTab)
  - No drawer navigation, no deep linking configured

#### **@react-native-async-storage/async-storage 2.2.0**
- **Where**: `src/services/authService.ts`, `src/features/profile/screens/ProfileScreen.tsx`, `src/providers/AuthProvider.tsx`
- **Why**: Persist user data and theme preference locally for offline access and faster app startup
- **Real usage**: 
  - Stores `userData` object (userId, email, name, restaurantId, restaurantName) after login - see `authService.login()` at line 111
  - Stores theme mode ('light'/'dark'/'system') - see `ThemeProvider` in `AuthProvider.tsx`
  - CRITICAL: Auth flow relies on AsyncStorage first, then checks Appwrite session - see `getCurrentUser()` at line 134

#### **react-native-image-picker 7.1.0**
- **Where**: `src/features/dishes/screens/AddDishScreen.tsx` and `EditDishScreen.tsx`
- **Why**: Native image selection from gallery or camera
- **Real usage**: 
  - `launchImageLibrary()` for gallery selection with `selectionLimit: 5 - images.length` (max 5 images per dish)
  - `launchCamera()` for taking new photos with `saveToPhotos: true`
  - Returns Asset objects with `uri` property used for upload


#### **react-native-blob-util 0.19.11**
- **Where**: `src/services/uploadService.ts`
- **Why**: Handle binary file operations in React Native (read files as base64, make multipart uploads)
- **Real usage**: 
  - `ReactNativeBlobUtil.fs.readFile(imageUri, 'base64')` to read image files
  - `ReactNativeBlobUtil.fetch('POST', uploadUrl, headers, formData)` for direct Appwrite API uploads with JWT
  - Required because Appwrite SDK's `storage.createFile()` doesn't work properly in React Native environment - see fallback logic in `uploadSingleImage()` at line 31

#### **react-native-qrcode-svg 6.3.20**
- **Where**: `src/features/qr/screens/QRScreen.tsx`
- **Why**: Generate QR codes as SVG components (better quality than bitmap)
- **Real usage**: 
  - `<QRCode value={imageUrl || APP_CONFIG.WEB_URL} size={64} />` - generates QR for each dish's image URL
  - Used in preview (actual SVG) and PDF generation (external API via `https://api.qrserver.com/v1/create-qr-code/`)

#### **react-native-print 0.11.0**
- **Where**: `src/features/qr/screens/QRScreen.tsx` in `generateFullMenuPDF()` function
- **Why**: Generate PDFs from HTML using native print APIs (iOS: UIPrintInteractionController, Android: PrintManager)
- **Real usage**: 
  - `RNPrint.print({ html: htmlContent })` - takes HTML string with inline styles, opens native print dialog
  - PDF generation is NOT from scratch - it constructs HTML template with embedded data and images, then uses native print-to-PDF


#### **react-native-view-shot 4.0.3**
- **Where**: `src/features/qr/screens/QRScreen.tsx`
- **Why**: Capture React Native views as images (screenshot capability)
- **Real usage**: 
  - `viewShotRef.current.capture()` returns local file URI of captured view
  - Used for "Save Page" and "Share Page" features - captures the menu page preview as JPEG
  - Ref: `const viewShotRef = useRef<ViewShot>(null)` wrapping the `renderMenuPage` output

#### **react-native-share 10.0.2**
- **Where**: `src/features/qr/screens/QRScreen.tsx` in `handleSavePage()` and `handleSharePage()`
- **Why**: Native share dialog (iOS Share Sheet, Android Sharesheet)
- **Real usage**: 
  - `Share.open({ url: imageUri, title: '...', message: '...', type: 'image/jpeg' })`
  - Provides system-level sharing to WhatsApp, email, save to files, etc.

#### **react-native-svg 15.12.1**
- **Where**: Peer dependency for `react-native-qrcode-svg`, also used in `src/components/common/Icons.tsx`
- **Why**: Render SVG graphics in React Native
- **Real usage**: Custom icon components (SearchIcon, EditIcon, DeleteIcon, etc.) all use `<Svg>`, `<Path>`, `<Circle>` components

#### **react-native-safe-area-context 5.6.2**
- **Where**: Every screen component wraps with `<SafeAreaView edges={['top', 'bottom']}>`, also uses `useSafeAreaInsets()` hook
- **Why**: Handle notches, status bars, and home indicators on modern devices
- **Real usage**: 
  - Provides insets for dynamic header height calculations: `const insets = useSafeAreaInsets(); const HEADER_HEIGHT = (insets.top > 0 ? insets.top : 20) + 90;`
  - Critical for Android transparent status bar: `<StatusBar translucent={true} />`


#### **react-native-screens 4.16.0**
- **Where**: Auto-enabled by React Navigation
- **Why**: Native screen management for better performance (uses native UIViewController on iOS, Fragment on Android)
- **Real usage**: Implicit - React Navigation automatically uses it when installed

#### **dotenv 17.2.3**
- **Where**: Listed in dependencies but NOT actually used
- **Why**: Was likely intended for environment variables
- **Real usage**: NONE - The app has hardcoded Appwrite config in `src/config/appwrite.ts`. The `.env.example` file exists but is not loaded anywhere in the code.

---

## 3. Screen-by-Screen / Component-by-Component Breakdown

### SplashScreen (`src/screens/SplashScreen.tsx`)

**Purpose**: Initial loading screen that checks authentication status and routes to Login or Main

**State**:
- None (all logic in useEffect)

**Key Functions**:
- `checkLoginStatus()`: Waits 2 seconds, calls `authService.getCurrentUser()`, navigates based on result

**Data Flow**:
1. Component mounts → `useEffect` runs
2. 2-second artificial delay (simulated loading)
3. Calls `authService.getCurrentUser()` which checks AsyncStorage first
4. If user exists → `navigation.replace('Main', { screen: 'DashboardTab' })`
5. If no user → `navigation.replace('Login')`


**Imports & Why**:
- `authService` from `../features/auth/services/authService` - check login status
- Logo PNG from local assets - displayed during splash
- `NativeStackNavigationProp` - typed navigation prop

**Weak Spots**:
- Hardcoded 2-second delay feels arbitrary (not tied to actual loading)
- No error handling if `authService.getCurrentUser()` throws
- Uses `.replace()` for navigation (good - prevents back navigation)

---

### LoginScreen (`src/features/auth/screens/LoginScreen.tsx`)

**Purpose**: Email/password login with forgot password functionality

**State**:
- `email` (string): Controlled input value
- `password` (string): Controlled input value
- `loading` (boolean): Submission in progress
- `showPassword` (boolean): Password visibility toggle

**Key Functions**:
- `handleLogin()`: Validates inputs, calls `authService.login()`, navigates to Main on success
- `validateEmail()`: Regex check for email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- `handleForgotPassword()`: Validates email exists, calls `authService.sendPasswordResetEmail()`


**Data Flow (handleLogin)**:
1. User taps Sign In button
2. Validation: Check empty fields, validate email format
3. `authService.login(email, password)` executes:
   - Deletes existing Appwrite session
   - Creates new email session via `account.createEmailSession()`
   - Fetches user data via `account.get()`
   - Queries restaurants collection to find/create restaurant document
   - Saves `userData` object to AsyncStorage
4. On success: `navigation.replace('Main', { screen: 'DashboardTab' })`
5. On error: Shows Alert with error message

**Data Flow (handleForgotPassword)**:
1. Checks email field is filled and valid
2. Calls `authService.sendPasswordResetEmail(email)`
3. Inside service: `account.createRecovery(email, 'https://google.com')` - sends Appwrite reset email
4. Shows success Alert (user checks email inbox)

**Imports & Why**:
- Custom icons (`EyeIcon`, `EyeOffIcon`) for password toggle
- `COLORS` constant from `src/constants/colors.ts` for primary color (#E8480A)
- `authService` for authentication operations

**Weak Spots**:
- Password reset redirect URL is `https://google.com` (not a deep link back to app) - user cannot complete reset in-app
- No "remember me" functionality
- Email validation is basic (doesn't catch all invalid emails like "test@domain")
- No loading state on Forgot Password button

---


### SignupScreen (`src/features/auth/screens/SignupScreen.tsx`)

**Purpose**: Create new restaurant account with email/password

**State**:
- `name` (string): Restaurant name
- `email` (string): Account email
- `password` (string): Account password
- `confirmPassword` (string): Password confirmation
- `loading` (boolean): Submission in progress
- `showPassword` (boolean): Password field visibility
- `showConfirmPassword` (boolean): Confirm password visibility

**Key Functions**:
- `handleSignup()`: Validates all inputs, calls `authService.signup()`, navigates to Main
- `validateEmail()`: Same regex as LoginScreen

**Data Flow (handleSignup)**:
1. Validates all fields filled, email format, password length (min 8), passwords match
2. `authService.signup(name, email, password)` executes:
   - Creates Appwrite account: `account.create(userId, email, password, name)`
   - Auto-login: `account.createEmailSession(email, password)`
   - Creates restaurant document with default fields (address: 'Not specified', phoneNumber: 'Not specified', etc.)
   - Saves userData to AsyncStorage
3. Shows success Alert and navigates to Main

**Imports & Why**:
- Same password toggle icons as LoginScreen
- Uses inline styles (no shared style constants)


**Weak Spots**:
- No email uniqueness check before submission (relies on Appwrite error)
- Password strength not validated beyond length (no uppercase/number/special char requirements)
- Confirm password checked only on submit (no real-time validation)
- Restaurant document created with restaurantId = userId (tight coupling, not flexible)
- No terms of service checkbox or privacy policy link
- "Restaurant Name" input uses `autoCapitalize="words"` but this is cosmetic (doesn't enforce title case in database)

---

### DashboardScreen (`src/features/dishes/screens/DashboardScreen.tsx`)

**Purpose**: Main screen showing all dishes with search, edit, delete, and availability toggle

**State**:
- `dishes` (Dish[]): All fetched dishes
- `searchQuery` (string): Search input value
- `loading` (boolean): Initial data fetch
- `refreshing` (boolean): Pull-to-refresh state
- `userData` (User | null): Current logged-in user
- `statusBarStyle` ('light-content' | 'dark-content'): Dynamic status bar based on scroll
- `scrollY` (Animated.Value): Scroll position for header animation

**Key Functions**:
- `loadUserData()`: Fetches current user, redirects to login if none
- `fetchDishes()`: Calls `dishService.getDishes(restaurantId)`, sets dishes state
- `handleDeleteDish(dish)`: Shows confirmation alert, calls `dishService.deleteDish()`, refetches dishes
- `handleToggleAvailability(dish, newValue)`: Optimistically updates UI, calls `dishService.toggleAvailability()`


**Data Flow (Initial Load)**:
1. Component mounts → `loadUserData()` runs
2. Fetches user from `authService.getCurrentUser()` (checks AsyncStorage first)
3. If user found → sets `userData` state → triggers `fetchDishes()` via useEffect
4. `dishService.getDishes(restaurantId)` queries Appwrite:
   - `databases.listDocuments()` with filters: `Query.equal('restaurantId', restaurantId)`, `Query.orderDesc('$createdAt')`, `Query.limit(100)`
5. Sets `dishes` state → triggers FlatList render

**Data Flow (Search)**:
- User types in search bar → updates `searchQuery` state
- Computed `filteredDishes` re-calculates on each render:
  ```typescript
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredDishes = normalizedSearchQuery
    ? dishes.filter(dish => {
        const searchableText = [dish.name, dish.category, dish.description].join(' ').toLowerCase();
        return searchableText.includes(normalizedSearchQuery);
      })
    : dishes;
  ```
- **Note**: Search is client-side only (filters local `dishes` array, doesn't query Appwrite)

**Data Flow (Toggle Availability)**:
1. User toggles switch on dish card
2. **Optimistic update**: Immediately updates `dishes` state with new `isAvailable` value
3. Calls `dishService.toggleAvailability(dish.$id, newValue)` which does `databases.updateDocument()`
4. If API call fails → shows error Alert and calls `fetchDishes()` to revert UI


**Animation Implementation (Collapsing Header)**:
- Uses `Animated.Value(0)` to track scroll position
- Header height interpolates from 200px (expanded) to dynamic min height based on safe area insets
- Background color interpolates from `#E8480A` (orange) to `#FFFFFF` (white) on scroll
- Title color interpolates from white to dark
- Status bar style changes dynamically via `scrollY.addListener()` callback
- Search bar stays visible at all times but width changes slightly (100% → 90%)

**Imports & Why**:
- Custom icons from `src/components/common/Icons.tsx` (DishIcon, EditIcon, DeleteIcon, etc.)
- `ToggleSwitch` component from `src/components/common/ToggleSwitch.tsx` for availability toggle
- `dishService` for CRUD operations
- `authService` for current user check

**Weak Spots**:
- No pagination (hard limit of 100 dishes via `Query.limit(100)`)
- Search is client-side only (doesn't scale well if 100 dishes loaded)
- Optimistic update on toggle doesn't handle network errors gracefully (shows alert but already changed UI)
- Delete operation doesn't check if dish is referenced elsewhere
- No skeleton loader during initial fetch (just shows `ActivityIndicator`)
- Refresh doesn't update userData (only dishes)
- ScrollY animation listener is not cleaned up properly (memory leak potential)

---


### AddDishScreen (`src/features/dishes/screens/AddDishScreen.tsx`)

**Purpose**: Create new dish with name, description, price, category, and images

**State**:
- `name` (string): Dish name
- `description` (string): Dish description
- `price` (string): Price as string (parsed to float on submit)
- `category` (Category | ''): Selected category or empty
- `images` (string[]): Array of local image URIs (max 5)
- `loading` (boolean): Submission in progress

**Key Functions**:
- `pickImages()`: Opens gallery with `launchImageLibrary()`, adds selected images to state (up to 5 total)
- `takePhoto()`: Opens camera with `launchCamera()`, adds photo to state
- `removeImage(index)`: Removes image from state by index
- `validateForm()`: Checks all fields filled, price is valid number > 0, at least 1 image
- `handleAddDish()`: Validates, creates dishData object, calls `dishService.addDish()`, navigates back

**Data Flow (handleAddDish)**:
1. Validates form (all fields required)
2. Gets current user from `authService.getCurrentUser()`
3. Creates `dishData` object:
   ```typescript
   {
     name: name.trim(),
     description: description.trim(),
     price: parseFloat(price),
     category: category as Category,
     isAvailable: true
   }
   ```
4. Calls `dishService.addDish(restaurantId, dishData, images)`:
   - Generates unique dish ID
   - Uploads images via `uploadImages()` (returns array of Appwrite file URLs)
   - Creates dish document with first image URL only: `images: imageUrls[0] || ''`
5. Shows success Alert and navigates back to Dashboard


**Category Selection UI**:
- 5 hardcoded categories: `['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Other']`
- Rendered as horizontal list of TouchableOpacity buttons
- Active category gets different background color (#E8480A) and white text

**Image Upload Flow**:
1. User selects images → local URIs stored in state
2. On submit → `uploadImages(restaurantId, dishId, imageUris)` executes in `uploadService.ts`:
   - For each image:
     - Reads file as base64 using `ReactNativeBlobUtil.fs.readFile()`
     - Converts base64 to Uint8Array then Blob
     - **Tries** Appwrite SDK `storage.createFile()` (fails in RN)
     - **Fallback**: Creates JWT token, uses `ReactNativeBlobUtil.fetch()` to POST multipart form to Appwrite API
   - Returns array of file IDs
3. Converts file IDs to full URLs using `storage.getFileView(bucketId, fileId).href`
4. Stores **only first URL** in database

**Imports & Why**:
- `react-native-image-picker` for `launchCamera` and `launchImageLibrary`
- Custom icons (BackIcon, CameraIcon, GalleryIcon)
- `authService` to get current user
- `dishService` to create dish

**Weak Spots**:
- Multiple images uploaded but only first URL saved to database (wasted uploads and storage)
- No image compression before upload (relies on image picker quality setting only)
- No preview of selected images before upload (shows thumbnails but doesn't validate dimensions/size)
- Categories are hardcoded (not fetched from backend)
- Price input is string with `keyboardType="decimal-pad"` but doesn't handle invalid formats (parseFloat can return NaN)
- No duplicate name check
- Image upload errors not handled individually (one failure fails entire submission)

---


### EditDishScreen (`src/features/dishes/screens/EditDishScreen.tsx`)

**Purpose**: Edit existing dish details and images

**State**:
- `name` (string): Pre-filled with dish.name
- `description` (string): Pre-filled with dish.description
- `price` (string): Pre-filled with dish.price.toString()
- `category` (Category): Pre-filled with dish.category
- `existingImages` (string[]): Dish's current image URLs split by comma
- `newImages` (string[]): Newly selected images (local URIs)
- `loading` (boolean): Submission in progress

**Key Functions**:
- `pickImages()`: Same as AddDishScreen but limit is `5 - (existingImages.length + newImages.length)`
- `removeExistingImage(index)`: Removes from existingImages array (marks for deletion)
- `removeNewImage(index)`: Removes from newImages array
- `handleUpdateDish()`: Validates, calls `dishService.updateDish()` with existing + new image arrays
- `handleDeleteDish()`: Shows confirmation, calls `dishService.deleteDish()`, navigates back

**Data Flow (handleUpdateDish)**:
1. Validates form
2. Calls `dishService.updateDish(restaurantId, dishId, dishData, newImages, existingImages)`:
   - Uploads newImages if any (same process as AddDish)
   - Combines existingImages + uploadedImageUrls
   - Updates document with `images: allImageUrls[0] || ''` (still only first URL)
3. Shows success Alert and navigates back

**Route Params**:
- Receives `{ dish: Dish }` from navigation
- TypeScript types: `RouteProp<RootStackParamList, 'EditDish'>`


**Weak Spots**:
- Removed existingImages are not deleted from Appwrite storage (orphaned files accumulate)
- Still only saves first image URL despite managing multiple
- Delete button in header (easy to accidentally tap)
- No "discard changes" confirmation if user navigates back with unsaved edits
- Same validation weaknesses as AddDishScreen

---

### QRScreen (`src/features/qr/screens/QRScreen.tsx`)

**Purpose**: Generate paginated menu previews with QR codes, export as image or PDF

**State**:
- `userData` (User | null): Current user
- `availableDishes` (Dish[]): Filtered dishes where `isAvailable === true`
- `loading` (boolean): Initial data fetch
- `generating` (boolean): Export in progress
- `currentPage` (number): Current page index (0-based)
- `selectedTemplate` (MenuTemplateId): One of 'pizzaFrame' | 'lunch' | 'herbal'

**Constants**:
- `DISHES_PER_PAGE = 4`: Each page shows 4 dishes
- `PAGE_WIDTH = width - 16`: Full screen width minus padding
- `PAGE_HEIGHT = PAGE_WIDTH * 1.414`: A4 aspect ratio (1:1.414)

**Key Functions**:
- `fetchDishes()`: Gets all dishes, filters to `isAvailable === true` only
- `generateFullMenuPDF()`: Creates HTML string with all pages, calls `RNPrint.print()`
- `handleSavePage()`: Captures current page with ViewShot, opens Share dialog
- `handleSharePage()`: Same as save but with different message


**Data Flow (PDF Generation)**:
1. User taps "Full PDF" button → `generateFullMenuPDF()` runs
2. Creates `pages` array by chunking `availableDishes` into groups of 4
3. Builds HTML string with:
   - Template-specific styles (colors, borders, backgrounds) based on `selectedTemplate`
   - For each page:
     - Header with restaurant name
     - 4 dish cards with image, name, category, price
     - QR code using external API: `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(imageUrl)}`
     - Footer with page number and website URL
4. Calls `RNPrint.print({ html: htmlContent })` → opens native print dialog
5. User can save as PDF or print

**Template System**:
- Three predefined templates with different color schemes
- Each template defines:
  ```typescript
  {
    bodyBackground: string,
    headerBackground: string,
    cardBackground: string,
    categoryColor: string,
    priceColor: string,
    // ... etc
  }
  ```
- Preview uses these styles directly, PDF generation injects inline styles into HTML

**QR Code Dual Implementation**:
1. **Preview**: Uses `react-native-qrcode-svg` component `<QRCode value={imageUrl} size={64} />`
2. **PDF**: Uses external API `<img src="https://api.qrserver.com/v1/create-qr-code/..." />` because SVG QR codes don't render in HTML-to-PDF conversion


**Page Navigation**:
- `handleNextPage()`: Increments `currentPage` if not at last page
- `handlePrevPage()`: Decrements `currentPage` if not at first page
- Navigation buttons disabled at boundaries (gray color, `disabled={true}`)

**Imports & Why**:
- `react-native-qrcode-svg` for QR generation in preview
- `react-native-print` for PDF generation
- `react-native-view-shot` for screenshot capture
- `react-native-share` for native sharing
- `dishService` to fetch dishes

**Weak Spots**:
- PDF generation relies on external QR API (requires internet, no caching, privacy concern)
- HTML generation is brittle string concatenation (no HTML library like cheerio)
- Large menus (>20 pages) might cause performance issues or memory errors
- No loading state while fetching QR codes from external API
- Template preview and PDF styles don't match perfectly (preview uses React Native styles, PDF uses CSS)
- Image URLs in PDF must be publicly accessible (Appwrite URLs work but no fallback)
- No error handling if image fails to load in PDF
- `getPrimaryImageUrl()` function splits by comma but database only stores one URL (inconsistency)

---


### ProfileScreen (`src/features/profile/screens/ProfileScreen.tsx`)

**Purpose**: Manage restaurant profile, view app info, change theme, logout

**State**:
- `userData` (User | null): Current user
- `restaurantInfo` (RestaurantInfo): Object with name, address, phone, timing, location, description
- `loading` (boolean): Initial load
- `refreshing` (boolean): Pull-to-refresh
- `saving` (boolean): Save profile in progress
- `sendingReset` (boolean): Password reset email in progress

**Key Functions**:
- `loadUserData()`: Fetches user from authService, then calls `loadRestaurantInfo()`
- `loadRestaurantInfo(user)`: Queries Appwrite restaurants collection by `user.restaurantId`
- `handleSaveProfile()`: Updates restaurant document in Appwrite, updates local AsyncStorage with new name
- `handlePasswordReset()`: Calls `authService.sendPasswordResetEmail()`
- `handleLogout()`: Shows confirmation, calls `authService.logout()`, navigates to Login
- `handleOpenWebsite()`: Opens `APP_CONFIG.WEB_URL` in browser via `Linking.openURL()`

**Data Flow (Save Profile)**:
1. User edits form fields → updates `restaurantInfo` state via `updateField()`
2. User taps "Save Changes" → `handleSaveProfile()` runs
3. Validates restaurant name not empty
4. Calls `databases.updateDocument()` with payload:
   ```typescript
   {
     name: trimmed,
     address: restaurantInfo.address.trim(),
     phoneNumber: restaurantInfo.phone.trim(),
     operatingHours: restaurantInfo.timing.trim(),
     location: restaurantInfo.location.trim(),
     description: restaurantInfo.description.trim()
   }
   ```
5. Updates AsyncStorage `userData` with new restaurant name
6. Updates local state with new name


**Theme Management**:
- Uses `useTheme()` hook from `src/providers/AuthProvider.tsx` (actually ThemeProvider, not AuthProvider)
- Theme modes: 'light' | 'dark' | 'system'
- Persisted in AsyncStorage under key `@app_theme_mode`
- Switch component toggles between light/dark (system not exposed in UI)

**Profile Completion Indicator**:
- Counts non-empty fields in `restaurantInfo` (max 6 fields)
- Displayed as "X/6 Profile Complete" in summary card

**Imports & Why**:
- `databases` from `src/api/client/appwrite.ts` (direct import, not through service)
- `Button` and `Input` reusable components
- `APP_CONFIG` for version display and website URL
- `useTheme` for theme management

**Weak Spots**:
- Direct database import instead of using service layer (breaks abstraction)
- Restaurant info fields are not validated (allows saving empty values)
- Phone number has no format validation
- "Refresh" button refetches data but doesn't check for conflicts if data changed elsewhere
- Theme toggle doesn't handle 'system' mode (user can't select "use device theme")
- Website URL is hardcoded in config (not editable)
- No unsaved changes warning when navigating away
- Password reset email sent but user can't complete reset (redirect URL issue)

---


## 4. Backend & Data Layer

### Database Schema (Appwrite Collections)

#### Restaurants Collection
**Collection ID**: `6915976d00276f1ef417`

**Actual Schema** (inferred from code in `authService.ts` and `ProfileScreen.tsx`):
```typescript
{
  $id: string;                    // Document ID = userId (tight coupling)
  address: string;                // Default: "Not specified"
  phoneNumber: string;            // Default: "Not specified"
  operatingHours: string;         // Default: "Not specified"
  cuisineType: string;            // Default: ""
  priceRange: string;             // Default: ""
  name?: string;                  // Added in ProfileScreen, not in signup
  location?: string;              // Added in ProfileScreen, not in signup
  description?: string;           // Added in ProfileScreen, not in signup
  $createdAt: string;             // Auto-generated by Appwrite
  $updatedAt: string;             // Auto-generated by Appwrite
}
```

**Inconsistency**: Signup creates restaurant with only `address`, `phoneNumber`, `operatingHours`, `cuisineType`, `priceRange`. ProfileScreen expects `name`, `location`, `description` but these are never set during signup.

#### Dishes Collection
**Collection ID**: `691597c10037117695bb`

**Actual Schema** (from `dishService.ts`):
```typescript
{
  $id: string;                    // Document ID (generated via ID.unique())
  restaurantId: string;           // Foreign key to restaurants.$id
  name: string;
  description: string;
  price: number;                  // Stored as number, not string
  category: string;               // One of: Appetizer, Main Course, Dessert, Beverage, Other
  images: string;                 // Single URL (despite UI allowing multiple uploads)
  isAvailable: boolean;           // Default: true
  $createdAt: string;             // Auto-generated by Appwrite
  $updatedAt: string;             // Auto-generated by Appwrite
}
```


### Storage Bucket

**Bucket ID**: `69159810000861e30e86`
**Purpose**: Store dish images

**File Naming**: `${dishId}_${index}_${Date.now()}.jpg`

**Access**: Files must be publicly viewable (URL generated via `storage.getFileView()` is used in QR codes and PDFs)

---

### Authentication Flow (Step-by-Step)

#### Signup Flow
1. User fills signup form (name, email, password)
2. `authService.signup()` called
3. **Step 1**: Create Appwrite account
   ```typescript
   const userId = ID.unique();
   const user = await account.create(userId, email, password, name);
   ```
4. **Step 2**: Auto-login via session
   ```typescript
   await account.createEmailSession(email, password);
   ```
5. **Step 3**: Create restaurant document
   ```typescript
   const restaurant = await databases.createDocument(
     databaseId,
     restaurantsCollectionId,
     userId,  // restaurantId = userId
     { address: 'Not specified', phoneNumber: 'Not specified', ... }
   );
   ```
6. **Step 4**: Save to AsyncStorage
   ```typescript
   const userData = { userId, email, name, restaurantId, restaurantName };
   await AsyncStorage.setItem('userData', JSON.stringify(userData));
   ```
7. Navigate to Main screen


#### Login Flow
1. User enters email and password
2. `authService.login()` called
3. **Step 1**: Delete any existing session (force fresh login)
   ```typescript
   try { await account.deleteSession('current'); } catch {}
   ```
4. **Step 2**: Create new session
   ```typescript
   await account.createEmailSession(email, password);
   ```
5. **Step 3**: Get account details
   ```typescript
   const user = await account.get();
   ```
6. **Step 4**: Find or create restaurant document
   ```typescript
   const restaurants = await databases.listDocuments(...);
   let restaurant = restaurants.documents.find(r => r.$id === user.$id);
   if (!restaurant) {
     // Create missing restaurant doc (handles legacy accounts)
   }
   ```
7. **Step 5**: Save to AsyncStorage (same as signup)
8. Navigate to Main screen

#### Session Persistence
- **Startup**: SplashScreen calls `authService.getCurrentUser()`
- **Fast path**: Checks AsyncStorage first (no network call)
  ```typescript
  const userDataString = await AsyncStorage.getItem('userData');
  if (userDataString) return JSON.parse(userDataString);
  ```
- **Validation**: If local data exists, returns immediately (does NOT verify with Appwrite)
- **Fallback**: If no local data, checks `account.get()` but returns null (forces re-login)


**Critical Issue**: Session validation is weak. If user is deleted from Appwrite but AsyncStorage still has userData, they can access the app (until they try an API call).

#### Logout Flow
1. User taps Logout button → confirmation alert
2. `authService.logout()` called
3. **Step 1**: Delete Appwrite session
   ```typescript
   await account.deleteSession('current');
   ```
4. **Step 2**: Clear AsyncStorage
   ```typescript
   await AsyncStorage.removeItem('userData');
   ```
5. Navigate to Login screen

#### Password Reset Flow
1. User enters email on login screen
2. Taps "Forgot Password"
3. `authService.sendPasswordResetEmail(email)` called
4. **Backend**: `account.createRecovery(email, 'https://google.com')`
5. User receives email with reset link
6. **Problem**: Link redirects to google.com (not back to app)
7. **Result**: User cannot complete reset via app

**Real Implementation** (from `authService.ts` line 200):
```typescript
async sendPasswordResetEmail(email: string): Promise<void> {
  try {
    await account.createRecovery(email, 'https://google.com');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send password reset email');
  }
}
```


---

### Real-Time / Offline / Sync Logic

**Verdict**: NONE implemented.

- No Appwrite Realtime subscriptions
- No offline data persistence beyond AsyncStorage for user data
- No sync mechanism for dishes
- No conflict resolution
- No optimistic updates except toggle availability (which refetches on error)

**How It Actually Works**:
1. User opens app → fetches all data from server
2. User makes changes → immediately sends to server, waits for response
3. Network failure → shows error alert, user must retry manually
4. Another device makes changes → this device won't know until manual refresh

---

### API Endpoints / Backend Calls

All API calls go through Appwrite SDK. Here's every backend operation traced:

#### Authentication Operations (`account` service)

| Operation | Function | File Location | Triggered By |
|-----------|----------|---------------|--------------|
| `account.create(userId, email, password, name)` | `authService.signup()` | `src/features/auth/services/authService.ts:26` | SignupScreen submit |
| `account.createEmailSession(email, password)` | `authService.signup()` + `authService.login()` | Same file, lines 29, 70 | Login/Signup submit |
| `account.get()` | `authService.login()`, `authService.getCurrentUser()` | Same file, lines 73, 154 | Login submit, app startup |
| `account.deleteSession('current')` | `authService.login()`, `authService.logout()` | Same file, lines 66, 175 | Login submit, logout button |
| `account.createRecovery(email, url)` | `authService.sendPasswordResetEmail()` | Same file, line 203 | Forgot password button |
| `account.createJWT()` | `uploadService.uploadSingleImage()` | `src/services/uploadService.ts:53` | Image upload fallback |


#### Database Operations (`databases` service)

| Operation | Function | File Location | Triggered By |
|-----------|----------|---------------|--------------|
| `databases.createDocument()` | `authService.signup()`, `authService.login()`, `dishService.addDish()` | authService:33,82 / dishService:30 | Signup, dish add |
| `databases.listDocuments()` | `authService.login()`, `dishService.getDishes()` | authService:76 / dishService:48 | Login, dashboard load |
| `databases.getDocument()` | `dishService.getDishById()`, `ProfileScreen.loadRestaurantInfo()` | dishService:66 / ProfileScreen:143 | Edit dish, profile load |
| `databases.updateDocument()` | `dishService.updateDish()`, `dishService.toggleAvailability()`, `ProfileScreen.handleSaveProfile()` | dishService:82,120 / ProfileScreen:237 | Edit save, toggle, profile save |
| `databases.deleteDocument()` | `dishService.deleteDish()` | dishService:107 | Delete dish button |

#### Storage Operations (`storage` service)

| Operation | Function | File Location | Triggered By |
|-----------|----------|---------------|--------------|
| `storage.createFile(bucketId, fileId, file)` | `uploadService.uploadSingleImage()` | uploadService:31 | Dish image upload (tries then falls back) |
| `storage.getFileView(bucketId, fileId)` | `uploadService.getImageUrl()`, used throughout | uploadService:91 | Display images, QR codes, PDFs |
| `storage.deleteFile(bucketId, fileId)` | `uploadService.deleteSingleImage()` | uploadService:104 | Dish deletion |


---

## 5. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         React Native App                     │
│                      (Entry: App.tsx)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   SafeAreaProvider             │
        │   ThemeProvider (Context)      │
        │   NavigationContainer          │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   Stack Navigator (Root)       │
        │   - Splash                     │
        │   - Login                      │
        │   - Signup                     │
        │   - Main (Tab Navigator)       │
        │   - AddDish                    │
        │   - EditDish                   │
        └────────────┬───────────────────┘
                     │
                     ▼ (Main screen)
        ┌────────────────────────────────┐
        │   Bottom Tab Navigator         │
        │   - DashboardTab               │
        │   - QRTab                      │
        │   - ProfileTab                 │
        └────────────┬───────────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
     Dashboard    QRScreen  Profile
        │            │          │
        └────────────┴──────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │    Service Layer               │
        │    - authService.ts            │
        │    - dishService.ts            │
        │    - uploadService.ts          │
        └────────────┬───────────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
    account    databases   storage
        └──────────┴──────────┘
                   │
                   ▼
        ┌────────────────────────────────┐
        │      Appwrite SDK              │
        │   (config/appwrite.ts)         │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  Appwrite Cloud (Frankfurt)    │
        │  - Authentication              │
        │  - Databases (2 collections)   │
        │  - Storage (1 bucket)          │
        └────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Local Storage Layer                       │
│   AsyncStorage:                                              │
│   - userData (User object)                                   │
│   - @app_theme_mode (light/dark/system)                     │
└──────────────────────────────────────────────────────────────┘
```


---

## 6. Honest Weak Spots

### Critical Issues

1. **Image Upload Waste**: App allows uploading 5 images but only stores first URL in database. All other uploads are orphaned in storage bucket, wasting space and money.
   - Location: `dishService.addDish()` line 30, `dishService.updateDish()` line 94
   - Fix needed: Either save all URLs (as comma-separated string or array) or restrict UI to 1 image

2. **Password Reset Broken**: Reset email sent but redirect URL is `https://google.com`. User receives email but can't complete password reset in-app or via web.
   - Location: `authService.sendPasswordResetEmail()` line 203
   - Fix needed: Set up deep linking or web portal with proper redirect URL

3. **Session Validation Weak**: App checks AsyncStorage on startup but doesn't verify session with Appwrite. Deleted users can still access app until they make an API call.
   - Location: `authService.getCurrentUser()` line 134-146
   - Fix needed: Always validate session with `account.get()` or implement periodic token refresh

4. **No Offline Support**: Network failure means complete app failure. No cached data, no queue for pending operations, no offline mode.
   - Fix needed: Implement offline-first architecture with local database (SQLite) and sync queue

5. **Search is Client-Side Only**: Dashboard search filters local array of max 100 dishes. Won't scale for restaurants with large menus.
   - Location: `DashboardScreen.tsx` line 215-222
   - Fix needed: Implement server-side search with Appwrite `Query.search()`


### Security Concerns

6. **Hardcoded Credentials**: Appwrite project ID, database IDs, collection IDs, and bucket ID are hardcoded in `src/config/appwrite.ts`. Anyone with APK can extract these.
   - Location: Lines 10-15 of `appwrite.ts`
   - Risk: Low (Appwrite has permission system) but best practice is to use build-time env vars

7. **No Input Sanitization**: User inputs (dish names, descriptions) are not sanitized before saving to database or displaying in PDF.
   - Risk: Potential XSS in PDF generation if malicious HTML/JS injected
   - Fix needed: Escape HTML special characters before inserting into HTML template

8. **Public Storage Bucket**: All dish images must be publicly accessible for QR codes and PDFs to work. No access control on who can view images.
   - Risk: Anyone with file ID can view images
   - Mitigation: This might be intentional (public menu) but consider signed URLs with expiry

### Data Integrity Issues

9. **Restaurant Schema Mismatch**: Signup creates restaurant with fields (address, phoneNumber, operatingHours, cuisineType, priceRange) but ProfileScreen expects different fields (name, location, description). First-time users see incomplete profile.
   - Location: `authService.signup()` line 33-40, `ProfileScreen.normalizeRestaurantInfo()` line 123-130
   - Fix needed: Align signup and profile schemas

10. **No Validation on Price**: Price input uses `parseFloat()` which can return NaN, Infinity, or negative numbers. No checks before saving.
    - Location: `AddDishScreen.tsx` and `EditDishScreen.tsx` price validation
    - Fix needed: Validate `isFinite(price) && price > 0` before submission


11. **Orphaned Files on Edit**: When user removes images in EditDishScreen, they're removed from database reference but NOT deleted from storage bucket.
    - Location: `EditDishScreen.tsx` - no call to `deleteFile()` for removed images
    - Fix needed: Track removed files and delete them after successful update

12. **No Transaction Support**: Dish creation uploads images first, then creates document. If document creation fails, images remain in storage (orphaned).
    - Location: `dishService.addDish()` flow
    - Fix needed: Implement cleanup on failure or use two-phase commit pattern

### UX/Performance Issues

13. **No Loading States**: Image uploads, dish creation, PDF generation all use single `loading` boolean. User can't see progress or which operation is running.
    - Fix needed: Granular loading states and progress indicators

14. **Pagination Missing**: Hard limit of 100 dishes via `Query.limit(100)`. Large restaurants will hit this limit.
    - Location: `dishService.getDishes()` line 53
    - Fix needed: Implement cursor-based pagination with load more

15. **Animation Memory Leak**: ScrollY animation listener in DashboardScreen is added but cleanup might fail if component unmounts during animation.
    - Location: `DashboardScreen.tsx` lines 77-87
    - Fix needed: Store listener ID and ensure cleanup in useEffect return

16. **PDF Generation Blocking**: `generateFullMenuPDF()` builds entire HTML string in memory (can be large for 100+ dishes). Blocks UI thread.
    - Location: `QRScreen.tsx` line 145-283
    - Fix needed: Stream HTML generation or move to worker thread


### Code Quality Issues

17. **Inconsistent Service Usage**: ProfileScreen directly imports `databases` from appwrite config instead of using a service layer.
    - Location: `ProfileScreen.tsx` line 24
    - Problem: Breaks abstraction, makes testing harder
    - Fix needed: Create `restaurantService.ts` with CRUD operations

18. **Magic Numbers**: Values like 100 (dish limit), 5 (max images), 4 (dishes per page) are hardcoded throughout.
    - Fix needed: Extract to constants file

19. **No Error Boundaries**: React errors crash entire app. No graceful fallback UI.
    - Fix needed: Implement error boundaries at screen level

20. **Env Variables Not Used**: `.env.example` file exists but `dotenv` package is not configured. Config is hardcoded instead.
    - Location: `package.json` lists dotenv but App.tsx never imports it
    - Fix needed: Set up babel-plugin-dotenv or react-native-config

### Copy-Paste Issues

21. **Duplicate Validation Logic**: Email validation regex copied between LoginScreen and SignupScreen instead of shared utility.
    - Fix needed: Extract to `src/utils/validation.ts`

22. **Redundant Code in Upload Service**: Two separate paths for file upload (SDK attempt + fallback) but SDK path never succeeds in React Native.
    - Location: `uploadService.ts` lines 23-48
    - Fix needed: Remove dead code path or fix SDK compatibility


### Unclear Design Decisions

23. **Why Split Images on Comma?**: Code throughout splits `dish.images` by comma but database only stores single URL. Suggests planned feature (multiple images) was partially removed.
    - Location: `QRScreen.getPrimaryImageUrl()` splits comma, but `dishService.addDish()` only saves `imageUrls[0]`
    - Need clarification: Is multi-image support planned or should comma-split logic be removed?

24. **Why External QR API?**: PDF generation uses `https://api.qrserver.com/v1/create-qr-code/` instead of embedding SVG QR codes that already exist in preview.
    - Location: `QRScreen.generateFullMenuPDF()` line 217
    - Reasoning: Unclear from code. Possibly SVG doesn't render in HTML-to-PDF? Should be documented or fixed.

25. **Why "Not specified" Defaults?**: Restaurant fields default to string "Not specified" instead of null or empty string.
    - Location: `authService.signup()` line 37
    - Reasoning: Unclear. Makes it harder to check if field was ever set.

26. **Why DEV_MODE Flag?**: `authService.ts` has `DEV_MODE = false` flag that clears session on startup if enabled. Purpose unclear and could cause data loss if accidentally enabled.
    - Location: Line 12 of `authService.ts`
    - Reasoning: Development convenience but dangerous if committed as `true`

### Missing Features (Expected but Not Implemented)

27. **No Dish Categories Management**: Categories are hardcoded array. User cannot add custom categories.

28. **No Multi-Restaurant Support**: User model links to single restaurant. Owner can't manage multiple locations.

29. **No Image Optimization**: Large photos uploaded as-is. No compression, resizing, or format conversion.

30. **No Analytics**: No tracking of menu views, QR code scans, or popular dishes.


---

## 7. What This Code Actually Does Well

Despite the issues listed above, several things are implemented correctly:

1. **Clean Architecture**: Feature-based folder structure with clear separation of screens, services, and types.

2. **TypeScript Usage**: Comprehensive type definitions for all data models and navigation params. No `any` types in critical paths.

3. **Navigation Setup**: Proper hybrid navigation (stack + tabs) with typed params. Clean screen transitions.

4. **Custom Components**: Reusable Button, Input, ToggleSwitch components with variant support.

5. **Theme System**: Working light/dark mode with persistence. Uses React Context properly.

6. **Animated Header**: Smooth collapsing header in DashboardScreen with proper interpolation.

7. **Safe Area Handling**: Correct use of SafeAreaView and insets for notch support.

8. **Image Selection**: Proper implementation of camera and gallery with limits.

9. **PDF Generation**: Creative use of HTML templates for professional PDF output.

10. **Error Handling**: Consistent try-catch blocks with user-friendly Alert messages.

---


## 8. Key Technical Decisions to Defend

If you're asked "Why did you do X?" in an interview, here are the real answers based on the code:

### Why no Redux/MobX/Zustand?
- **Answer**: Each screen manages its own state and fetches fresh data on mount/focus. There's no shared state between screens except user data (stored in AsyncStorage). For this app's complexity level, component state is sufficient.

### Why Appwrite over Firebase or custom backend?
- **Answer**: Appwrite provides all needed services (auth, database, storage) with a single SDK. Self-hostable option for future scaling. The specific implementation uses Appwrite Cloud (Frankfurt endpoint) for ease of deployment.

### Why AsyncStorage for session management?
- **Answer**: Faster app startup by avoiding network call on every launch. User data is small (<1KB) and doesn't need SQLite. Appwrite session is verified on first API call after startup, providing security with speed.

### Why store only first image despite uploading multiple?
- **Uncertain from code**: This appears to be incomplete implementation. UI allows 5 images but database schema only has single `images` field (string, not array). Either planned feature was cut or schema was never updated. Need clarification from team.

### Why external QR API in PDF instead of embedded SVG?
- **Answer**: React Native QR library generates SVG which doesn't render in HTML-to-PDF conversion. External API generates bitmap QR codes that render correctly in printed documents. Trade-off: requires internet during PDF generation.

### Why no offline support?
- **Answer**: App targets restaurant owners who typically have reliable internet at their business location. Offline support would add significant complexity (local database, sync conflicts, reconciliation) without proportional value for use case.


### Why client-side search instead of server-side?
- **Answer**: With 100-dish limit, client-side search is instant and reduces API calls. For small-to-medium restaurants, this works fine. Would need refactor if targeting enterprise chains with 500+ menu items.

### Why ReactNativeBlobUtil fallback in upload service?
- **Answer**: Appwrite's JavaScript SDK `storage.createFile()` doesn't handle React Native file URIs properly (designed for web File objects). ReactNativeBlobUtil provides necessary binary operations and multipart form data support for mobile. JWT token fallback ensures uploads work even when SDK fails.

### Why "Not specified" instead of empty strings for defaults?
- **Uncertain from code**: This choice makes it harder to check if field was ever set (need to check both empty and "Not specified"). Possible reasoning: visual indicator to user that field needs filling, but unclear why not use placeholder text instead.

---

## 9. File-by-File Critical Paths

### Critical Path: User Creates First Dish
1. `App.tsx` → Loads with ThemeProvider and SafeAreaProvider
2. `SplashScreen.tsx` → Checks auth, navigates to Main (user already logged in)
3. `AppNavigator.tsx` → Renders MainTabs (bottom tabs)
4. `DashboardScreen.tsx` → Mounts, calls `loadUserData()` → `fetchDishes()` → empty list
5. User taps FAB → navigates to `AddDishScreen.tsx`
6. User fills form, picks image from gallery
7. User taps "Add Dish" → `handleAddDish()` executes:
   - Validates form
   - Calls `dishService.addDish(restaurantId, dishData, images)`
   - In `dishService.ts`:
     - Generates dish ID
     - Calls `uploadImages(restaurantId, dishId, images)` from `uploadService.ts`
     - In `uploadService.ts`:
       - For each image: reads as base64, converts to Blob, tries SDK upload
       - SDK fails → creates JWT, uses ReactNativeBlobUtil.fetch() to POST to Appwrite
       - Returns file IDs → converts to URLs via `getFileView()`
     - Creates dish document with first image URL
   - Returns to DashboardScreen
8. `DashboardScreen.tsx` refetches dishes via useFocusEffect
9. New dish appears in list


### Critical Path: User Generates PDF Menu
1. User taps QR tab → `QRScreen.tsx` mounts
2. Loads user data → fetches dishes → filters to `isAvailable === true`
3. Chunks dishes into pages of 4
4. User selects template (e.g., "Pizza Frame")
5. User taps "Full PDF" → `generateFullMenuPDF()` executes:
   - Builds HTML string with inline styles
   - For each page:
     - Adds header with restaurant name
     - For each dish:
       - Embeds image URL (direct from Appwrite storage)
       - Embeds QR code as `<img src="https://api.qrserver.com/v1/create-qr-code/?data=...">` 
       - Adds dish name, category, price
     - Adds footer with page number
   - Calls `RNPrint.print({ html: htmlContent })`
   - Opens native print dialog
6. User saves as PDF or prints

---

## 10. Dependencies Deep Dive

### Why These Specific Versions?

**React Native 0.82.1** (Released: ~Q1 2025)
- Supports React 19.1.1 (latest)
- New Architecture opt-in available
- Code does NOT enable New Architecture (no `newArchEnabled: true` in gradle)

**Appwrite 13.0.1** (Latest stable)
- Matches Appwrite Cloud API version
- Breaking changes from v12: `Query` helper methods instead of arrays

**Navigation 7.x**
- Latest major version
- Uses native screens by default (better performance)
- Typed navigation out of the box


**react-native-svg 15.x**
- Required peer dependency for QR codes and custom icons
- Provides native SVG rendering on both platforms

**react-native-safe-area-context 5.x**
- Must-have for modern devices with notches
- Provides accurate insets for layout

### Unused Dependencies

**dotenv 17.2.3**
- Listed in package.json but never imported
- Should either be removed or properly configured

---

## 11. Build Configuration

### Android
- **Min SDK**: Likely 21+ (React Native default)
- **Target SDK**: Likely 33+ (check `android/build.gradle`)
- **Permissions**: Camera, Storage (for image picker)
- **Build variants**: Not configured (single release/debug)

### iOS  
- **Min iOS**: Likely 13.0+ (React Native default)
- **Permissions**: Camera, Photo Library (in Info.plist)
- **Pods**: Auto-linked via CocoaPods

### Build Process
1. `npm install` → installs all dependencies
2. `cd ios && pod install` → links iOS native dependencies
3. `npx react-native run-android` or `npx react-native run-ios`
4. Metro bundler starts automatically
5. App installs and launches on device/emulator

### Environment Setup Required
- Node.js 20+ (from engines field in package.json)
- Java 11+ (for Android)
- Xcode 14+ (for iOS, macOS only)
- Android Studio (for Android)


---

## 12. Testing Strategy (What Should Be Tested)

Based on the actual code, here's what should be tested if you were to add tests:

### Unit Tests (Services)
- **authService.ts**:
  - `signup()`: Creates account, session, restaurant doc, saves to AsyncStorage
  - `login()`: Deletes old session, creates new one, handles missing restaurant
  - `getCurrentUser()`: Returns from AsyncStorage first, falls back to API
  - `logout()`: Clears both Appwrite session and AsyncStorage
  - `sendPasswordResetEmail()`: Calls Appwrite recovery endpoint

- **dishService.ts**:
  - `addDish()`: Uploads images, saves first URL only
  - `getDishes()`: Filters by restaurantId, orders by createdAt
  - `updateDish()`: Combines existing + new images
  - `deleteDish()`: Deletes files from storage then document
  - `toggleAvailability()`: Updates single field

- **uploadService.ts**:
  - `uploadSingleImage()`: Base64 conversion, multipart upload
  - `getImageUrl()`: Constructs Appwrite storage URL
  - `deleteSingleImage()`: Calls storage.deleteFile()

### Integration Tests (Screen Flows)
- Login flow: Email validation, API call, navigation
- Signup flow: All validations, account + restaurant creation
- Add dish flow: Image selection, upload, document creation
- Edit dish flow: Load existing, modify, save with image changes
- PDF generation: HTML construction, template application

### E2E Tests (Critical Paths)
- New user signup → add first dish → view on dashboard
- Login → toggle dish availability → verify in QR screen
- Add dish with 5 images → verify only 1 saved (known bug)
- Generate PDF → verify all available dishes included


---

## 13. Performance Considerations

### Current Performance Characteristics

**App Startup**:
- Fast path: AsyncStorage check (~10ms)
- Slow path: Appwrite API call (~500-2000ms)
- Artificial 2-second delay on splash (unnecessary)

**Dashboard Load**:
- Single API call for all dishes (up to 100)
- No pagination or lazy loading
- Image loading happens after dish data loaded (good)

**Search Performance**:
- Client-side array filter (O(n) per keystroke)
- Fast for 100 dishes, would lag at 1000+

**PDF Generation**:
- Blocks UI thread while building HTML string
- Time proportional to dish count (4 dishes = fast, 100 dishes = slow)
- External QR API calls happen synchronously during HTML rendering

**Image Upload**:
- Parallel uploads for multiple images (good use of Promise.all)
- No compression (could be 10MB+ per image)
- Base64 encoding doubles memory usage temporarily

### Optimization Opportunities

1. Remove artificial splash delay
2. Implement pagination for dishes (load 20 at a time)
3. Add image compression before upload (use react-native-image-resizer)
4. Stream PDF generation (build HTML page by page)
5. Cache QR codes locally instead of external API
6. Implement FlatList `getItemLayout` for better scroll performance
7. Memoize expensive computations (filtered dishes, page chunks)

---


## 14. Deployment & Distribution

### Current State
- **Not configured for production**: Hardcoded credentials, debug logging, DEV_MODE flag
- **No CI/CD**: Would need GitHub Actions / GitLab CI for automated builds
- **No code signing**: Android keystore and iOS certificates not in repo (good security)
- **No versioning strategy**: app.json has `displayName` but no version bump automation

### What's Needed for Production

1. **Environment Variables**:
   - Extract Appwrite config to build-time env vars
   - Separate dev/staging/prod configurations

2. **Code Signing**:
   - Android: Generate release keystore, configure gradle
   - iOS: Set up provisioning profiles, App Store Connect

3. **Build Automation**:
   - fastlane for automated builds
   - Semantic versioning with commit hooks

4. **Error Tracking**:
   - Integrate Sentry or similar
   - Log errors to external service (not just console)

5. **Analytics**:
   - Add Firebase Analytics or Mixpanel
   - Track key user actions (dishes added, PDFs generated, etc.)

6. **Assets**:
   - Generate proper app icons for all sizes
   - Add splash screens for both platforms
   - Optimize images and SVGs

---

## 15. Interview Talking Points

### What You Built
"A React Native mobile app for restaurant owners to digitally manage their menu. Core features: CRUD for dishes with image uploads, QR code generation linking to dish photos, and professional PDF menu export with customizable templates. Built on Appwrite BaaS for authentication, database, and file storage."


### Technical Challenges Solved
1. **React Native File Uploads**: Appwrite SDK doesn't work with React Native URIs. Solved by implementing fallback using ReactNativeBlobUtil for base64 encoding and multipart form data, with JWT authentication.

2. **PDF from Mobile**: Used HTML-to-PDF approach via native print APIs instead of building PDF from scratch. Constructed dynamic HTML templates with inline styles matching selected theme.

3. **QR in PDFs**: SVG QR codes from preview don't render in HTML-to-PDF. Solved by using external bitmap QR API (api.qrserver.com) for PDF generation while keeping SVG for app preview.

4. **Animated Collapsing Header**: Implemented scroll-based animation with interpolated height, colors, and status bar style using Animated API with proper safe area handling.

### Areas for Improvement (Be Honest)
1. "Image upload wastes resources by uploading multiple files but only storing first URL. Would refactor to either store all URLs or limit UI to single image."

2. "No offline support currently. For production, I'd implement SQLite with sync queue for offline-first architecture."

3. "Search is client-side only with 100-dish limit. Would add server-side search with Appwrite Query.search() and cursor-based pagination."

4. "Password reset is broken due to redirect URL. Would set up deep linking or web portal to complete the flow."

### What You'd Change
"If starting over, I'd:
1. Use react-native-mmkv instead of AsyncStorage (faster, synchronous)
2. Implement proper image optimization pipeline with compression
3. Set up environment variables from day one
4. Add error boundaries and crash reporting early
5. Use SWR or React Query for better data fetching/caching patterns"

---


## 16. Code Examples to Memorize

### The Upload Service Pattern (Most Complex Part)
```typescript
// From uploadService.ts - The real implementation
export const uploadSingleImage = async (
  restaurantId: string,
  dishId: string,
  imageUri: string,
  index: number
): Promise<string> => {
  try {
    const fileId = ID.unique();
    const fileName = `${dishId}_${index}_${Date.now()}.jpg`;

    // Read file as base64
    const base64 = await ReactNativeBlobUtil.fs.readFile(imageUri, 'base64');

    // Convert to Uint8Array then Blob
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    // Try SDK (will fail in RN)
    try {
      const file = Object.assign(blob, { name: fileName });
      const result = await storage.createFile(APPWRITE_CONFIG.bucketId, fileId, file);
      return result.$id;
    } catch (sdkError) {
      // Fallback: Direct API with JWT
      const jwt = await account.createJWT();
      const uploadResult = await ReactNativeBlobUtil.fetch(
        'POST',
        `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files`,
        {
          'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
          'X-Appwrite-JWT': jwt.jwt,
          'Content-Type': 'multipart/form-data',
        },
        [
          { name: 'file', filename: fileName, type: 'image/jpeg', data: ReactNativeBlobUtil.wrap(imageUri) },
          { name: 'fileId', data: fileId }
        ]
      );
      return JSON.parse(uploadResult.data).$id;
    }
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};
```


### The Session Persistence Pattern
```typescript
// From authService.ts - How auth actually works
async getCurrentUser(): Promise<User | null> {
  try {
    // FAST PATH: Check local storage first (no network call)
    const userDataString = await AsyncStorage.getItem('userData');
    if (userDataString) {
      return JSON.parse(userDataString);
    }

    // FALLBACK: Check Appwrite session
    try {
      await account.get();
      // Session exists but no local data - force re-login for data consistency
      return null;
    } catch (error) {
      return null;
    }
  } catch (error) {
    return null;
  }
}
```

### The Optimistic Update Pattern
```typescript
// From DashboardScreen.tsx - Toggle availability
const handleToggleAvailability = async (dish: Dish, newValue: boolean) => {
  try {
    // OPTIMISTIC UPDATE: Change UI immediately
    const updatedDishes = dishes.map((d) =>
      d.$id === dish.$id ? { ...d, isAvailable: newValue } : d
    );
    setDishes(updatedDishes);

    // Then make API call
    await dishService.toggleAvailability(dish.$id, newValue);
  } catch (error) {
    // REVERT: If API fails, refetch to restore correct state
    Alert.alert('Error', 'Failed to update availability');
    fetchDishes();
  }
};
```

---

## 17. Final Summary

This is a **functional but incomplete** restaurant menu management app. It successfully demonstrates:
- React Native fundamentals (navigation, components, animations)
- Appwrite integration (auth, database, storage)
- Complex file upload handling in mobile environment
- Creative PDF generation using HTML templates
- Proper TypeScript usage and type safety

**Primary weaknesses** are incomplete features (multi-image support), missing production concerns (offline support, error tracking), and some architectural inconsistencies (direct database imports, hardcoded values).

**For an interview**, focus on the technical challenges solved (file upload fallback, PDF generation) and be honest about the known issues. Show you can both build working features AND identify areas for improvement. The code is good enough to demonstrate competence but has enough rough edges to show you understand production-ready vs. prototype code.

