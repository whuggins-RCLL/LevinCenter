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

let finalConfig;

if (storedConfig && storedConfig.apiKey) {
  finalConfig = storedConfig;
  isConfigured = true;
} else if (envConfig.apiKey && envConfig.apiKey !== "undefined" && envConfig.apiKey !== "demo-key") {
  finalConfig = envConfig;
  isConfigured = true;
} else {
  // No valid configuration found. 
  // We do NOT provide a fallback here because we want to force the user 
  // to input their own keys via SetupScreen.
  finalConfig = {
    apiKey: "demo-key",
    authDomain: "demo.firebaseapp.com",
    projectId: "demo-project",
  };
  isConfigured = false;
}

try {
  // Only initialize if we have a potentially valid config (isConfigured is checked in App.tsx)
  // But we initialize anyway to prevent crashes if code tries to access exports, 
  // though they won't work without real keys.
  if (!getApps().length) {
    app = initializeApp(finalConfig);
  } else {
    app = getApps()[0];
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
  functions = getFunctions(app);
  
} catch (error) {
  console.error("Firebase initialization failed.", error);
  isConfigured = false;
}

export { db, auth, functions, isConfigured };