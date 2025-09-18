import React, { useState, useEffect } from 'react';
import { KeyIcon } from './icons/KeyIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ApiKey } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

interface ApiKeyManagerProps {
  sessionToken: string;
}

const ApiKeyHistory: React.FC<{ keys: ApiKey[], copiedKeys: Set<string>, copyKey: (key: string) => void }> = ({ keys, copiedKeys, copyKey }) => {
  if (keys.length === 0) {
    return null;
  }
  const maskKey = (key: string) => `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  return (
    <div className="mt-10">
      <h3 className="text-xl font-semibold text-white mb-4">Key History</h3>
      <div className="bg-gray-900/50 rounded-lg shadow-inner overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Key</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Generated On</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Calls</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {keys.map((apiKey) => (
                <tr key={apiKey.key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{maskKey(apiKey.key)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(apiKey.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{apiKey.callCount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <button onClick={() => copyKey(apiKey.key)} className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors" aria-label="Copy API Key">
                      {copiedKeys.has(apiKey.key) ? <CheckIcon className="h-5 w-5 text-green-400" /> : <CopyIcon className="h-5 w-5 text-gray-400" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ sessionToken }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [mostRecentKey, setMostRecentKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/keys`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch API keys.');
        const keys: ApiKey[] = await res.json();
        setApiKeys(keys);
        if (keys.length > 0) {
          setMostRecentKey(keys[0].key);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApiKeys();
  }, [sessionToken]);

  const generateApiKey = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/keys`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
       if (!res.ok) throw new Error('Failed to generate API key.');
       const newKey: ApiKey = await res.json();
       setApiKeys(prevKeys => [newKey, ...prevKeys]);
       setMostRecentKey(newKey.key);
       setCopied(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = () => {
    if (mostRecentKey) {
      navigator.clipboard.writeText(mostRecentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeys(prev => new Set(prev).add(key));
    setTimeout(() => setCopiedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    }), 2000);
  };
  
  if (isLoading) {
    return <div className="text-center p-6 bg-gray-800 rounded-lg">Loading API Keys...</div>;
  }
  
  if (error) {
     return <div className="bg-red-500/20 text-red-300 p-4 rounded-md text-sm text-center">{error}</div>
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-4 mb-4">
        <KeyIcon className="h-6 w-6 text-indigo-400" />
        <h2 className="text-2xl font-semibold text-white">API Keys</h2>
      </div>
      <p className="text-gray-400 mb-6">
        Use these keys to authenticate your requests to the X-SAUCE API.
      </p>
      <div className="flex items-center space-x-4 bg-gray-900 p-4 rounded-md font-mono text-sm text-gray-300">
        <span className="flex-grow truncate">{mostRecentKey ?? 'Click the button to generate your first key'}</span>
        {mostRecentKey && (
          <button onClick={copyToClipboard} className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors" aria-label="Copy API Key">
            {copied ? <CheckIcon className="h-5 w-5 text-green-400" /> : <CopyIcon className="h-5 w-5 text-gray-400" />}
          </button>
        )}
      </div>
      <div className="mt-6">
        <button onClick={generateApiKey} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-105">
          {apiKeys.length > 0 ? 'Generate New Key' : 'Generate API Key'}
        </button>
      </div>
      <ApiKeyHistory keys={apiKeys} copiedKeys={copiedKeys} copyKey={copyKey} />
    </div>
  );
};

export default ApiKeyManager;
