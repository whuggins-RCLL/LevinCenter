import React, { useState } from 'react';
import Button from './Button';
import { adminLogin } from '../services/backend';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await adminLogin(code);
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Invalid passcode or connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm border border-gray-200">
        <div className="text-center mb-6">
          <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
             <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
          <p className="text-sm text-gray-500 mt-2">Enter the secure passcode to continue.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Passcode"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#8C1515] focus:border-[#8C1515]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded border border-yellow-200">
            <strong>Demo Tip:</strong> Use passcode <code>admin</code> to bypass server verification for testing.
          </div>
          <Button type="submit" className="w-full" isLoading={loading}>
            Unlock Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;