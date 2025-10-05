# Agri-Connect Mobile App

React Native mobile application for Agri-Connect platform.

## Features

### Customer Portal
- **Authentication**: Login, Register, Forgot Password
- **Home**: Featured products and categories
- **Products**: Browse and search products
- **Product Details**: View product information and add to cart
- **Cart**: Manage cart items
- **Checkout**: Place orders with delivery address
- **Orders**: View order history and track orders
- **Profile**: Manage account information

### Farmer Portal
- **Dashboard**: Business overview and statistics
- **Products**: Manage product listings (Add, Edit, Delete)
- **Orders**: View and manage customer orders
- **Analytics**: Track revenue, orders, and ratings
- **Profile**: Manage farmer account

### Support
- Help Center
- FAQ
- Privacy Policy
- Terms & Conditions
- Contact Support

## Setup

```bash
# Install dependencies
cd apps/mobile
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Configuration

Update API URL in `src/lib/api.ts`:
```typescript
const API_BASE_URL = 'YOUR_API_URL';
```

## Tech Stack

- React Native with Expo
- React Navigation
- Zustand (State Management)
- Axios (HTTP Client)
- AsyncStorage (Persistence)
- TypeScript

## Project Structure

```
src/
├── components/        # Reusable UI components
├── navigation/        # Navigation setup
├── screens/          # App screens
│   ├── auth/         # Authentication screens
│   ├── customer/     # Customer portal screens
│   ├── farmer/       # Farmer portal screens
│   └── support/      # Support screens
├── stores/           # State management
└── lib/              # Utilities and API client
```
