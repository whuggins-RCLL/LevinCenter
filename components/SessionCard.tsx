import React from 'react';
import { Session } from '../types';
import Button from './Button';
import { formatDate, formatTime, getStatusBadgeColor } from '../utils/formatters';

interface SessionCardProps {
  session: Session;
  onSignup: (session: Session) => void;
  isAdmin?: boolean;
  onDelete?: (session: Session) => void;
  onViewRoster?: (session: Session) => void;
  onEdit?: (session: Session) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onSignup, isAdmin, onDelete, onViewRoster, onEdit }) => {
  const capacity = session.capacity ?? -1;
  const isUnlimited = capacity === -1;
  const spotsTaken = session.confirmedCount;
  const spotsLeft = isUnlimited ? 999 : Math.max(0, capacity - spotsTaken);
  const isWaitlist = !isUnlimited && spotsLeft === 0;
  
  const badgeColor = getStatusBadgeColor(session.status, spotsLeft, isWaitlist);
  
  const badgeText = session.status === 'closed' 
    ? 'Closed' 
    : isWaitlist 
      ? `Waitlist Only (${session.waitlistCount} ahead)` 
      : isUnlimited 
        ? 'Registration Open' 
        : `${spotsLeft} spots left`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
            {badgeText}
          </span>
          {isAdmin && (
            <span className="text-xs text-gray-400 font-mono">
              ID: {session.id.slice(0, 4)}...
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-1">{session.topic}</h3>
        <p className="text-lg text-[#8C1515] font-medium mb-4">{session.instructor}</p>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(session.startAt)} • {formatTime(session.startAt)}</span>
          </div>
          <div className="flex items-center">
            <svg className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{session.location}</span>
          </div>
        </div>
      </div>
      
      <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        {isAdmin ? (
          <div className="space-y-2">
             <Button 
              type="button"
              variant="secondary" 
              className="w-full text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewRoster?.(session);
              }}
            >
              View Roster ({session.confirmedCount + session.waitlistCount})
            </Button>
            <div className="flex space-x-2">
              <Button 
                type="button"
                variant="secondary" 
                className="w-full text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(session);
                }}
              >
                Edit
              </Button>
              <Button 
                type="button"
                variant="danger" 
                className="w-full text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(session);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            type="button"
            className={`w-full ${isWaitlist ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-50' : ''}`}
            variant={isWaitlist ? 'secondary' : 'primary'}
            disabled={session.status === 'closed'}
            onClick={() => onSignup(session)}
          >
            {isWaitlist ? 'Join Waitlist' : 'Sign Up Now'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionCard;