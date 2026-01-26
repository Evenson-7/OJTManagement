// firebaseConfig.js
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, // <-- I-IMPORT
  memoryLocalCache     // <-- I-IMPORT
} from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// 1. Initialize the App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. CRITICAL FIX: I-force ang Memory Cache (para hindi na mag-crash sa tab switch)
initializeFirestore(app, {
  localCache: memoryLocalCache() 
});

// 3. Initialize and Export Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;