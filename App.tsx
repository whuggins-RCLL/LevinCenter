import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { ViewState, Session } from './types';
import { subscribeToSessions, subscribeToAuth, logout, loginWithGoogle, subscribeToUserRegistrations } from './services/backend';
import { isConfigured } from './lib/firebase';
import SessionCard from './components/SessionCard';
import SignupModal from './components/SignupModal';
import AdminLogin from './components/AdminLogin';
import AdminView from './components/AdminView';
import SetupScreen from './components/SetupScreen';
import Button from './components/Button';

export default function App() {
  const [view, setView] = useState<ViewState>('browse');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set());
  
  // Error state for domain issues
  const [authDomainError, setAuthDomainError] = useState<string | null>(null);

  const [loadingSessions, setLoadingSessions] = useState(true);

  // If Firebase keys are missing, show the setup screen
  if (!isConfigured) {
    return <SetupScreen />;
  }

  useEffect(() => {
    // Session subscription
    const unsubscribeSessions = subscribeToSessions((data) => {
      setSessions(data);
      setLoadingSessions(false);
    });

    // Auth subscription
    const unsubscribeAuth = subscribeToAuth((u) => {
      setUser(u);
      setIsAuthReady(true);
    });

    return () => {
      unsubscribeSessions();
      unsubscribeAuth();
    };
  }, []);

  // Subscribe to user registrations whenever user changes
  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeToUserRegistrations(user.uid, (ids) => {
        setUserRegistrations(new Set(ids));
      });
      return () => unsub();
    } else {
      setUserRegistrations(new Set());
    }
  }, [user?.uid]);

  const handleAdminLoginSuccess = () => {
    // handled by auth state listener
  };

  const handleLogin = async () => {
    setAuthDomainError(null); // Clear previous error before trying
    try {
      await loginWithGoogle();
    } catch (error: any) {
      // Check for domain error via code OR message text to be robust
      const isDomainError = error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain');
      
      if (isDomainError) {
        setAuthDomainError(window.location.hostname);
      } else if (error.code === 'auth/popup-closed-by-user') {
        // User closed popup, no error needed
      } else {
        alert(`Sign in failed: ${error.message}`);
      }
    }
  };

  const resetConfiguration = () => {
    if (confirm("This will clear your stored Firebase configuration and reload the page. Continue?")) {
      localStorage.removeItem('sls_firebase_config');
      window.location.reload();
    }
  };

  const renderContent = () => {
    if (view === 'admin') {
      if (!isAuthReady) {
        return (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C1515]"></div>
          </div>
        );
      }

      if (user) {
        return <AdminView sessions={sessions} />;
      }
      
      return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
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
          {!user && isAuthReady && (
            <div className="mt-4">
               <button 
                 type="button"
                 onClick={handleLogin}
                 className="text-[#8C1515] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8C1515] rounded px-2 py-1"
               >
                 Sign in with Google to manage your schedule
               </button>
            </div>
          )}
        </div>

        {loadingSessions ? (
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
                isRegistered={userRegistrations.has(session.id)}
                // Regular users cannot see admin controls
                isAdmin={false} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const isVercelPreview = authDomainError?.includes('vercel.app') && authDomainError !== 'levin-center-signup.vercel.app';

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
              <button 
                onClick={() => setView('browse')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'browse' ? 'bg-[#660000] text-white' : 'text-gray-100 hover:bg-[#7a1212]'}`}
              >
                Browse
              </button>
              
              {isAuthReady && user ? (
                <>
                  <button 
                    onClick={() => setView('admin')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'admin' ? 'bg-[#660000] text-white' : 'text-gray-100 hover:bg-[#7a1212]'}`}
                  >
                    Admin Area
                  </button>
                  <div className="flex items-center space-x-2 pl-2 border-l border-[#7a1212]">
                     <span className="text-xs text-gray-200 hidden sm:inline-block max-w-[100px] truncate">
                       {user.email}
                     </span>
                     <button 
                       onClick={() => { logout(); setView('browse'); }}
                       className="px-3 py-2 rounded-md text-sm font-medium text-red-100 hover:bg-[#7a1212] transition-colors"
                     >
                       Sign Out
                     </button>
                  </div>
                </>
              ) : (
                 <div className="flex items-center space-x-2">
                    <button 
                       type="button"
                       onClick={handleLogin}
                       className="px-3 py-2 bg-white text-[#8C1515] rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => setView('admin')}
                      className="px-3 py-2 text-sm font-medium text-red-200 hover:text-white transition-colors"
                    >
                      Admin
                    </button>
                 </div>
              )}
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
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Stanford Law School Levin Center.
          </p>
          <button 
            onClick={resetConfiguration}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Configure Connection
          </button>
        </div>
      </footer>

      {/* Signup Modal */}
      {selectedSession && (
        <SignupModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={() => setSelectedSession(null)}
        />
      )}

      {/* Domain Error Modal (The "Help Screen") */}
      {authDomainError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-red-50 p-6 border-b border-red-100 flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Security Check</h3>
                <p className="text-sm text-red-800 mt-1">Authorized Domain Mismatch</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {isVercelPreview ? (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                   <p className="text-sm text-yellow-800 font-bold mb-1">⚠️ You are on a Preview URL</p>
                   <p className="text-sm text-yellow-800">
                     Vercel creates a unique URL for every update (e.g. <code>-git-main</code>). 
                     You must add <strong>this specific URL</strong> to Firebase, not just the main one.
                   </p>
                </div>
              ) : (
                <p className="text-gray-700 text-sm">
                  It usually takes <strong>5-10 minutes</strong> for Firebase to recognize a new domain. If you added it recently, just wait a bit.
                </p>
              )}

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current URL (Browser):</p>
                <div className="mt-1 flex items-center space-x-2">
                  <code className="flex-1 block w-full p-3 bg-red-50 border border-red-200 rounded text-sm font-mono text-red-800 break-all font-bold">
                    {authDomainError}
                  </code>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-3">
                 <h4 className="font-semibold text-gray-900 text-sm">Troubleshooting:</h4>
                 <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    <li>Copy the URL above.</li>
                    <li>Go to Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains.</li>
                    <li>Click <strong>Add Domain</strong> and paste it.</li>
                    {authDomainError === '127.0.0.1' && (
                       <li><strong>Tip:</strong> Use <code>localhost</code> instead of <code>127.0.0.1</code> in your browser.</li>
                    )}
                 </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                   variant="secondary"
                   className="flex-1"
                   onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
                <Button 
                   className="flex-1"
                   onClick={() => handleLogin()}
                >
                  Try Login Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}