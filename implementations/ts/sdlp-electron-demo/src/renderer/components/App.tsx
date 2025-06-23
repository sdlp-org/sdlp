import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Home from './Home';
import Examples from './Examples';
import Tools from './Tools';
import TrustStoreTab from './TrustStoreTab';
import { VerificationResult, SdlpError, CoreMetadata } from '@sdlp/sdk';

class GenericSdlpError extends SdlpError {
  readonly code = 'GENERIC_ERROR';
  constructor(message: string) {
    super(message);
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleCommandToExecute = (data: any) => {
      const commandData = data as {
        status: string;
        from: string;
        command: string;
        message?: string;
      };
      let result: VerificationResult;
      if (commandData.status === 'success' || commandData.status === 'untrusted') {
        const metadata: CoreMetadata = {
          v: '1',
          sid: commandData.from,
          type: 'text/plain',
          comp: 'none',
          chk: '', // Checksum is not available in this context
        };
        result = {
          valid: true,
          sender: commandData.from,
          payload: new TextEncoder().encode(commandData.command),
          metadata: metadata,
        };
      } else {
        result = {
          valid: false,
          error: new GenericSdlpError(commandData.message || 'An unknown error occurred.'),
        };
      }

      setVerificationResult(result);
      setActiveTab('home');
    };

    window.electronAPI.onSDLPCommandToExecute(handleCommandToExecute);

    return () => {
      window.electronAPI.removeAllListeners('sdlp-command-to-execute');
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home
            setActiveTab={setActiveTab}
            verificationResult={verificationResult}
            error={error}
            isLoading={isLoading}
          />
        );
      case 'examples':
        return <Examples setActiveTab={setActiveTab} />;
      case 'tools':
        return (
          <Tools
            setVerificationResult={setVerificationResult}
            setError={setError}
            setIsLoading={setIsLoading}
          />
        );
      case 'trust-store':
        return <TrustStoreTab />;
      default:
        return (
          <Home
            setActiveTab={setActiveTab}
            verificationResult={verificationResult}
            error={error}
            isLoading={isLoading}
          />
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <main className="max-w-6xl mx-auto">
        <div className="mb-6">
          <nav
            className="flex space-x-1 bg-white rounded-lg shadow-sm p-1"
            role="tablist"
          >
            <button
              onClick={() => setActiveTab('home')}
              className={`tab-button flex items-center justify-center flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                activeTab === 'home'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              role="tab"
              aria-selected={activeTab === 'home'}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                ></path>
              </svg>
              Home
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`tab-button flex items-center justify-center flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                activeTab === 'examples'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              role="tab"
              aria-selected={activeTab === 'examples'}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Examples
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`tab-button flex items-center justify-center flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                activeTab === 'tools'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              role="tab"
              aria-selected={activeTab === 'tools'}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              Tools
            </button>
            <button
              onClick={() => setActiveTab('trust-store')}
              className={`tab-button flex items-center justify-center flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                activeTab === 'trust-store'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              role="tab"
              aria-selected={activeTab === 'trust-store'}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Trust Store
            </button>
          </nav>
        </div>
        {renderTabContent()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
