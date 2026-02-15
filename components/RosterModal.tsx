import React, { useEffect, useState } from 'react';
import { Session, Signup } from '../types';
import Button from './Button';
import { subscribeToSignups, deleteSignup, updateSignup } from '../services/backend';

interface RosterModalProps {
  session: Session;
  onClose: () => void;
}

const RosterModal: React.FC<RosterModalProps> = ({ session, onClose }) => {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Signup>>({});
  
  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSignups(session.id, (data) => {
      setSignups(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [session.id]);

  // --- Delete Handlers ---

  const initDelete = (signupId: string) => {
    setEditingId(null); // Cancel edit if active
    setDeleteConfirmId(signupId);
  };

  const confirmDelete = async (signupId: string) => {
    setActionLoading(true);
    try {
      await deleteSignup(session.id, signupId);
      // Success - no need to manually update state as subscription will handle removal
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete signup. Ensure you have admin permissions.");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // --- Edit Handlers ---

  const startEdit = (signup: Signup) => {
    setDeleteConfirmId(null); // Cancel delete if active
    setEditingId(signup.id);
    setEditForm({
      fullName: signup.fullName,
      email: signup.email,
      classYear: signup.classYear,
      status: signup.status
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setActionLoading(true);
    try {
      await updateSignup(session.id, editingId, editForm);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update signup.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{session.topic}</h3>
            <p className="text-sm text-gray-500">Instructor: {session.instructor}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto p-6 flex-grow">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C1515]"></div>
            </div>
          ) : signups.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No students have signed up yet.
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[200px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {signups.map((signup) => {
                    const isEditing = editingId === signup.id;
                    const isDeleting = deleteConfirmId === signup.id;

                    return (
                      <tr key={signup.id} className={signup.status === 'waitlist' ? 'bg-yellow-50' : ''}>
                        {/* Name Field */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {isEditing ? (
                            <input 
                              className="border rounded p-1 w-full text-sm focus:ring-[#8C1515] focus:border-[#8C1515]"
                              value={editForm.fullName}
                              onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                            />
                          ) : signup.fullName}
                        </td>
                        
                        {/* Email Field */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {isEditing ? (
                            <input 
                              className="border rounded p-1 w-full text-sm focus:ring-[#8C1515] focus:border-[#8C1515]"
                              value={editForm.email}
                              onChange={e => setEditForm({...editForm, email: e.target.value})}
                            />
                          ) : signup.email}
                        </td>

                        {/* Class Field */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {isEditing ? (
                             <select 
                               className="border rounded p-1 text-sm bg-white focus:ring-[#8C1515] focus:border-[#8C1515]"
                               value={editForm.classYear}
                               onChange={e => setEditForm({...editForm, classYear: e.target.value})}
                             >
                                <option value="1L">1L</option>
                                <option value="2L">2L</option>
                                <option value="3L">3L</option>
                                <option value="Advanced Degree">Advanced Degree</option>
                                <option value="Faculty/Staff">Faculty/Staff</option>
                             </select>
                           ) : signup.classYear}
                        </td>

                        {/* Status Field */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              className="border rounded p-1 text-sm bg-white focus:ring-[#8C1515] focus:border-[#8C1515]"
                              value={editForm.status}
                              onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="waitlist">Waitlist</option>
                            </select>
                          ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              signup.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {signup.status.toUpperCase()}
                            </span>
                          )}
                        </td>

                        {/* Date Field */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {signup.createdAt?.toDate ? signup.createdAt.toDate().toLocaleString() : 'Just now'}
                        </td>

                        {/* Actions Field */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[160px]">
                          {isEditing ? (
                            <div className="flex justify-end space-x-2">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit();
                                }}
                                disabled={actionLoading}
                                className="text-green-600 hover:text-green-900"
                              >
                                Save
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : isDeleting ? (
                             <div className="flex justify-end items-center space-x-2 animate-pulse">
                                <span className="text-xs text-red-800 font-semibold mr-1">Confirm?</span>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDelete(signup.id);
                                  }}
                                  disabled={actionLoading}
                                  className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  {actionLoading ? '...' : 'Yes'}
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelDelete();
                                  }}
                                  disabled={actionLoading}
                                  className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-xs font-medium border border-gray-300 transition-colors"
                                >
                                  No
                                </button>
                             </div>
                          ) : (
                            <div className="flex justify-end space-x-3">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(signup);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  initDelete(signup.id);
                                }}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default RosterModal;