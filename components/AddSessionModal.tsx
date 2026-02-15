import React, { useState, useEffect } from 'react';
import Button from './Button';
import { addSession, updateSession } from '../services/backend';
import { Session } from '../types';

interface SessionFormModalProps {
  initialData?: Session | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SessionFormModal: React.FC<SessionFormModalProps> = ({ initialData, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; isPermission?: boolean } | null>(null);
  
  const [formData, setFormData] = useState({
    topic: '',
    instructor: '',
    startAt: '',
    location: '',
    capacity: 10
  });

  useEffect(() => {
    if (initialData) {
      // Format timestamp to YYYY-MM-DDThh:mm for input[type="datetime-local"]
      const date = initialData.startAt.toDate 
        ? initialData.startAt.toDate() 
        : new Date(initialData.startAt.seconds * 1000);
        
      // Adjust to local ISO string without timezone issues for the input
      const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

      setFormData({
        topic: initialData.topic,
        instructor: initialData.instructor,
        location: initialData.location,
        capacity: initialData.capacity || 10,
        startAt: localIso
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorState(null);

    try {
      if (!formData.startAt) throw new Error("Date is required");
      
      const capacity = Number(formData.capacity);
      if (isNaN(capacity) || capacity < 1) {
        throw new Error("Capacity must be a valid number greater than 0");
      }

      const sessionPayload = {
        topic: formData.topic,
        instructor: formData.instructor,
        startAt: new Date(formData.startAt),
        location: formData.location,
        capacity: capacity
      };
      
      if (initialData) {
        await updateSession(initialData.id, sessionPayload);
      } else {
        await addSession(sessionPayload);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      const isPermError = err.message.toLowerCase().includes('permission') || err.code === 'permission-denied';
      setErrorState({
        message: err.message || `Failed to ${initialData ? 'update' : 'create'} session.`,
        isPermission: isPermError
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Edit Session' : 'Add New Session'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {errorState && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm">
                <p className="text-red-800 font-medium mb-1">Error</p>
                <p className="text-red-700">{errorState.message}</p>
                {errorState.isPermission && (
                  <div className="mt-3 text-xs text-red-800 bg-red-100 p-2 rounded">
                    <strong>Admin Fix:</strong> Go to the Dashboard and click <strong>"DB Rules"</strong> to copy the correct Security Rules for Firebase.
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Topic</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515] sm:text-sm border p-2"
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Instructor</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515] sm:text-sm border p-2"
                value={formData.instructor}
                onChange={e => setFormData({...formData, instructor: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515] sm:text-sm border p-2"
                  value={formData.startAt}
                  onChange={e => setFormData({...formData, startAt: e.target.value})}
                />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700">Seats</label>
                 <input
                  type="number"
                  min="1"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515] sm:text-sm border p-2"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                 />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515] sm:text-sm border p-2"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading}>
                {initialData ? 'Update Session' : 'Create Session'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SessionFormModal;