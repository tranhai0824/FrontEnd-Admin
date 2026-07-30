import { getAuth, type Auth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Object.values(config).every(Boolean);

if (!isFirebaseConfigured) {
  console.error(
    'Firebase chưa được cấu hình đầy đủ. Kiểm tra các biến VITE_FIREBASE_* trong .env.local.',
  );
}

export const firebaseAuth: Auth | null = isFirebaseConfigured ? getAuth(initializeApp(config)) : null;
