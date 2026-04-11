import { getApp, getApps, initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function getMissingFirebaseEnvVars() {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  return required.filter((key) => !import.meta.env[key]);
}

export function getFirebaseStorageInstance() {
  const missingEnvVars = getMissingFirebaseEnvVars();
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Firebase config is incomplete. Missing: ${missingEnvVars.join(', ')}`,
    );
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getStorage(app);
}
