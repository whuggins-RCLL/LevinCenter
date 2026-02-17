import React, { useState } from 'react';
import { saveFirebaseConfig } from '../lib/firebase';
import Button from './Button';

interface SetupScreenProps {
  onConfigSaved: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onConfigSaved }) => {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey || !config.projectId) {
      alert("API Key and Project ID are required minimums.");
      return;
    }
    
    // Save and re-initialize without reloading the page
    const success = saveFirebaseConfig(config);
    if (success) {
      onConfigSaved();
    } else {
      alert("Configuration saved but initialization failed. Please check console.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#8C1515]">
          Setup Required
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please enter your Firebase Configuration keys to connect the app.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input name="apiKey" value={config.apiKey} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="AIza..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Auth Domain</label>
              <input name="authDomain" value={config.authDomain} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="project-id.firebaseapp.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Project ID</label>
              <input name="projectId" value={config.projectId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="project-id" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Storage Bucket</label>
              <input name="storageBucket" value={config.storageBucket} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="project-id.firebasestorage.app" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Messaging Sender ID</label>
              <input name="messagingSenderId" value={config.messagingSenderId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">App ID</label>
              <input name="appId" value={config.appId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full">Save & Connect</Button>
            </div>
          </form>
          <div className="mt-4 text-xs text-gray-500">
            These keys will be saved to your browser's Local Storage.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;