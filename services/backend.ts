import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  runTransaction,
  serverTimestamp,
  getDocs,
  getDoc,
  collectionGroup,
  where
} from "firebase/firestore";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";
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
    callback([]); 
  });
};

export const getSignup = async (sessionId: string, email: string): Promise<Signup | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, "sessions", sessionId, "signups", email.toLowerCase());
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Signup;
    }
    return null;
  } catch (error) {
    console.error("Error fetching signup:", error);
    return null;
  }
};

export const signupForSession = async (payload: SignupPayload): Promise<{ status: "confirmed" | "waitlist" }> => {
  // Removed Cloud Function attempt to prevent warnings in client-only deployments.
  // We rely on the robust client-side transaction below.

  if (!db) throw new Error("Database not initialized");
  if (!auth?.currentUser) throw new Error("You must be signed in to register.");

  const sessionRef = doc(db, "sessions", payload.sessionId);
  // Use email (or UID) for deduplication
  const signupRef = doc(sessionRef, "signups", payload.email.toLowerCase());

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

      // Create the signup document
      transaction.set(signupRef, {
        fullName: payload.fullName,
        email: payload.email,
        classYear: payload.classYear,
        status: status,
        userId: auth.currentUser?.uid, // Link to auth user
        createdAt: serverTimestamp()
      });

      // Update session counters
      transaction.update(sessionRef, {
        confirmedCount: hasSeat ? confirmedCount + 1 : confirmedCount,
        waitlistCount: hasSeat ? waitlistCount : waitlistCount + 1,
        updatedAt: serverTimestamp()
      });

      return { status };
    });
  } catch (error: any) {
    console.error("Signup failed", error);
    if (error.code === 'permission-denied') {
       throw new Error("Access denied. Database rules may prevent this action.");
    }
    throw new Error(error.message || "Signup failed");
  }
};

export const sendConfirmationEmail = async (email: string, session: Session, status: string) => {
  if (!db) return;
  // This writes to a 'mail' collection, which is the standard trigger for the Firebase Email Extension.
  // If the extension is not installed, this just creates a document (harmless).
  try {
    await addDoc(collection(db, "mail"), {
      to: email,
      message: {
        subject: `SLS Session Confirmation: ${session.topic}`,
        text: `You are ${status} for ${session.topic} with ${session.instructor}.\n\nTime: ${session.startAt}\nLocation: ${session.location}`,
        html: `<p>You are <strong>${status}</strong> for <strong>${session.topic}</strong>.</p><p>Instructor: ${session.instructor}<br>Location: ${session.location}</p>`
      },
      createdAt: serverTimestamp()
    });
    console.log("Email trigger document created.");
  } catch (e) {
    console.warn("Could not trigger email (likely permission or config issue):", e);
  }
};

