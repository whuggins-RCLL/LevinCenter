import React, { useState } from 'react';
import Button from './Button';
import { addSession } from '../services/backend';

interface AddSessionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddSessionModal: React.FC<AddSessionModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    instructor: '',
    startAt: '',
    location: '',
    capacity: 10
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.startAt) throw new Error("Date is required");
      
      await addSession({
        ...formData,
        startAt: new Date(formData.startAt),
        capacity: Number(formData.capacity)
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Add New Session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
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
              Create Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSessionModal;