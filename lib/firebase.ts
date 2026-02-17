import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getFunctions, Functions } from "firebase/functions";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let functions: Functions | undefined;

// --- CONFIGURATION ---
// 1. Environment Variables (Priority)
// 2. Local Storage (Fallback for UI-based setup)

const getEnvConfig = () => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
};

const getStoredConfig = () => {
  try {
    const stored = localStorage.getItem('firebase_config');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const envConfig = getEnvConfig();
// Simple check to ensure keys are loaded from env
const hasEnvConfig = !!envConfig.apiKey && !!envConfig.projectId;

const config = hasEnvConfig ? envConfig : getStoredConfig();

export const isConfigured = !!config && !!config.apiKey && !!config.projectId;

const init = (cfg: FirebaseOptions) => {
  try {
    if (!getApps().length) {
      app = initializeApp(cfg);
    } else {
      app = getApps()[0];
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    functions = getFunctions(app);
    console.log("Firebase initialized");
    return true;
  } catch (error) {
    console.error("Firebase initialization failed.", error);
    return false;
  }
};

if (isConfigured) {
  init(config);
} else {
  console.warn("Firebase configuration missing. Ensure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are set in .env.local or use the Setup Screen.");
}

export const saveFirebaseConfig = (newConfig: any) => {
  localStorage.setItem('firebase_config', JSON.stringify(newConfig));
  return init(newConfig);
};

export { db, auth, functions };