import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getFunctions, Functions } from "firebase/functions";

const STORAGE_KEY = 'sls_firebase_config';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions;
let isConfigured = false;

const getStoredConfig = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Failed to parse stored config", e);
    return null;
  }
};

// 1. Try Local Storage (User entered via UI)
const storedConfig = getStoredConfig();

// 2. Try Environment Variables
const envConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let finalConfig: any = null;

if (storedConfig && storedConfig.apiKey && storedConfig.projectId) {
  finalConfig = { ...storedConfig };
} else if (envConfig.apiKey && envConfig.apiKey !== "undefined" && envConfig.apiKey !== "demo-key") {
  finalConfig = { ...envConfig };
}

// Validation: Ensure we don't try to initialize with empty objects
if (finalConfig) {
  // Auto-populate authDomain if missing but projectId exists
  if (finalConfig.projectId && !finalConfig.authDomain) {
    finalConfig.authDomain = `${finalConfig.projectId}.firebaseapp.com`;
  }
  
  // Basic validation check
  if (!finalConfig.apiKey || !finalConfig.projectId) {
    console.warn("Invalid config detected", finalConfig);
    finalConfig = null;
  }
}

if (finalConfig) {
  try {
    if (!getApps().length) {
      app = initializeApp(finalConfig);
    } else {
      app = getApps()[0];
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    functions = getFunctions(app);
    isConfigured = true;
    
  } catch (error) {
    console.error("Firebase initialization failed.", error);
    // Reset config if it crashes initialization to prevent loops
    isConfigured = false;
  }
} else {
  // Fallback for types, but isConfigured remains false
  isConfigured = false;
}

export { db, auth, functions, isConfigured };