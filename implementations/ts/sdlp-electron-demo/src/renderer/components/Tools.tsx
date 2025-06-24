import React, { useState } from 'react';
import { VerificationResult } from '@sdlp/sdk';

interface ToolsProps {
  setVerificationResult: (result: VerificationResult | null) => void;
  setError: (error: Error | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

function Tools({ setVerificationResult, setError, setIsLoading }: ToolsProps) {
  const [payload, setPayload] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkToVerify, setLinkToVerify] = useState('');
  const [localVerificationResult, setLocalVerificationResult] =
    useState<any>(null);

  const handleGenerateLink = async () => {
    if (!payload) return;
    try {
      const link = await window.electronAPI.generateSDLPLink(payload);
      setGeneratedLink(link);
    } catch (error) {
      console.error('Failed to generate link:', error);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
  };

  const handleOpenLink = () => {
    if (!generatedLink) return;
    window.electronAPI.processSDLPLinkWithDialog(generatedLink);
  };

  const handleVerifyLink = async () => {
    if (!linkToVerify) return;
    setIsLoading(true);
    setVerificationResult(null);
    setError(null);
    try {
      const result = await window.electronAPI.verifySDLPLink(linkToVerify);
      setLocalVerificationResult(result);
    } catch (error) {
      setLocalVerificationResult({
        valid: false,
        error: { message: (error as Error).message },
      } as any);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="tools-content"
      className="tab-content"
      role="tabpanel"
      aria-labelledby="tools-tab"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Link Generator */}
        <div className="bg-white rounded-lg shadow-md p-6">
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              ></path>
            </svg>
            Link Generator
          </h3>
          <p className="text-gray-600 mb-4">
            Create a signed SDLP link from your payload
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="payload-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Payload (Command to execute)
              </label>
              <textarea
                id="payload-input"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder='echo "Hello from SDLP!"'
                value={payload}
                onChange={e => setPayload(e.target.value)}
              ></textarea>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>🔑 Signing Key:</strong> Links will be signed with the
                trusted demo key, making them appear as trusted sources.
              </p>
            </div>

            <button
              onClick={handleGenerateLink}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Generate SDLP Link
            </button>

            {generatedLink && (
              <div id="generated-link-section">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Link
                </label>
                <div className="flex mb-3">
                  <input
                    id="generated-link"
                    type="text"
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    value={generatedLink}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-gray-500 text-white rounded-r-md hover:bg-gray-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <button
                  onClick={handleOpenLink}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    ></path>
                  </svg>
                  Open Link (Test with Dialog)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Link Verifier */}
        <div className="bg-white rounded-lg shadow-md p-6">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            Link Verifier
          </h3>
          <p className="text-gray-600 mb-4">
            Verify the authenticity of an SDLP link
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="link-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                SDLP Link
              </label>
              <textarea
                id="link-input"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste an SDLP link here..."
                value={linkToVerify}
                onChange={e => setLinkToVerify(e.target.value)}
              ></textarea>
            </div>

            <button
              onClick={handleVerifyLink}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Verify Link
            </button>

            {localVerificationResult && (
              <div id="verification-result">
                <div className="border rounded-lg p-4">
                  {localVerificationResult.valid ? (
                    <>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                        </div>
                        <span className="font-medium text-green-800">
                          Valid Link
                        </span>
                      </div>
                      <div className="mt-3 text-sm">
                        <div>
                          <strong>Sender:</strong>{' '}
                          {localVerificationResult.sender || 'Unknown'}
                        </div>
                        <div>
                          <strong>Payload:</strong>{' '}
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {localVerificationResult.payload
                              ? new TextDecoder().decode(
                                  localVerificationResult.payload
                                )
                              : 'N/A'}
                          </code>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            ></path>
                          </svg>
                        </div>
                        <span className="font-medium text-red-800">
                          Invalid Link
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-red-600">
                        <strong>Error:</strong>{' '}
                        {localVerificationResult.error?.message ||
                          'Unknown error'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tools;
