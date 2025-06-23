import React, { useEffect, useState } from 'react';

interface TrustedDID {
  addedAt: string;
  label?: string;
}

function TrustStore() {
  const [trustedKeys, setTrustedKeys] = useState<Record<string, TrustedDID>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadTrustedKeys = async () => {
    setIsLoading(true);
    try {
      const keys = await window.electronAPI.trustStore.getAll();
      setTrustedKeys(keys);
    } catch (error) {
      console.error('Failed to load trusted keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = async (did: string) => {
    if (window.confirm(`Remove trust for this sender?\n\n${did}`)) {
      try {
        await window.electronAPI.trustStore.removeTrusted(did);
        loadTrustedKeys();
      } catch (error) {
        console.error('Failed to remove trusted key:', error);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all trusted keys?')) {
      try {
        await window.electronAPI.trustStore.clear();
        loadTrustedKeys();
      } catch (error) {
        console.error('Failed to clear trusted keys:', error);
      }
    }
  };

  useEffect(() => {
    loadTrustedKeys();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        🔐 Trusted Keys
      </h3>
      <p className="text-gray-600 mb-4">
        Manage your trusted SDLP senders. Keys added here will be automatically trusted for future links.
      </p>
      
      <div id="trusted-keys-section">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="text-gray-500">Loading trusted keys...</div>
          </div>
        ) : Object.keys(trustedKeys).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No trusted keys yet</div>
            <p className="text-sm text-gray-400">
              When you encounter valid SDLP links from new senders, you can choose to trust them for future interactions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(trustedKeys).map(([did, info]) => {
              const shortDid = did.length > 50 ? `${did.substring(0, 30)}...${did.substring(did.length - 20)}` : did;
              return (
                <div key={did} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                        <h4 className="font-medium text-gray-800 truncate">
                          {info.label || 'Trusted Sender'}
                        </h4>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>DID:</strong> <code className="bg-white px-1 rounded text-xs">{shortDid}</code>
                      </div>
                      <div className="text-xs text-gray-500">
                        Added: {new Date(info.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveKey(did)}
                      className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={loadTrustedKeys}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm mr-2"
          >
            Refresh
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrustStore;
