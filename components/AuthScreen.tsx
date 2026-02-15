import React, { useState } from 'react';
import Button from './Button';
import { login, register, resetPassword } from '../services/auth';

type AuthMode = 'login' | 'signup' | 'forgot';

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState(''); // Only for signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        await register(email, password, adminCode);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccess("Password reset email sent! Check your inbox.");
        // Optional: switch back to login after a delay, or just let them read the message
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("That email is already registered.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else if (err.code === 'auth/user-not-found') {
        // For security reasons, sometimes this isn't returned, but good to handle if it is
        setError("No account found with this email.");
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#8C1515]">
          SLS Levin Center
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Faculty Small Group Discussions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Tabs for Login/Signup - Only show if not in forgot password mode */}
          {mode !== 'forgot' && (
            <div className="flex justify-center mb-6 border-b border-gray-200 pb-4">
              <button
                className={`px-4 py-2 text-sm font-medium ${mode === 'login' ? 'text-[#8C1515] border-b-2 border-[#8C1515]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => switchMode('login')}
              >
                Log In
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${mode === 'signup' ? 'text-[#8C1515] border-b-2 border-[#8C1515]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => switchMode('signup')}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Forgot Password Header */}
          {mode === 'forgot' && (
             <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
                <p className="text-sm text-gray-500">Enter your email address and we'll send you a link to reset your password.</p>
             </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#8C1515] focus:border-[#8C1515] sm:text-sm"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === 'login' ? "current-password" : "new-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#8C1515] focus:border-[#8C1515] sm:text-sm"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="font-medium text-[#8C1515] hover:text-[#600000]"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700">
                  Admin Code <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    id="adminCode"
                    name="adminCode"
                    type="password"
                    placeholder="For faculty/staff access"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#8C1515] focus:border-[#8C1515] sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">If you have an admin code, enter it here to gain dashboard access immediately.</p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      {success}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button type="submit" className="w-full" isLoading={loading}>
                {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send Reset Link'}
              </Button>
            </div>

            {mode === 'forgot' && (
               <div className="text-center">
                 <button 
                   type="button"
                   onClick={() => switchMode('login')}
                   className="text-sm font-medium text-gray-600 hover:text-gray-900"
                 >
                   Back to Sign In
                 </button>
               </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;