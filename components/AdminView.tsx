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
      
      // Signups
      match /signups/{signupId} {
        allow read: if true;
        
        // Create: Check new data (request.resource)
        allow create: if request.auth != null && (
          request.auth.uid == request.resource.data.userId || isAdmin()
        );
        
        // Update: Check new data (request.resource) AND existing data (resource) if needed
        allow update: if request.auth != null && (
          request.auth.uid == resource.data.userId || isAdmin()
        );
        
        // Delete: Check existing data (resource) - request.resource is null here
        allow delete: if request.auth != null && (
          request.auth.uid == resource.data.userId || isAdmin()
        );
      }
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

  const handleDeleteSession = async (session: Session) => {
    if (!window.confirm(`Are you sure you want to delete "${session.topic}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteSession(session.id);
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete session. Ensure you have admin permissions.");
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
          <Button variant="ghost" onClick={() => setShowRules(!showRules)}>
            {showRules ? 'Hide Rules' : 'DB Rules'}
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
        <div className="bg-slate-800 text-slate-200 p-6 rounded-lg shadow-lg mb-6 animate-fade-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Firestore Security Rules</h3>
              <p className="text-sm text-slate-400">Copy this into Firebase Console &gt; Firestore Database &gt; Rules</p>
            </div>
            <button onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
          <div className="bg-black rounded p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-green-400 leading-relaxed">
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
                onDelete={handleDeleteSession}
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
    </div>
  );
};

export default AdminView;