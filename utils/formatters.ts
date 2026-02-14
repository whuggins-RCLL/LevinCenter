import { Timestamp } from 'firebase/firestore';

export const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'TBD';
  
  // Handle Firestore Timestamp or raw object
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatTime = (timestamp: any): string => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

export const getStatusBadgeColor = (status: string, spotsLeft: number, isWaitlist: boolean) => {
  if (status === 'closed') return 'bg-gray-100 text-gray-600';
  if (isWaitlist) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};
