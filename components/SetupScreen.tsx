import React, { useState } from 'react';
import Button from './Button';

const SetupScreen: React.FC = () => {
  const [mode, setMode] = useState<'paste' | 'manual'>('paste');
  const [configJson, setConfigJson] = useState('');
  const [manualConfig, setManualConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handlePasteSave = () => {
    try {
      const input = configJson.trim();
      
      const getValue = (key: string) => {
        const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
        const match = input.match(regex);
        return match ? match[1] : null;
      };

      const extractedConfig = {
        apiKey: getValue('apiKey'),
        authDomain: getValue('authDomain'),
        projectId: getValue('projectId'),
        storageBucket: getValue('storageBucket'),
        messagingSenderId: getValue('messagingSenderId'),
        appId: getValue('appId'),
      };

      if (!extractedConfig.apiKey || !extractedConfig.projectId) {
         // Try JSON parse as backup
         try {
           const json = JSON.parse(input);
           if (json.apiKey && json.projectId) {
             saveAndReload(json);
             return;
           }
         } catch(e) {}
         
         throw new Error("Could not automatically find 'apiKey' or 'projectId'. Please try Manual Entry.");
      }

      saveAndReload(extractedConfig);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleManualSave = () => {
    if (!manualConfig.apiKey || !manualConfig.projectId) {
      setError("API Key and Project ID are required.");
      return;
    }
    saveAndReload(manualConfig);
  };

  const saveAndReload = (config: any) => {
    localStorage.setItem('sls_firebase_config', JSON.stringify(config));
    // Use window.location.href to force a full reload
    window.location.href = window.location.href;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-[#8C1515] px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Setup Firestore Connection</h2>
          <div className="text-xs text-red-100 space-x-2">
            <button 
              onClick={() => { setMode('paste'); setError(null); }}
              className={`px-2 py-1 rounded ${mode === 'paste' ? 'bg-[#660000]' : 'hover:bg-[#7a1212]'}`}
            >
              Paste Code
            </button>
            <button 
              onClick={() => { setMode('manual'); setError(null); }}
              className={`px-2 py-1 rounded ${mode === 'manual' ? 'bg-[#660000]' : 'hover:bg-[#7a1212]'}`}
            >
              Manual Entry
            </button>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="prose prose-sm text-gray-600 bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="text-blue-900 font-bold mt-0">Required: Authorized Domain</h3>
            <p className="mb-2">
              For Google Login to work, you must add your current domain to Firebase:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-blue-800">
              <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-bold">Firebase Console</a>.</li>
              <li>Select your project &gt; <strong>Authentication</strong>.</li>
              <li>Click the <strong>Settings</strong> tab (top row, next to "Usage").</li>
              <li>Click <strong>Authorized Domains</strong> &gt; <strong>Add Domain</strong>.</li>
              <li>Add: <code className="bg-blue-100 px-1 rounded">{window.location.hostname}</code></li>
            </ol>
          </div>

          <div className="prose prose-sm text-gray-600">
            <p>
              <strong>Configuration:</strong> Go to Project Settings &gt; General &gt; Your apps to find your <code>firebaseConfig</code>.
            </p>
          </div>

          {mode === 'paste' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste <code>firebaseConfig</code> object or snippet
              </label>
              <textarea
                rows={8}
                className="w-full font-mono text-sm p-3 border border-gray-300 rounded-md focus:ring-[#8C1515] focus:border-[#8C1515]"
                placeholder={`const firebaseConfig = {
  apiKey: "...",
  projectId: "..."
};`}
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key *</label>
                <input
                  type="text"
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  value={manualConfig.apiKey}
                  onChange={e => setManualConfig({...manualConfig, apiKey: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Project ID *</label>
                <input
                  type="text"
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  value={manualConfig.projectId}
                  onChange={e => setManualConfig({...manualConfig, projectId: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Auth Domain</label>
                <input
                  type="text"
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  value={manualConfig.authDomain}
                  onChange={e => setManualConfig({...manualConfig, authDomain: e.target.value})}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button onClick={mode === 'paste' ? handlePasteSave : handleManualSave} className="w-full sm:w-auto">
              Save & Connect
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;