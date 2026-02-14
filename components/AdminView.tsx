import React, { useState } from 'react';
import { Session } from '../types';
import SessionCard from './SessionCard';
import Button from './Button';
import AddSessionModal from './AddSessionModal';
import RosterModal from './RosterModal';
import { generateRosterAnalysis, deleteSession } from '../services/backend';

interface AdminViewProps {
  sessions: Session[];
}

const AdminView: React.FC<AdminViewProps> = ({ sessions }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSessionForRoster, setSelectedSessionForRoster] = useState<Session | null>(null);

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

  const handleDeleteSession = async (session: Session) => {
    if (!confirm(`Are you sure you want to delete "${session.topic}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteSession(session.id);
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete session");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage sessions and view rosters.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}>+ Add Session</Button>
          <Button 
             className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:from-blue-700 hover:to-indigo-700"
             onClick={handleGenerateAnalysis}
             isLoading={analyzing}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Roster Analysis
          </Button>
        </div>
      </div>

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
            <p className="text-gray-500">No sessions found. Create one to get started.</p>
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
                onViewRoster={setSelectedSessionForRoster}
              />
            ))}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddSessionModal 
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => setIsAddModalOpen(false)}
        />
      )}

      {selectedSessionForRoster && (
        <RosterModal
          session={selectedSessionForRoster}
          onClose={() => setSelectedSessionForRoster(null)}
        />
      )}
    </div>
  );
};

export default AdminView;