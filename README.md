# Harmony Hub - Phase 1: Core Authentication

A social mobile application for music lovers to log, rate, and review concerts.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.19.4 or higher recommended)
- Expo CLI (`npm install -g @expo/cli`)
- Firebase account

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**

   a. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)

   b. Enable Authentication:
      - Go to Authentication > Sign-in method
      - Enable "Email/Password" provider

   c. Enable Firestore:
      - Go to Firestore Database
      - Create a new Firestore database in production mode

   d. Get your Firebase config:
      - Go to Project Settings (gear icon)
      - Scroll down to "Your apps" section
      - Click "Add app" and select Web app (</>)
      - Copy the config object

3. **Configure Firebase in the app:**

   Edit `firebaseConfig.ts` and replace the placeholder values with your Firebase config:

   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id",
   };
   ```

### Running the App

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your phone

## 📱 Features Implemented

### Phase 1: Core Authentication
- ✅ User Sign-Up (Email/Password)
- ✅ User Log-In (Email/Password)
- ✅ User Log-Out
- ✅ Basic User Profile Creation (Firestore document)
- ✅ Authentication-based navigation
- ✅ Global authentication state management

### Phase 2: Data Model & Basic Concert Logging
- ✅ Firestore Data Models for all entities (users, artists, venues, concerts, reviews)
- ✅ Concert Logging Form with artist name, venue name, date picker, star rating, and notes
- ✅ Artist/Venue lookup and creation logic (creates new if doesn't exist)
- ✅ Concert creation with proper Firestore references
- ✅ User Profile Screen displaying logged concerts
- ✅ Navigation between screens (Home → Log Concert → User Profile)
- ✅ Automatic user profile updates when concerts are logged

### Phase 3: User Profile & Concert Display
- ✅ User Profile Screen with personal information and activity summary
- ✅ Concert history display with chronological ordering
- ✅ Concert details with artist, venue, date, rating, and personal notes
- ✅ Navigation from profile to individual concert details
- ✅ Loading states and error handling for data fetching

### Phase 4: Review and Comment System
- ✅ Enhanced ConcertDetailScreen with full concert information display
- ✅ Review submission form for authenticated users
- ✅ Display of all reviews with reviewer information and ratings
- ✅ Like functionality for reviews with atomic operations via Cloud Functions
- ✅ Comment system with subcollection structure under reviews
- ✅ Real-time comment display and submission
- ✅ Firebase Cloud Functions for atomic like/comment operations
- ✅ Proper data relationships and referential integrity

### Phase 5: Explore & Search Functionality, Social Feed
- ✅ ExploreScreen with global search bar and trending content
- ✅ Firestore-based search for concerts, artists, and venues
- ✅ Trending concerts display (most recently logged)
- ✅ Popular artists showcase
- ✅ Firebase Cloud Functions for third-party API proxies (Ticketmaster, MusicBrainz, Google Places)
- ✅ Social Feed screen showing activities from followed users
- ✅ Following/unfollowing system with subcollection structure
- ✅ Activity feed with concert logs and reviews from followed users
- ✅ Tab navigation (Home, Explore, Feed) for authenticated users
- ✅ Proper navigation flow between all screens

### Phase 6: Refinements, Error Handling & Production Readiness
- ✅ **Global Error Handling**: React Error Boundaries and comprehensive error catching
- ✅ **User-Friendly Error Messages**: Toast notifications and consistent error feedback
- ✅ **Performance Optimization**: Debounced search inputs, query optimization, lazy loading
- ✅ **Loading States**: Consistent loading indicators throughout the app
- ✅ **Empty States**: User-friendly empty state designs for all lists and sections
- ✅ **Firebase Security Rules**: Comprehensive security rules for all collections and subcollections
- ✅ **Firebase Analytics**: Event tracking for key user actions (login, signup, concert logging, reviews, etc.)
- ✅ **Environment Configuration**: Secure environment variables setup with Expo Constants
- ✅ **AsyncStorage Integration**: Firebase Auth persistence for better user experience
- ✅ **Production Readiness**: Error boundaries, proper logging, and security hardening

## 🏗️ Project Structure

```
harmonyhub/
├── App.tsx                    # Main app component with error boundaries
├── app.config.ts              # Expo configuration with environment variables
├── firebaseConfig.ts          # Firebase configuration with AsyncStorage
├── firestore.rules            # Firebase Security Rules
├── .env.example               # Environment variables template
├── types/
│   └── index.ts               # TypeScript type definitions
├── context/
│   └── AuthContext.tsx        # Authentication context
├── components/
│   ├── ErrorBoundary.tsx      # React Error Boundary component
│   └── Toast.tsx              # Toast notification system
├── services/
│   ├── analyticsService.ts    # Firebase Analytics integration
│   ├── authService.ts         # Authentication functions with analytics
│   ├── concertService.ts      # Concert-related database operations
│   └── searchService.ts       # Search functionality with debouncing
├── screens/
│   ├── LoginScreen.tsx        # Login screen
│   ├── SignUpScreen.tsx       # Sign up screen
│   ├── HomeScreen.tsx         # Home screen for authenticated users
│   ├── LogConcertScreen.tsx   # Concert logging form
│   ├── UserProfileScreen.tsx  # User profile with concert history
│   ├── ExploreScreen.tsx      # Search and discovery screen
│   ├── FeedScreen.tsx         # Social activity feed
│   └── ConcertDetailScreen.tsx # Concert details with reviews/comments
├── navigation/
│   ├── AppNavigator.tsx       # Main stack navigation setup
│   └── TabNavigator.tsx       # Bottom tab navigation for main app
├── functions/                 # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts          # Cloud Functions implementation
│   ├── package.json          # Functions dependencies
│   └── tsconfig.json         # Functions TypeScript config
└── assets/                    # App assets
```

## 🚀 Deployment Guide

### Environment Setup
1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your Firebase configuration** in `.env`:
   ```bash
   FIREBASE_API_KEY=your_actual_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_actual_project_id
   # ... etc
   ```

3. **Deploy Firebase Security Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Deploy Cloud Functions:**
   ```bash
   cd functions
   npm run deploy
   ```

### Expo Build & Deploy
1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to EAS:**
   ```bash
   eas login
   ```

3. **Configure build:**
   ```bash
   eas build:configure
   ```

4. **Build for production:**
   ```bash
   eas build --platform ios     # For iOS
   eas build --platform android # For Android
   ```

## 🔧 Firebase Setup Details

### Authentication
- Email/Password authentication enabled with AsyncStorage persistence
- User profiles stored in Firestore `users` collection
- Analytics integration for user behavior tracking
- Automatic profile creation on sign-up

### Firestore Rules (you'll need to set these in Firebase Console)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Testing the Authentication Flow

1. **Sign Up:** Create a new account with email/password
2. **Login:** Use the same credentials to log in
3. **Home Screen:** Should show user info and logout option
4. **Logout:** Should return to login screen

## 🚀 Next Steps (Phase 7+)

- Enhanced User Profile Management (edit profile, preferences)
- Push Notifications for concert updates
- Advanced filtering and discovery features
- Real-time chat between users
- Concert recommendations based on user preferences
- Photo uploads for concert logs and reviews
- Admin dashboard for content moderation
- Premium features and subscriptions

## 🎯 **Harmony Hub is Production Ready!**

The app now includes:
- **Complete authentication system** with Firebase Auth
- **Social concert logging and discovery** platform
- **Review and comment system** for community engagement
- **Robust error handling and performance optimization**
- **Comprehensive security rules and analytics**
- **Production-ready architecture** with proper error boundaries and logging

**Ready to deploy to App Store and Google Play!** 🚀📱

## 📚 Technologies Used

- **Frontend:** React Native, Expo
- **Backend:** Firebase Authentication, Firestore
- **Navigation:** React Navigation v6
- **State Management:** React Context API
- **Styling:** React Native StyleSheet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
