import React, { useEffect, useState } from 'react';
import { Session, Signup } from '../types';
import Button from './Button';
import { subscribeToSessionRoster } from '../services/backend';

interface RosterModalProps {
  session: Session;
  onClose: () => void;
}

const RosterModal: React.FC<RosterModalProps> = ({ session, onClose }) => {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSessionRoster(session.id, (data) => {
      setSignups(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [session.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <div>
             <h3 className="text-lg font-bold text-gray-900">Roster: {session.topic}</h3>
             <p className="text-sm text-gray-500">{session.instructor}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C1515]"></div>
            </div>
          ) : signups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No signups yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {signups.map((signup) => (
                    <tr key={signup.id} className={signup.status === 'waitlist' ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{signup.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{signup.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{signup.classYear}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${signup.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {signup.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {signup.createdAt?.toDate ? signup.createdAt.toDate().toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
           <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default RosterModal;