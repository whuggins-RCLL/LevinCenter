import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getFunctions, type Functions } from "firebase/functions";

// ------------------------------------------------------------------
// INSTRUCTIONS:
// 1. Go to Firebase Console > Project Settings > General > Your apps
// 2. Copy the values from the SDK setup and paste them below.
// ------------------------------------------------------------------

const firebaseConfig = {
  // Replace these with your actual Firebase values
  apiKey: "AIzaSyDObqG7ijP6WC-_4yxamFcf_Ps1xZBekhA",
  authDomain: "levincenter-c08c0.firebaseapp.com",
  projectId: "levincenter-c08c0",
  storageBucket: "levincenter-c08c0.firebasestorage.app",
  messagingSenderId: "135687192664",
  appId: "1:135687192664:web:72dd9532f01bab50958a2d"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions;

// We set this to true so the App bypasses the manual setup screen.
// Ensure the config above is valid, or the app will crash in the console.
const isConfigured = true; 

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
  functions = getFunctions(app);
  
} catch (error) {
  console.error("Firebase initialization failed. Check your firebaseConfig in lib/firebase.ts", error);
}

export { db, auth, functions, isConfigured };