export const getMySignups = async (): Promise<(Signup & { session?: Session })[]> => {
  if (!db || !auth?.currentUser) return [];

  // This requires a Firestore Index on 'signups' collection group: userId ASC
  // If index is missing, this will fail with a link to create it in the console.
  try {
    const signupsQuery = query(
      collectionGroup(db, 'signups'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(signupsQuery);
    
    const results: (Signup & { session?: Session })[] = [];
    
    // We need to fetch the session details for each signup
    // Optimally, we would duplicate data, but for now we fetch parent sessions.
    const sessionPromises = snapshot.docs.map(async (docSnap) => {
      const signupData = { id: docSnap.id, ...docSnap.data() } as Signup;
      
      // The parent of the signup doc is 'signups' collection, parent of that is the session doc
      // Path: sessions/{sessionId}/signups/{signupId}
      const sessionRef = docSnap.ref.parent.parent;
      if (sessionRef) {
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
          return {
            ...signupData,
            session: { id: sessionSnap.id, ...sessionSnap.data() } as Session
          };
        }
      }
      return signupData;
    });

    return await Promise.all(sessionPromises);

  } catch (error: any) {
    console.error("Error fetching history:", error);
    if (error.code === 'failed-precondition') {
      console.warn("Missing Index for Collection Group query. Please create one in Firebase Console.");
    }
    return [];
  }
};

// --- ADMIN ---

export const subscribeToSignups = (sessionId: string, callback: (signups: Signup[]) => void) => {
  if (!db) return () => {};
  
  // Need to handle permissions. Rules must allow read.
  const q = query(collection(db, "sessions", sessionId, "signups"), orderBy("createdAt", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const signups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Signup[];
    callback(signups);
  }, (error) => {
    console.error(`Error fetching signups for session ${sessionId}:`, error);
    callback([]);
  });
};

export const getSignupsForSession = async (sessionId: string): Promise<Signup[]> => {
  if (!db) return [];
  const q = query(collection(db, "sessions", sessionId, "signups"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Signup[];
};

export const generateRosterAnalysis = async (): Promise<string> => {
  if (!functions) throw new Error("Firebase functions not initialized");

  const fn = httpsCallable(functions, "generateRosterAnalysis");
  try {
    const res = await fn() as HttpsCallableResult<{ text: string }>;
    return res.data.text;
  } catch (e: any) {
    console.error("Backend analysis failed:", e);
    throw new Error(e.message || "Failed to generate analysis");
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
  if (!auth?.currentUser) throw new Error("Unauthorized");
  
  // Default duration 1 hour for endAt
  const endAt = new Date(sessionData.startAt.getTime() + 60 * 60 * 1000); 

  try {
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
  } catch (error: any) {
    console.error("Error adding session:", error);
    if (error.code === 'permission-denied') {
      throw new Error("Permission denied. You must be an admin to add sessions.");
    }
    throw error;
  }
};

export const updateSession = async (sessionId: string, data: Partial<Omit<Session, 'startAt' | 'endAt'>> & { startAt?: Date | Session['startAt']; endAt?: Date | Session['endAt'] }) => {
  if (!db) throw new Error("Database not initialized");
  if (!auth?.currentUser) throw new Error("Unauthorized");
  
  const payload: any = { ...data, updatedAt: serverTimestamp() };
  if (data.startAt instanceof Date) payload.startAt = Timestamp.fromDate(data.startAt);
  if (data.endAt instanceof Date) payload.endAt = Timestamp.fromDate(data.endAt);

  const ref = doc(db, "sessions", sessionId);
  await updateDoc(ref, payload);
};

export const deleteSession = async (sessionId: string) => {
  if (!db) throw new Error("Database not initialized");
  if (!auth?.currentUser) throw new Error("Unauthorized");

  try {
    await deleteDoc(doc(db, "sessions", sessionId));
  } catch (error: any) {
    console.error("Error deleting session:", error);
    if (error.code === 'permission-denied') {
      throw new Error("Permission denied. You must be an admin to delete sessions.");
    }
    throw error;
  }
};

export const deleteSignup = async (sessionId: string, signupId: string) => {
  if (!db || !auth?.currentUser) throw new Error("Unauthorized");
  
  const sessionRef = doc(db, "sessions", sessionId);
  const signupRef = doc(sessionRef, "signups", signupId);

  await runTransaction(db, async (t) => {
    const sessionSnap = await t.get(sessionRef);
    const signupSnap = await t.get(signupRef);

    if (!signupSnap.exists()) return; // Already deleted
    if (!sessionSnap.exists()) throw new Error("Session not found");

    const signupData = signupSnap.data();
    const sessionData = sessionSnap.data();

    // Delete signup
    t.delete(signupRef);

    // Update counts
    if (signupData.status === 'confirmed') {
      const newCount = Math.max(0, (sessionData.confirmedCount || 0) - 1);
      t.update(sessionRef, { confirmedCount: newCount });
    } else if (signupData.status === 'waitlist') {
      const newCount = Math.max(0, (sessionData.waitlistCount || 0) - 1);
      t.update(sessionRef, { waitlistCount: newCount });
    }
  });
};

export const updateSignup = async (sessionId: string, signupId: string, data: Partial<Signup>) => {
  if (!db || !auth?.currentUser) throw new Error("Unauthorized");

  const sessionRef = doc(db, "sessions", sessionId);
  const signupRef = doc(sessionRef, "signups", signupId);

  await runTransaction(db, async (t) => {
    const sessionSnap = await t.get(sessionRef);
    const signupSnap = await t.get(signupRef);

    if (!signupSnap.exists()) throw new Error("Signup not found");
    
    const currentSignup = signupSnap.data();
    const newStatus = data.status;
    const oldStatus = currentSignup.status;

    // Update the signup doc
    t.update(signupRef, { ...data });

    // Handle status change counts if status is modified
    if (newStatus && newStatus !== oldStatus && sessionSnap.exists()) {
      const sessionData = sessionSnap.data();
      
      let newConfirmed = sessionData.confirmedCount || 0;
      let newWaitlist = sessionData.waitlistCount || 0;

      if (oldStatus === 'confirmed') newConfirmed--;
      if (oldStatus === 'waitlist') newWaitlist--;

      if (newStatus === 'confirmed') newConfirmed++;
      if (newStatus === 'waitlist') newWaitlist++;

      // Safety checks
      newConfirmed = Math.max(0, newConfirmed);
      newWaitlist = Math.max(0, newWaitlist);

      t.update(sessionRef, {
        confirmedCount: newConfirmed,
        waitlistCount: newWaitlist
      });
    }
  });
};

export const seedDatabase = async () => {
  if (!db) throw new Error("Database not initialized");
  
  const now = new Date();
  const sampleSessions = [
    {
      topic: "Supreme Court Practice",
      instructor: "Prof. Pamela Karlan",
      location: "Room 280B",
      capacity: 15,
      startAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // +2 days
    },
    {
      topic: "Tech Policy Discussion",
      instructor: "Prof. Larry Lessig",
      location: "Neukom 101",
      capacity: 20,
      startAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000) // +4 days
    },
    {
      topic: "Criminal Justice Reform",
      instructor: "Prof. David Sklansky",
      location: "Room 190",
      capacity: 12,
      startAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // +1 week
    },
    {
      topic: "International Human Rights",
      instructor: "Prof. Beth Van Schaack",
      location: "Room 110",
      capacity: 10,
      startAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // +10 days
    }
  ];

  try {
    const promises = sampleSessions.map(session => addSession(session));
    await Promise.all(promises);
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
};