import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Session, SignupPayload } from '../types';
import Button from './Button';
import { formatDate, formatTime, generateGoogleCalendarUrl } from '../utils/formatters';
import { signupForSession, getSignup } from '../services/backend';

interface SignupModalProps {
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ session, onClose, onSuccess }) => {
  const [view, setView] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState<Omit<SignupPayload, 'sessionId'>>({
    fullName: '',
    email: '',
    classYear: '1L'
  });
  const [signupResult, setSignupResult] = useState<{ status: 'confirmed' | 'waitlist' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if this is a waitlist signup
  const capacity = session.capacity ?? -1;
  const isUnlimited = capacity === -1;
  const spotsTaken = session.confirmedCount;
  const isWaitlist = !isUnlimited && spotsTaken >= capacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signupForSession({
        sessionId: session.id,
        ...formData
      });
      
      setSignupResult(result);
      setView('success');
    } catch (err: any) {
      if (err.message && (err.message.includes("already signed up") || err.message.includes("already registered"))) {
        try {
          const existing = await getSignup(session.id, formData.email);
          setSignupResult({ status: existing ? existing.status : (isWaitlist ? 'waitlist' : 'confirmed') });
          setView('success');
          return;
        } catch (fetchErr) {
          console.warn("Could not fetch existing signup", fetchErr);
        }
      }
      
      setError(err.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const status = signupResult?.status === 'waitlist' ? 'Waitlist Confirmed' : 'Registration Confirmed';
    const color = signupResult?.status === 'waitlist' ? [200, 150, 0] : [140, 21, 21];
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text("SLS Levin Center", 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(status, 20, 30);
    
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Details
    doc.setFontSize(12);
    let y = 50;
    
    const addLine = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 60, y);
      y += 10;
    };

    addLine("Topic:", session.topic);
    addLine("Instructor:", session.instructor);
    addLine("Date:", formatDate(session.startAt));
    addLine("Time:", formatTime(session.startAt));
    addLine("Location:", session.location);
    
    y += 5;
    addLine("Name:", formData.fullName);
    addLine("Email:", formData.email);
    addLine("Status:", signupResult?.status.toUpperCase() || 'UNKNOWN');

    if (signupResult?.status === 'waitlist') {
      y += 10;
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("You will be notified via email if a spot opens up.", 20, y);
    }

    doc.save(`SLS_Confirmation_${session.id.substring(0,4)}.pdf`);
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(session);
    window.open(url, '_blank');
  };

  if (view === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-6 text-center">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${signupResult?.status === 'waitlist' ? 'bg-yellow-100' : 'bg-green-100'} mb-4`}>
              <svg className={`h-6 w-6 ${signupResult?.status === 'waitlist' ? 'text-yellow-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {signupResult?.status === 'waitlist' ? 'Added to Waitlist' : 'Registration Confirmed'}
            </h3>
            
            <div className="mt-2 px-2">
              <p className="text-sm text-gray-500">
                You are set for <strong>{session.topic}</strong>. 
                {signupResult?.status === 'waitlist' && " We will notify you if a spot becomes available."}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Button 
                variant="secondary" 
                className="w-full justify-center"
                onClick={handleDownloadPdf}
              >
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Receipt
              </Button>

              <Button 
                variant="secondary" 
                className="w-full justify-center"
                onClick={handleGoogleCalendar}
              >
                 <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add to Google Calendar
              </Button>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <Button onClick={() => { onSuccess(); onClose(); }} className="w-full justify-center">
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ... (Form view remains unchanged, just returning standard form)
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {isWaitlist ? 'Join Waitlist' : 'Sign Up'}
          </h3>
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

            {isWaitlist && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                <strong>Note:</strong> This session is currently full. Completing this form will add you to the waitlist (Position: {session.waitlistCount + 1}).
              </div>
            )}
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
                placeholder="jane@stanford.edu"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515] sm:text-sm border p-2"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
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
              <Button 
                type="submit" 
                isLoading={loading}
                variant={isWaitlist ? 'secondary' : 'primary'}
                className={isWaitlist ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-50' : ''}
              >
                {isWaitlist ? 'Join Waitlist' : 'Sign Up'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;