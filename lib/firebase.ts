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
// and supports both Vite (import.meta.env) and standard Node (process.env)
const getEnv = (key: string) => {
  try {
    // 1. Try Vite standard (import.meta.env)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
    
    // 2. Try Node/Process standard (fallback)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    console.warn("Error reading env var:", key);
  }
  return undefined;
};

// --- CONFIGURATION ---

const getEnvConfig = () => {
  return {
    apiKey: getEnv("VITE_FIREBASE_API_KEY"),
    authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnv("VITE_FIREBASE_APP_ID"),
    measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID")
  };
};

// 2. Local Storage (Fallback for UI-based setup)
const getStoredConfig = (): FirebaseOptions | null => {
  try {
    const stored = localStorage.getItem('firebase_config');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const envConfig = getEnvConfig();
const hasEnvConfig = !!envConfig.apiKey && !!envConfig.projectId;

// Priority: Env Vars > Local Storage
let firebaseConfig: FirebaseOptions = hasEnvConfig ? envConfig : (getStoredConfig() || {});

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
      console.log("Firebase initialized successfully");
      return true;
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      return false;
    }
  } else {
    console.log("Firebase not configured yet. Waiting for keys.");
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