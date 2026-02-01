import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  memoryLocalCache 
} from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

// 1. MUST HAVE "export" HERE so AdminDash can access keys
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// 2. Singleton Initialization (Prevents "already initialized" crash)
let app;
let db;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, {
    localCache: memoryLocalCache() 
  });
} else {
  app = getApp();
  db = getFirestore(app);
}

const auth = getAuth(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;