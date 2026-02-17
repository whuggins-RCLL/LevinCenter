import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getFunctions, Functions } from "firebase/functions";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let functions: Functions | undefined;

// --- SAFE ENV ACCESS ---
// This wrapper prevents the "Cannot read properties of undefined" crash
// if import.meta.env is not supported in the current environment.
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key];
  } catch (e) {
    return undefined;
  }
};

// --- CONFIGURATION ---

// 1. Manual Configuration (For Local Development)
// PASTE YOUR KEYS HERE to skip the setup form locally.
// IMPORTANT: Remove these before committing to public Git repos if you want to keep them secret.
const manualConfig = {
  apiKey: "", 
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// 2. Environment Variables (For Vercel/Production)
const envConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID")
};

// 3. Local Storage (Fallback)
const getStoredConfig = (): FirebaseOptions | null => {
  try {
    const stored = localStorage.getItem('firebase_config');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Priority: Env Vars > Manual Config > Local Storage
let firebaseConfig: FirebaseOptions = 
  (envConfig.apiKey && envConfig.projectId) ? envConfig :
  (manualConfig.apiKey && manualConfig.projectId) ? manualConfig :
  (getStoredConfig() || {});

// Check configuration status
export let isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

const initialize = () => {
  if (isConfigured) {
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }
      
      db = getFirestore(app);
      auth = getAuth(app);
      functions = getFunctions(app);
      console.log("Firebase initialized");
      return true;
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      return false;
    }
  }
  return false;
};

// Attempt initial setup
initialize();

export const saveFirebaseConfig = (config: any) => {
  localStorage.setItem('firebase_config', JSON.stringify(config));
  firebaseConfig = config;
  isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
  return initialize();
};

export { db, auth, functions };