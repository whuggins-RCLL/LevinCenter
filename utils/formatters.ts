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

export const generateGoogleCalendarUrl = (session: { topic: string; location: string; startAt: any; endAt?: any; instructor: string }) => {
  const startDate = session.startAt.toDate ? session.startAt.toDate() : new Date(session.startAt.seconds * 1000);
  
  let endDate;
  if (session.endAt) {
    endDate = session.endAt.toDate ? session.endAt.toDate() : new Date(session.endAt.seconds * 1000);
  } else {
    // Default to 1 hour duration if endAt is missing
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  // Format: YYYYMMDDTHHmmSS
  // We construct this manually from the local date components to preserve the "face value" of the time
  // (e.g. if the user entered 9:00, we want "090000").
  // We then append &ctz=America/Los_Angeles to the URL to tell Google "This 9:00 is 9:00 Pacific Time".
  const formatFloating = (d: Date) => {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return '' + d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      pad(d.getSeconds());
  };

  const start = formatFloating(startDate);
  const end = formatFloating(endDate);
  
  const details = `Instructor: ${session.instructor}\nLocation: ${session.location}\n\nRegistered via SLS Levin Center Portal.`;
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', `SLS Session: ${session.topic}`);
  url.searchParams.append('dates', `${start}/${end}`);
  url.searchParams.append('details', details);
  url.searchParams.append('location', session.location);
  url.searchParams.append('sf', 'true');
  url.searchParams.append('output', 'xml');
  // CRITICAL: Force Stanford Timezone (Pacific)
  url.searchParams.append('ctz', 'America/Los_Angeles');

  return url.toString();
};