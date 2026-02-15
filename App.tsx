import React, { useEffect, useState } from 'react';
import { ViewState, Session, UserProfile } from './types';
import { subscribeToSessions } from './services/backend';
import { subscribeToAuth, logout } from './services/auth';
import SessionCard from './components/SessionCard';
import SignupModal from './components/SignupModal';
import AdminView from './components/AdminView';
import AuthScreen from './components/AuthScreen';

export default function App() {
  const [view, setView] = useState<ViewState>('browse');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Auth State
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Data Loading
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to Auth Changes
    const unsubscribeAuth = subscribeToAuth(
      (user) => {
        setAuthUser(user);
        if (!user) {
          setAuthLoading(false);
          setUserProfile(null);
        }
      },
      (profile) => {
        setUserProfile(profile);
        setAuthLoading(false);
      }
    );

    // 2. Subscribe to Sessions (Data)
    const unsubscribeSessions = subscribeToSessions((data) => {
      setSessions(data);
      setDataLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSessions();
    };
  }, []);

  // Determine if Admin
  const isAdmin = userProfile?.role === 'admin';

  // If loading auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
      </div>
    );
  }

  // If not logged in, show Auth Screen
  if (!authUser) {
    return <AuthScreen />;
  }

  // Main App Content
  const renderContent = () => {
    if (view === 'admin' && isAdmin) {
      return <AdminView sessions={sessions} />;
    }
    
    // Browse View
    return (
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            Faculty Small Group Discussions
          </h1>
          <p className="text-lg text-gray-600">
            Connect with SLS faculty in an informal setting. Browse upcoming topics and secure your spot.
          </p>
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No sessions currently available. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onSignup={setSelectedSession}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-[#8C1515] text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer" onClick={() => setView('browse')}>
              <span className="font-bold text-xl tracking-tight">SLS Levin Center</span>
            </div>
            <div className="flex items-center space-x-4">
              {view !== 'browse' && (
                <button 
                  onClick={() => setView('browse')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-100 hover:bg-[#7a1212] transition-colors"
                >
                  All Sessions
                </button>
              )}

              {isAdmin && view !== 'admin' && (
                <button 
                  onClick={() => setView('admin')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-100 hover:bg-[#7a1212] transition-colors"
                >
                  Admin Dashboard
                </button>
              )}
              
              {isAdmin && view === 'admin' && (
                 <span className="text-xs bg-red-800 px-2 py-1 rounded">Admin Mode</span>
              )}

              <a 
                href="https://law.stanford.edu/levin-center/" 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-100 hover:bg-[#7a1212] transition-colors flex items-center gap-1"
              >
                Website
                <svg className="w-3 h-3 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <button 
                onClick={() => logout()}
                className="text-gray-300 hover:text-white text-sm font-medium ml-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Stanford Law School Levin Center.
          </p>
          <div className="mt-2 text-xs text-gray-400">
             Logged in as: {authUser.email} {isAdmin ? '(Admin)' : ''}
          </div>
        </div>
      </footer>

      {/* Modal */}
      {selectedSession && (
        <SignupModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={() => {
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
}