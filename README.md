# 🍽️ Restaurant Admin App

A comprehensive React Native mobile application for restaurant owners to manage their menu, generate QR codes, and create professional PDF menus.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Appwrite](https://img.shields.io/badge/Appwrite-F02E65?style=for-the-badge&logo=appwrite&logoColor=white)

---

## 📱 Features

### 🔐 Authentication
- Secure email/password login
- User registration with restaurant details
- Session management
- Auto-login on app restart

### 🍕 Dish Management
- **Add New Dishes**: Create dishes with images, name, category, and price
- **Edit Dishes**: Update dish information anytime
- **Delete Dishes**: Remove dishes from your menu
- **Image Upload**: Upload dish photos to Appwrite storage
- **Availability Toggle**: Mark dishes as available/unavailable
- **Category Organization**: Organize dishes by categories

### 📋 QR Menu Generator
- **Paginated Menu Display**: Professional A4-style layout with 3 dishes per page
- **QR Code Generation**: Each dish gets a unique QR code linking to its image
- **Real-time Preview**: See how your menu will look before exporting
- **Page Navigation**: Browse through menu pages with intuitive controls

### 📄 Export Options

#### 1. **Save Page** (JPEG)
- Capture current menu page as high-quality image
- Perfect for social media sharing
- Quick and easy export

#### 2. **Full PDF Menu**
- Generate complete PDF of all available dishes
- Includes:
  - Dish images
  - QR codes for each dish
  - Restaurant branding
  - Professional formatting
  - Page numbers and footer
- Opens native print dialog
- Can be saved or printed directly

#### 3. **Share Page**
- Share menu page via WhatsApp, email, social media
- Native share functionality
- Instant sharing capability

### 👤 Profile Management
- View restaurant information
- Update profile settings
- Manage account details

---

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation and routing
- **React Native Paper** - UI components

### Backend & Services
- **Appwrite** - Backend as a Service
  - Authentication
  - Database (Dishes, Users)
  - Storage (Dish images)

### Key Libraries
- `react-native-qrcode-svg` - QR code generation
- `react-native-print` - PDF generation via native print
- `react-native-view-shot` - Screen capture
- `react-native-share` - Native sharing
- `react-native-image-picker` - Image selection
- `react-native-vector-icons` - Icon library

---

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- React Native development environment
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Restaurant-Admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Appwrite**
   
   Create `src/constants/config.ts`:
   ```typescript
   export const APP_CONFIG = {
     APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
     APPWRITE_PROJECT_ID: 'your-project-id',
     APPWRITE_DATABASE_ID: 'your-database-id',
     APPWRITE_DISHES_COLLECTION_ID: 'your-dishes-collection-id',
     APPWRITE_USERS_COLLECTION_ID: 'your-users-collection-id',
     APPWRITE_BUCKET_ID: 'your-bucket-id',
     WEB_URL: 'https://yourrestaurant.com'
   };
   ```

4. **Run the app**

   **Android:**
   ```bash
   npx react-native run-android
   ```

   **iOS:**
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

---

## 🗄️ Database Schema

### Users Collection
```typescript
{
  userId: string;           // Appwrite user ID
  email: string;           // User email
  restaurantName: string;  // Restaurant name
  createdAt: string;       // ISO timestamp
}
```

### Dishes Collection
```typescript
{
  $id: string;            // Document ID
  name: string;           // Dish name
  category: string;       // Category (Appetizer, Main Course, etc.)
  price: number;          // Price in currency
  images: string;         // Appwrite storage URL
  restaurantId: string;   // Owner's restaurant ID
  isAvailable: boolean;   // Availability status
  createdAt: string;      // ISO timestamp
}
```

---

## 📁 Project Structure

```
Restaurant Admin/
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── Icons.tsx           # Custom SVG icons
│   │       └── ...
│   ├── constants/
│   │   └── config.ts               # App configuration
│   ├── features/
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── RegisterScreen.tsx
│   │   │   └── services/
│   │   │       └── authService.ts
│   │   ├── dishes/
│   │   │   ├── screens/
│   │   │   │   ├── DashboardScreen.tsx
│   │   │   │   ├── AddDishScreen.tsx
│   │   │   │   └── EditDishScreen.tsx
│   │   │   ├── components/
│   │   │   │   └── DishCard.tsx
│   │   │   └── services/
│   │   │       └── dishService.ts
│   │   ├── qr/
│   │   │   └── screens/
│   │   │       └── QRScreen.tsx    # QR Menu Generator
│   │   └── profile/
│   │       └── screens/
│   │           └── ProfileScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── types/
│   │   ├── index.ts                # Type definitions
│   │   └── navigation.ts
│   └── App.tsx
├── android/                        # Android native code
├── ios/                           # iOS native code
├── package.json
└── README.md
```

---

## 🚀 Usage Guide

### Adding a Dish

1. Navigate to **Dashboard** tab
2. Tap **"+ Add Dish"** button
3. Fill in dish details:
   - Upload image
   - Enter name
   - Select category
   - Set price
4. Tap **"Add Dish"**

### Generating QR Menu

1. Navigate to **QR** tab
2. View paginated menu (3 dishes per page)
3. Use navigation arrows to browse pages
4. Choose export option:
   - **Save Page**: Download current page as image
   - **Full PDF**: Generate complete menu PDF
   - **Share Page**: Share current page

### Managing Availability

1. Go to **Dashboard**
2. Toggle the **"Available"** switch on any dish card
3. Only available dishes appear in QR menu

---

## 🎨 Customization

### Changing Theme Colors

Edit `src/constants/config.ts`:
```typescript
export const THEME = {
  primary: '#FF6B6B',      // Main color
  secondary: '#2C3E50',    // Text color
  accent: '#7F8C8D',       // Gray
  success: '#2ECC71',      // Green
  warning: '#FF9800',      // Orange
  info: '#3498DB'          // Blue
};
```

### Dishes Per Page

Edit `QRScreen.tsx`:
```typescript
// Change from 3 to your preferred number
for (let i = 0; i < availableDishes.length; i += 3) {
  pages.push(availableDishes.slice(i, i + 3));
}
```

---

## 📖 Documentation

- **[QR Screen Documentation](docs/qr_screen_documentation.md)** - Detailed QR Menu feature guide
- **[QR Generator Implementation](docs/qr_generator_implementation_guide.md)** - Build your own QR API
- **[Database Setup Guide](docs/database_update_guide.md)** - Appwrite configuration

---

## 🐛 Troubleshooting

### PDF Not Generating
- Ensure `react-native-print` is properly linked
- Rebuild the app: `npx react-native run-android`
- Check Appwrite image URLs are publicly accessible

### QR Codes Not Scanning
- Increase QR code size (minimum 80x80)
- Ensure dish images have valid URLs
- Test with different QR scanner apps

### Images Not Loading
- Verify Appwrite storage permissions
- Check image URLs use HTTPS
- Ensure bucket is publicly accessible

### Build Errors
```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

---

## 🔒 Security

- All authentication handled by Appwrite
- Secure session management
- Environment variables for sensitive data
- Image storage with access control
- HTTPS for all API calls

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- [React Native](https://reactnative.dev/)
- [Appwrite](https://appwrite.io/)
- [React Navigation](https://reactnavigation.org/)
- [QRCode Library](https://github.com/awesomejerry/react-native-qrcode-svg)

---

## 📞 Support

For support, email your.email@example.com or open an issue on GitHub.

---

**Made with ❤️ for Restaurant Owners**
