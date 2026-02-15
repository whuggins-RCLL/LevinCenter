import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getFunctions, Functions } from "firebase/functions";

// Production configuration: Keys must be provided via environment variables
const firebaseConfig = {
  apiKey: "AIzaSyDObqG7ijP6WC-_4yxamFcf_Ps1xZBekhA",
  authDomain: "levincenter-c08c0.firebaseapp.com",
  projectId: "levincenter-c08c0",
  storageBucket: "levincenter-c08c0.firebasestorage.app",
  messagingSenderId: "135687192664",
  appId: "1:135687192664:web:72dd9532f01bab50958a2d",
  measurementId: "G-4BRENN34M8"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions;

try {
  // Ensure critical config is present before initializing
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("Firebase configuration missing. Check your environment variables.");
  } else {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    functions = getFunctions(app);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { db, auth, functions };