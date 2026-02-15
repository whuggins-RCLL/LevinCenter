import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Session } from '../types';
import SessionCard from './SessionCard';
import Button from './Button';
import SessionFormModal from './AddSessionModal';
import RosterModal from './RosterModal';
import { generateRosterAnalysis, deleteSession, seedDatabase, getSignupsForSession } from '../services/backend';
import { formatDate } from '../utils/formatters';

interface AdminViewProps {
  sessions: Session[];
}

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if user has 'admin' role in their user profile
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users: Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Sessions: Everyone can read, Only Admins can write
    match /sessions/{sessionId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
      
      // Signups Subcollection (Standard Access)
      match /signups/{signupId} {
        allow read: if true;
        allow write: if request.auth != null; 
      }
    }

    // EMAIL EXTENSION COLLECTION (REQUIRED for Email Trigger)
    match /mail/{mailId} {
      allow create: if request.auth != null;
    }
  }
}`;

const AdminView: React.FC<AdminViewProps> = ({ sessions }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [rosterSession, setRosterSession] = useState<Session | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Delete Confirmation State
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleGenerateAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await generateRosterAnalysis();
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      alert("Failed to generate analysis. Ensure Cloud Functions are deployed and keys are set.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm("This will add sample sessions to the database. Continue?")) return;
    setSeeding(true);
    try {
      await seedDatabase();
    } catch (error) {
      console.error(error);
      alert("Failed to seed database. Check if Firebase is configured correctly in .env");
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteClick = (session: Session) => {
    setSessionToDelete(session);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete session. Ensure you have admin permissions.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setIsFormModalOpen(true);
  };

  const handleAddSession = () => {
    setEditingSession(null);
    setIsFormModalOpen(true);
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(140, 21, 21); // Stanford Red
      doc.text("Levin Center - Session Rosters", 14, yPos);
      yPos += 15;

      for (const session of sessions) {
        // Check for page break space
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Session Header
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`${session.topic} (${session.instructor})`, 14, yPos);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`${formatDate(session.startAt)} | ${session.location}`, 14, yPos + 6);
        
        yPos += 12;

        const signups = await getSignupsForSession(session.id);

        if (signups.length === 0) {
          doc.setFontSize(10);
          doc.text("No signups yet.", 14, yPos);
          yPos += 15;
        } else {
          autoTable(doc, {
            startY: yPos,
            head: [['Name', 'Email', 'Class', 'Status']],
            body: signups.map(s => [s.fullName, s.email, s.classYear, s.status.toUpperCase()]),
            theme: 'grid',
            headStyles: { fillColor: [140, 21, 21] },
            margin: { left: 14, right: 14 }
          });
          
          yPos = (doc as any).lastAutoTable.finalY + 20;
        }
      }

      doc.save(`levin-roster-report-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF report.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Manage sessions and view rosters.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="danger" 
            onClick={() => setShowRules(!showRules)}
            className="animate-pulse shadow-lg ring-2 ring-red-300 ring-offset-2"
          >
            {showRules ? 'Hide Rules' : '⚠️ DB Rules'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSeed} 
            isLoading={seeding}
            className="hidden md:flex"
            disabled={sessions.length > 5}
          >
            Seed DB
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleDownloadPdf}
            isLoading={generatingPdf}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF Report
          </Button>
          <Button variant="secondary" onClick={handleAddSession}>+ Add Session</Button>
          <Button 
             className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:from-blue-700 hover:to-indigo-700"
             onClick={handleGenerateAnalysis}
             isLoading={analyzing}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Analysis
          </Button>
        </div>
      </div>

      {showRules && (
        <div className="bg-slate-800 text-slate-200 p-6 rounded-lg shadow-lg mb-6 animate-fade-in border-2 border-red-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center">
                 <span className="text-2xl mr-2">⚠️</span>
                 Action Required: Update Firestore Rules
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                To fix "Missing permissions" errors for <strong>User Logins</strong> or <strong>Admin Actions</strong>, copy the code below and paste it into your <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline">Firebase Console</a> &gt; Firestore Database &gt; Rules tab.
              </p>
            </div>
            <button onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
          <div className="bg-black rounded p-4 overflow-x-auto relative group">
             <button 
                onClick={() => navigator.clipboard.writeText(FIRESTORE_RULES)}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-xs px-2 py-1 rounded text-white opacity-50 group-hover:opacity-100 transition-opacity"
             >
               Copy
             </button>
            <pre className="text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap">
              {FIRESTORE_RULES}
            </pre>
          </div>
        </div>
      )}

      {analysis && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-lg animate-fade-in">
          <div className="flex items-center mb-4">
             <div className="p-2 bg-indigo-100 rounded-lg mr-3">
               <svg className="w-5 h-5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
               </svg>
             </div>
             <h3 className="text-lg font-bold text-indigo-900">Gemini Analysis</h3>
          </div>
          <div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-line">
            {analysis}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions ({sessions.length})</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
            <p className="text-gray-500 mb-4">No sessions found. Create one to get started.</p>
            <Button variant="secondary" onClick={handleSeed} isLoading={seeding}>
               Seed Sample Data
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(session => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onSignup={() => {}} 
                isAdmin={true}
                onDelete={handleDeleteClick}
                onEdit={handleEditSession}
                onViewRoster={(s) => setRosterSession(s)}
              />
            ))}
          </div>
        )}
      </div>

      {isFormModalOpen && (
        <SessionFormModal 
          initialData={editingSession}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => setIsFormModalOpen(false)}
        />
      )}

      {rosterSession && (
        <RosterModal
          session={rosterSession}
          onClose={() => setRosterSession(null)}
        />
      )}

      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Session?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{sessionToDelete.topic}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setSessionToDelete(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;