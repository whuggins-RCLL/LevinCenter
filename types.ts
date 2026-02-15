import { Timestamp } from 'firebase/firestore';

export interface Session {
  id: string;
  instructor: string;
  topic: string;
  startAt: Timestamp | { seconds: number, nanoseconds: number }; // Handle both Firestore types and potential simplified JSON
  endAt?: Timestamp | { seconds: number, nanoseconds: number };
  location: string;
  capacity: number | null; // null or -1 implies unlimited
  status: 'open' | 'closed';
  confirmedCount: number;
  waitlistCount: number;
}

export interface Signup {
  id: string;
  fullName: string;
  email: string;
  classYear: string;
  status: 'confirmed' | 'waitlist';
  userId?: string;
  createdAt: any;
}

export interface SignupPayload {
  sessionId: string;
  fullName: string;
  email: string;
  classYear: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'student' | 'admin';
  createdAt: any;
}

export type ViewState = 'browse' | 'admin';