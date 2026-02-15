import React, { useEffect, useState } from 'react';
import { Signup, Session } from '../types';
import { getMySignups } from '../services/backend';
import { formatDate, formatTime } from '../utils/formatters';

const MySignups: React.FC = () => {
  const [items, setItems] = useState<(Signup & { session?: Session })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMySignups();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Signup History</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading History</h3>
          <p className="text-red-700">{error}</p>
          
          {error.includes("Firestore permissions") && (
            <div className="mt-4 p-4 bg-white rounded border border-red-100 text-sm text-gray-700">
              <strong className="block text-red-800 mb-1">Developer Action Required:</strong>
              You need to update your Firestore Database Rules in the Firebase Console to allow "Collection Group Queries".
              <ol className="list-decimal ml-5 mt-2 space-y-1">
                <li>Go to the <strong>Admin Dashboard</strong> in this app.</li>
                <li>Click the red <strong>DB Rules</strong> button.</li>
                <li>Copy the provided rules.</li>
                <li>Paste them into your Firebase Console &gt; Firestore &gt; Rules.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Signup History</h1>
      
      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">You haven't signed up for any sessions yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-[#8C1515] truncate">
                        {item.session?.topic || "Unknown Session"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.session?.instructor}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {item.session ? formatDate(item.session.startAt) : 'Date Unknown'} at {item.session ? formatTime(item.session.startAt) : ''}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {item.session?.location || 'Unknown Location'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Registered on {item.createdAt?.toDate ? formatDate(item.createdAt) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MySignups;