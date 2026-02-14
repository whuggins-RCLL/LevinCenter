import React, { useState, useEffect } from 'react';
import { Session, SignupPayload } from '../types';
import Button from './Button';
import { formatDate, formatTime } from '../utils/formatters';
import { signupForSession, loginWithGoogle } from '../services/backend';
import { getAuth } from 'firebase/auth';

interface SignupModalProps {
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ session, onClose, onSuccess }) => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [formData, setFormData] = useState<Omit<SignupPayload, 'sessionId'>>({
    fullName: user?.displayName || '',
    email: user?.email || '',
    classYear: '1L',
    uid: user?.uid
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // Auth state change will re-render this component via parent or useEffect
    } catch (error: any) {
      console.error("Login error", error);
      if (error.code === 'auth/unauthorized-domain') {
         const currentDomain = window.location.hostname;
         alert(
           `Configuration Error: Domain Unauthorized\n\n` +
           `The domain "${currentDomain}" is not whitelisted for this Firebase project.\n\n` +
           `Please add it in Firebase Console > Authentication > Settings > Authorized Domains, or configure your own API keys via the footer link.`
         );
      } else if (error.code !== 'auth/popup-closed-by-user') {
         alert(`Login failed: ${error.message}`);
      }
    }
  };

  // If not logged in, we show a prompt
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden text-center p-8">
           <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
           </div>
           <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
           <p className="text-sm text-gray-500 mb-6">
             You must be signed in to register for sessions.
           </p>
           <Button 
             onClick={handleLogin}
             className="w-full flex justify-center items-center gap-2"
           >
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
               <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
             </svg>
             Sign in with Google
           </Button>
           <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signupForSession({
        sessionId: session.id,
        ...formData,
        uid: user.uid // Ensure we use the authenticated UID
      });
      
      alert(`Successfully registered! Status: ${result.status.toUpperCase()}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Registration</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-bold text-gray-900">{session.topic}</h4>
            <p className="text-sm text-gray-600 mt-1">with {session.instructor}</p>
            <p className="text-sm text-gray-500 mt-2">
              {formatDate(session.startAt)} • {formatTime(session.startAt)} • {session.location}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515] sm:text-sm border p-2"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stanford Email</label>
              <input
                type="email"
                required
                disabled // Lock email to auth email for security
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500 sm:text-sm border p-2 cursor-not-allowed"
                value={formData.email}
              />
              <p className="text-xs text-gray-500 mt-1">Linked to your signed-in account.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Class Year</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515] sm:text-sm border p-2 bg-white"
                value={formData.classYear}
                onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
              >
                <option value="1L">1L</option>
                <option value="2L">2L</option>
                <option value="3L">3L</option>
                <option value="Advanced Degree">Advanced Degree</option>
                <option value="Faculty/Staff">Faculty/Staff</option>
              </select>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading}>
                Confirm
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;