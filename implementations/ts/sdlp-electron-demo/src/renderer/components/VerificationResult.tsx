import React, { useState, useEffect } from 'react';
import { VerificationResult as VerificationResultType } from '@sdlp/sdk';
import '../types';

interface VerificationResultProps {
  result: VerificationResultType | null;
  error: Error | null;
  isLoading: boolean;
}

function VerificationResult({ result, error, isLoading }: VerificationResultProps) {
  const [isTrusted, setIsTrusted] = useState(false);
  const [commandOutput, setCommandOutput] = useState<{
    output: string;
    exitCode: number;
  } | null>(null);

  useEffect(() => {
    if (result && result.valid) {
      window.electronAPI.trustStore.isTrusted(result.sender).then(setIsTrusted);
    }
  }, [result]);

  useEffect(() => {
    const handleCommandOutput = (data: any) => {
      setCommandOutput(data);
    };
    window.electronAPI.onSDLPCommandOutput(handleCommandOutput);

    return () => {
      window.electronAPI.removeAllListeners('sdlp-command-output');
    };
  }, []);

  const handleExecute = () => {
    if (result && result.valid) {
      const payload = new TextDecoder().decode(result.payload);
      window.electronAPI.executeSDLPCommand(payload);
    }
  };

  if (isLoading) {
    return (
      <div id="status-card" className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v.01M12 20v.01M4 12h.01M20 12h.01M6.31 6.31l.01.01M17.69 17.69l.01.01M6.31 17.69l.01-.01M17.69 6.31l.01-.01"></path>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800">Verifying...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div id="error-state" className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <span className="text-lg font-medium text-red-800">Link Verification Failed</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    if (result.valid) {
      const payload = result.payload ? new TextDecoder().decode(result.payload) : '';
      if (isTrusted) {
        return (
          <div id="success-state" className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className="text-lg font-medium text-green-800">Link Verified</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-medium text-green-800">Verified From</span>
                  <div className="text-sm text-gray-600 mt-1">{result.sender}</div>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">Processed Payload</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Command:</div>
                  <div className="bg-white rounded border p-3">
                    <code className="text-sm font-mono text-gray-700 break-all whitespace-pre-wrap block">{payload}</code>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleExecute}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    Execute Command
                  </button>
                </div>
              </div>
              {commandOutput && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Command Output</h4>
                  <div className="bg-white rounded border p-3">
                    <code className="text-sm font-mono text-gray-700 break-all whitespace-pre-wrap block">
                      {commandOutput.output}
                    </code>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Exit Code: {commandOutput.exitCode}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      } else {
        return (
          <div id="untrusted-state" className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className="text-lg font-medium text-green-800">Link Verified</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-medium text-yellow-800">Verified From</span>
                  <div className="text-sm text-gray-600 mt-1">{result.sender}</div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-yellow-600 mt-0.5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">Untrusted Source</p>
                    <p className="text-sm text-yellow-700">This link is cryptographically valid but comes from an unknown or untrusted source. Proceed with caution.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">Processed Payload</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Command:</div>
                  <div className="bg-white rounded border p-3">
                    <code className="text-sm font-mono text-gray-700 break-all whitespace-pre-wrap block">{payload}</code>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleExecute}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    Execute Command
                  </button>
                </div>
              </div>
              {commandOutput && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Command Output</h4>
                  <div className="bg-white rounded border p-3">
                    <code className="text-sm font-mono text-gray-700 break-all whitespace-pre-wrap block">
                      {commandOutput.output}
                    </code>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Exit Code: {commandOutput.exitCode}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
    } else {
      return (
        <div id="error-state" className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <span className="text-lg font-medium text-red-800">Link Verification Failed</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {result.error.message}
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div id="status-card" className="bg-white rounded-lg shadow-md p-6">
      <div id="loading-state" className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Ready to Verify Links</h3>
        <p className="text-gray-600 mb-4">Click on an example link or open an SDLP link from your system</p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-orange-600 mt-0.5 flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      ></path>
                    </svg>
                  </div>
            <div className="text-left">
              <p className="text-sm font-medium text-orange-800 mb-1">Demo Warning</p>
              <p className="text-sm text-orange-700">This demo <strong>executes shell commands</strong> from verified SDLP payloads to demonstrate the power and security implications of deep links. This shows why cryptographic verification is essential.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationResult;
