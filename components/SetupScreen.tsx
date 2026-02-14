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
    setError(null);
    try {
      const input = configJson.trim();
      let extractedConfig: any = {};
      
      // 1. Try direct JSON parse first
      try {
        const json = JSON.parse(input);
        const target = json.firebaseConfig || json;
        if (target.apiKey && target.projectId) {
          extractedConfig = target;
        }
      } catch (e) {
        // Not JSON, continue to regex
      }

      // 2. Regex extraction if JSON failed or was incomplete
      if (!extractedConfig.apiKey) {
        const getValue = (key: string) => {
          const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
          const match = input.match(regex);
          return match ? match[1] : null;
        };

        extractedConfig = {
          apiKey: getValue('apiKey'),
          authDomain: getValue('authDomain'),
          projectId: getValue('projectId'),
          storageBucket: getValue('storageBucket'),
          messagingSenderId: getValue('messagingSenderId'),
          appId: getValue('appId'),
        };
      }

      if (!extractedConfig.apiKey || !extractedConfig.projectId) {
         throw new Error("Could not find 'apiKey' or 'projectId' in the pasted text. Please try Manual Entry.");
      }

      saveAndReload(extractedConfig);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse configuration.");
    }
  };

  const handleManualSave = () => {
    setError(null);
    if (!manualConfig.apiKey || !manualConfig.projectId) {
      setError("API Key and Project ID are required.");
      return;
    }
    saveAndReload(manualConfig);
  };

  const saveAndReload = (config: any) => {
    try {
      // Clean up config
      const cleanConfig = Object.fromEntries(
        Object.entries(config).filter(([_, v]) => v != null && v !== '')
      );
      
      // Validation before save
      if (!cleanConfig.apiKey || !cleanConfig.projectId) {
        throw new Error("Invalid configuration detected during save.");
      }

      localStorage.setItem('sls_firebase_config', JSON.stringify(cleanConfig));
      
      // Force reload
      window.location.reload();
    } catch (e: any) {
      console.error("Save failed", e);
      setError("Could not save to LocalStorage. If you are in Incognito/Private mode, this may be blocked.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-[#8C1515] px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Setup Firestore Connection</h2>
          <div className="text-xs text-red-100 space-x-2">
            <button 
              type="button"
              onClick={() => { setMode('paste'); setError(null); }}
              className={`px-2 py-1 rounded ${mode === 'paste' ? 'bg-[#660000]' : 'hover:bg-[#7a1212]'}`}
            >
              Paste Code
            </button>
            <button 
              type="button"
              onClick={() => { setMode('manual'); setError(null); }}
              className={`px-2 py-1 rounded ${mode === 'manual' ? 'bg-[#660000]' : 'hover:bg-[#7a1212]'}`}
            >
              Manual Entry
            </button>
          </div>
        </div>
        
        <div className="p-8 space-y-