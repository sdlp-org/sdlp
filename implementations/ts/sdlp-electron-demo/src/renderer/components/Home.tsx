import React from 'react';
import VerificationResult from './VerificationResult';
import { VerificationResult as VerificationResultType } from '@sdlp/sdk';

interface HomeProps {
  setActiveTab: (tab: string) => void;
  verificationResult: VerificationResultType | null;
  error: Error | null;
  isLoading: boolean;
}

function Home({ setActiveTab, verificationResult, error, isLoading }: HomeProps) {
  return (
    <div id="home-content" className="tab-content" role="tabpanel" aria-labelledby="home-tab">
      <VerificationResult
        result={verificationResult}
        error={error}
        isLoading={isLoading}
      />
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <svg
            className="w-6 h-6 mr-2"
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
          What is SDLP?
        </h2>
        <div className="prose text-gray-600">
          <p className="mb-4">
            The <strong>Secure Deep Link Protocol (SDLP)</strong> is a
            cryptographic protocol that ensures the integrity and
            authenticity of deep links. Unlike regular URLs, SDLP links are
            digitally signed, allowing you to verify:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>
              <strong>Who sent the link</strong> - Cryptographic proof of
              the sender's identity
            </li>
            <li>
              <strong>Content integrity</strong> - Guarantee that the
              payload hasn't been tampered with
            </li>
            <li>
              <strong>Trust level</strong> - Clear indication of whether the
              sender is trusted
            </li>
          </ul>
          <p>
            This prevents common attacks like link tampering, phishing, and
            man-in-the-middle modifications that plague traditional deep
            links.
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            ></path>
          </svg>
          Getting Started
        </h3>
        <p className="text-gray-600 mb-4">
          Explore the SDLP protocol through interactive examples and tools:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-blue-700 mb-2 flex items-center">
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
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              View detailed examples of SDLP links with formatted payloads,
              keys, and verification results.
            </p>
            <button
              onClick={() => setActiveTab('examples')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              View Examples
            </button>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-green-700 mb-2 flex items-center">
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
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Generate your own SDLP links and verify existing ones with our
              interactive tools.
            </p>
            <button
              onClick={() => setActiveTab('tools')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
            >
              Open Tools
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
