import { Timestamp } from 'firebase/firestore';

export const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'TBD';
  
  // Handle Firestore Timestamp or raw object
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles' // Force Stanford Time
  }).format(date);
};

export const formatTime = (timestamp: any): string => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'America/Los_Angeles' // Force Stanford Time
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
  // We explicitly extract the components in Pacific Time (Stanford Time)
  // regardless of the user's browser timezone.
  const formatToPacificISO = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const p = (type: string) => parts.find(x => x.type === type)?.value || '00';
    
    // Check if hour is '24' (midnight edge case in some browsers) and handle if necessary, 
    // though en-US hour12:false usually gives 00-23.
    let hour = p('hour');
    if (hour === '24') hour = '00';
    
    return `${p('year')}${p('month')}${p('day')}T${hour}${p('minute')}${p('second')}`;
  };

  const start = formatToPacificISO(startDate);
  const end = formatToPacificISO(endDate);
  
  const details = `Instructor: ${session.instructor}\nLocation: ${session.location}\n\nRegistered via SLS Levin Center Portal.`;
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', `SLS Session: ${session.topic}`);
  url.searchParams.append('dates', `${start}/${end}`);
  url.searchParams.append('details', details);
  url.searchParams.append('location', session.location);
  url.searchParams.append('sf', 'true');
  url.searchParams.append('output', 'xml');
  // Explicitly tell Google that the times above are in Pacific Time
  url.searchParams.append('ctz', 'America/Los_Angeles');

  return url.toString();
};