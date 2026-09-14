import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length
  ? initializeApp({
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
    })
  : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Set custom parameters if needed
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// The shared users collection is located in the (default) database of photo-picker-507413
export const db = getFirestore(app);

export default app;
