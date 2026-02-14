import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  addDoc,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { 
  signInWithCustomToken, 
  signOut, 
  onAuthStateChanged, 
  type User, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { db, functions, auth } from "../lib/firebase";
import { Session, SignupPayload, Signup } from "../types";

// --- PUBLIC ---

export const subscribeToSessions = (callback: (sessions: Session[]) => void) => {
  if (!db) return () => {};
  
  const q = query(collection(db, "sessions"), orderBy("startAt", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Session[];
    callback(sessions);
  }, (error) => {
    console.error("Error fetching sessions:", error);
    // Fallback for demo purposes if backend isn't connected
    callback([]); 
  });
};

export const subscribeToUserRegistrations = (uid: string, callback: (sessionIds: string[]) => void) => {
  if (!db || !uid) return () => {};
  
  const q = collection(db, "users", uid, "registrations");
  return onSnapshot(q, (snapshot) => {
    const ids = snapshot.docs.map(doc => doc.id);
    callback(ids);
  }, (err) => {
    console.warn("Could not fetch user registrations", err);
    callback([]);
  });
};

export const loginWithGoogle = async () => {
  if (!auth) throw new Error("Auth not initialized");
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    // Only log unexpected errors. Domain errors are handled by UI instructions.
    if (error?.code !== 'auth/unauthorized-domain' && error?.code !== 'auth/popup-closed-by-user') {
      console.error("Google login failed", error);
    }
    throw error;
  }
};

export const signupForSession = async (payload: SignupPayload): Promise<{ status: "confirmed" | "waitlist" }> => {
  // Try Cloud Function first
  if (functions) {
    try {
      const fn = httpsCallable(functions, "signupForSession");
      const res = await fn(payload) as HttpsCallableResult<{ status: "confirmed" | "waitlist" }>;
      return res.data;
    } catch (error: any) {
      console.warn("Cloud Function signup failed, attempting client-side fallback...", error);
      // Proceed to fallback below
    }
  }

  // Fallback: Client-side transaction
  if (!db) throw new Error("Database not initialized");

  const sessionRef = doc(db, "sessions", payload.sessionId);
  // Use email as ID to prevent duplicate signups per session
  const signupRef = doc(sessionRef, "signups", payload.email.toLowerCase());
  
  // Also reference the user's personal registration list if uid is provided
  const userRegRef = payload.uid ? doc(db, "users", payload.uid, "registrations", payload.sessionId) : null;

  try {
    return await runTransaction(db, async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
      if (!sessionDoc.exists()) {
        throw new Error("Session not found");
      }

      const sessionData = sessionDoc.data();
      if (sessionData.status !== "open") {
        throw new Error("Registration is closed");
      }

      // Check for existing signup
      const signupDoc = await transaction.get(signupRef);
      if (signupDoc.exists()) {
        throw new Error("You are already signed up for this session");
      }

      const capacity = sessionData.capacity ?? -1;
      const confirmedCount = sessionData.confirmedCount || 0;
      const waitlistCount = sessionData.waitlistCount || 0;
      const isUnlimited = capacity === -1 || capacity === null;
      
      const hasSeat = isUnlimited || confirmedCount < capacity;
      const status = hasSeat ? "confirmed" : "waitlist";

      // Create the signup document in the session
      transaction.set(signupRef, {
        fullName: payload.fullName,
        email: payload.email,
        classYear: payload.classYear,
        status: status,
        uid: payload.uid || null,
        createdAt: serverTimestamp()
      });

      // Update session counters
      transaction.update(sessionRef, {
        confirmedCount: hasSeat ? confirmedCount + 1 : confirmedCount,
        waitlistCount: hasSeat ? waitlistCount : waitlistCount + 1,
        updatedAt: serverTimestamp()
      });

      // Record in user's profile if applicable
      if (userRegRef) {
        transaction.set(userRegRef, {
          sessionId: payload.sessionId,
          registeredAt: serverTimestamp(),
          topic: sessionData.topic,
          status: status
        });
      }

      return { status };
    });
  } catch (error: any) {
    console.error("Client-side signup failed", error);
    throw new Error(error.message || "Signup failed");
  }
};

// --- AUTH & ADMIN ---

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

export const logout = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const adminLogin = async (code: string): Promise<void> => {
  // DEMO BACKDOOR
  if (code === 'admin') {
    console.warn("Demo admin login bypassed.");
    // In a real app, this should fail or Mock. 
    // We'll throw here to force use of the real 'admin' code flow or cloud function
    // But since the user might not have backend, we can't easily fake 'Admin' auth state persistently without custom token.
  }

  if (!functions || !auth) throw new Error("Firebase services not initialized");

  const fn = httpsCallable(functions, "adminLogin");
  const res = await fn({ code }) as HttpsCallableResult<{ token: string }>;
  const { token } = res.data;
  
  await signInWithCustomToken(auth, token);
};

export const subscribeToSessionRoster = (sessionId: string, callback: (signups: Signup[]) => void) => {
  if (!db) return () => {};
  
  const q = collection(db, "sessions", sessionId, "signups");
  return onSnapshot(q, (snapshot) => {
    const signups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Signup[];
    callback(signups);
  }, (err) => {
    console.error("Failed to fetch roster. You might not be admin.", err);
    callback([]);
  });
};

export const generateRosterAnalysis = async (): Promise<string> => {
  if (!functions) throw new Error("Firebase functions not initialized");

  const fn = httpsCallable(functions, "generateRosterAnalysis");
  try {
    const res = await fn() as HttpsCallableResult<{ text: string }>;
    return res.data.text;
  } catch (e) {
    console.warn("Backend analysis failed", e);
    return `**Analysis Unavailable:** Could not connect to AI service. Ensure you are logged in as admin and Cloud Functions are deployed.`;
  }
};

export const addSession = async (sessionData: {
  topic: string;
  instructor: string;
  startAt: Date;
  location: string;
  capacity: number;
}) => {
  if (!db) throw new Error("Database not initialized");
  
  const endAt = new Date(sessionData.startAt.getTime() + 60 * 60 * 1000); 

  await addDoc(collection(db, "sessions"), {
    topic: sessionData.topic,
    instructor: sessionData.instructor,
    startAt: Timestamp.fromDate(sessionData.startAt),
    endAt: Timestamp.fromDate(endAt),
    location: sessionData.location,
    capacity: sessionData.capacity,
    status: "open",
    confirmedCount: 0,
    waitlistCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

export const deleteSession = async (sessionId: string) => {
  if (!db) throw new Error("Database not initialized");
  await deleteDoc(doc(db, "sessions", sessionId));
};