import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile } from "../types";

const ADMIN_CODE = "cardinal"; // The special code to become an admin

export const subscribeToAuth = (
  onUserChanged: (user: User | null) => void,
  onProfileChanged: (profile: UserProfile | null) => void
) => {
  if (!auth) return () => {};

  return onAuthStateChanged(auth, async (firebaseUser) => {
    onUserChanged(firebaseUser);

    if (firebaseUser) {
      // Subscribe to the user's profile in Firestore
      if (!db) return;
      const userRef = doc(db, "users", firebaseUser.uid);
      
      const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          onProfileChanged(docSnap.data() as UserProfile);
        } else {
          // Profile might not exist yet if just created, handle gracefully
          onProfileChanged(null);
        }
      });
      return unsubscribeProfile;
    } else {
      onProfileChanged(null);
    }
  });
};

export const login = async (email: string, pass: string) => {
  if (!auth) throw new Error("Auth not initialized");
  await signInWithEmailAndPassword(auth, email, pass);
};

export const register = async (email: string, pass: string, adminCode?: string) => {
  if (!auth || !db) throw new Error("Firebase not initialized");
  
  // 1. Create Auth User
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // 2. Create User Profile in Firestore
  const isAdmin = adminCode === ADMIN_CODE;
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    role: isAdmin ? 'admin' : 'student',
    createdAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", user.uid), profile);
  return profile;
};

export const logout = async () => {
  if (!auth) return;
  await firebaseSignOut(auth);
};

export const resetPassword = async (email: string) => {
  if (!auth) throw new Error("Auth not initialized");
  await sendPasswordResetEmail(auth, email);
};