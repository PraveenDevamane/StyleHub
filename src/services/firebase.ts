import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getPerformance, FirebasePerformance } from 'firebase/performance';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mock-auth-domain',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock-storage-bucket',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'mock-sender-id',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'mock-app-id',
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence
const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();
const db = getFirestore(app);
const storage = getStorage(app);

let analytics: Analytics | null = null;
let performance: FirebasePerformance | null = null;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    performance = getPerformance(app);
  } catch (err) {
    console.warn('Firebase Web Analytics/Performance failed to initialize:', err);
  }
}

export { app, auth, db, storage, analytics, performance };
