import React, { useEffect, useState } from 'react';

interface ExamplesProps {
  setActiveTab: (tab: string) => void;
}

function Examples({ setActiveTab }: ExamplesProps) {
  const [validLink, setValidLink] = useState('');
  const [corruptedLink, setCorruptedLink] = useState('');
  const [malformedLink, setMalformedLink] = useState('sdlp://eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.INVALID_STRUCTURE.signature');
  const [keyMismatchLink, setKeyMismatchLink] = useState('');

  const populateExamples = async () => {
    try {
      const validPayload = 'echo "Hello from a valid SDLP link!"';
      const generatedValidLink = await window.electronAPI.generateSDLPLink(validPayload);
      setValidLink(generatedValidLink);

      const originalLink = await window.electronAPI.generateSDLPLink('echo "Original payload"');
      const generatedCorruptedLink = originalLink.replace(/(.{50})(.{10})/, '$1CORRUPTED');
      setCorruptedLink(generatedCorruptedLink);

      const generatedKeyMismatchLink = await window.electronAPI.generateUntrustedSDLPLink('echo "Key mismatch demo"');
      setKeyMismatchLink(generatedKeyMismatchLink);
    } catch (error) {
      console.error('Failed to populate examples:', error);
    }
  };

  useEffect(() => {
    populateExamples();
  }, []);

  const handleTestLink = async (link: string) => {
    try {
      await window.electronAPI.processSDLPLinkWithDialog(link);
    } catch (error) {
      console.error('Failed to process SDLP link:', error);
    }
  };

  return (
    <div id="examples-content" className="tab-content" role="tabpanel" aria-labelledby="examples-tab">
      <div className="space-y-6">
        {/* Valid Link Example */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-green-700 flex items-center">
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
                Valid SDLP Link
              </h3>
              <p className="text-gray-600">
                A properly signed link that will verify successfully
              </p>
            </div>
            <button
              onClick={() => handleTestLink(validLink)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Test This Link
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Payload</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre
                  className="text-sm text-gray-700 font-mono"
                >echo "Hello from a valid SDLP link!"</pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Signing Key (Public)
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre
                  className="text-sm text-gray-700 font-mono"
                >{`{
  "kty": "OKP",
  "crv": "Ed25519",
  "use": "sig",
  "kid": "test-key-1",
  "x": "...",
  "alg": "EdDSA"
}`}</pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">SDLP Link</h4>
              <div className="bg-gray-50 rounded-lg p-3 overflow-hidden">
                <pre
                  className="text-sm text-gray-700 font-mono break-all whitespace-pre-wrap"
                >{validLink || 'Loading...'}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Failure Mode Examples */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-red-700 flex items-center">
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
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                ></path>
              </svg>
              Failure Mode Examples
            </h3>
            <p className="text-gray-600">
              Different ways SDLP links can fail verification with detailed breakdowns
            </p>
          </div>

          <div className="space-y-6">
            {/* Payload Tampering */}
            <div className="border border-red-200 rounded-lg p-6 bg-red-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-red-800 flex items-center">
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    ></path>
                  </svg>
                  Payload Tampering
                </h4>
                <button
                  onClick={() => handleTestLink(corruptedLink)}
                  className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  Test This Link
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-red-800 mb-2">What Happens</h5>
                  <p className="text-sm text-red-700 mb-3">
                    Link content is modified after signing, breaking the cryptographic signature.
                  </p>
                  
                  <h5 className="font-medium text-red-800 mb-2">Original Payload</h5>
                  <div className="bg-white rounded p-2 mb-3">
                    <code className="text-xs text-gray-700">echo "Original payload"</code>
                  </div>
                  
                  <h5 className="font-medium text-red-800 mb-2">Why It Fails</h5>
                  <p className="text-xs text-red-700">
                    The signature was created for the original payload, but the link now contains corrupted data. 
                    SDLP detects this mismatch and rejects the link.
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-red-800 mb-2">Corrupted SDLP Link</h5>
                  <div className="bg-white rounded p-2">
                    <code className="text-xs text-red-600 break-all">
                      {corruptedLink || 'Loading...'}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Malformed Link */}
            <div className="border border-red-200 rounded-lg p-6 bg-red-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-red-800 flex items-center">
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
                  Malformed Link
                </h4>
                <button
                  onClick={() => handleTestLink(malformedLink)}
                  className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  Test This Link
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-red-800 mb-2">What Happens</h5>
                  <p className="text-sm text-red-700 mb-3">
                    SDLP link has invalid JWT structure - missing or corrupted components.
                  </p>
                  
                  <h5 className="font-medium text-red-800 mb-2">Expected Structure</h5>
                  <div className="bg-white rounded p-2 mb-3">
                    <code className="text-xs text-gray-700">sdlp://header.payload.signature</code>
                  </div>
                  
                  <h5 className="font-medium text-red-800 mb-2">Why It Fails</h5>
                  <p className="text-xs text-red-700">
                    SDLP links must follow JWT format. This link has invalid structure that cannot be parsed.
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-red-800 mb-2">Malformed SDLP Link</h5>
                  <div className="bg-white rounded p-2">
                    <code className="text-xs text-red-600 break-all">
                      {malformedLink}
                    </code>
                  </div>
                </div>
              </div>
            </div>


            {/* Different Signer */}
            <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-yellow-800 flex items-center">
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
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a1 1 0 011-1h2.157a6.02 6.02 0 01.932-2.415M19 10a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                  Different Signer
                </h4>
                <button
                  onClick={() => handleTestLink(keyMismatchLink)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
                >
                  Test This Link
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-yellow-800 mb-2">What Happens</h5>
                  <p className="text-sm text-yellow-700 mb-3">
                    Link is cryptographically valid but signed with a different key than the trusted one.
                  </p>
                  
                  <h5 className="font-medium text-yellow-800 mb-2">Demo Payload</h5>
                  <div className="bg-white rounded p-2 mb-3">
                    <code className="text-xs text-gray-700">echo "Key mismatch demo"</code>
                  </div>
                  
                  <h5 className="font-medium text-yellow-800 mb-2">Why It Shows as Untrusted</h5>
                  <p className="text-xs text-yellow-700">
                    The signature is valid, but it's from a different signer than expected. SDLP's trust system correctly identifies this as an untrusted source, demonstrating key-based identity verification.
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-yellow-800 mb-2">Different Signer SDLP Link</h5>
                  <div className="bg-white rounded p-2">
                    <code className="text-xs text-yellow-600 break-all">
                      {keyMismatchLink || 'Loading...'}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-red-600 mt-0.5">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">
                  Security Protection
                </p>
                <p className="text-sm text-red-700">
                  These examples demonstrate why cryptographic verification is essential. 
                  SDLP's signature verification prevents execution of tampered, expired, or fraudulent links, 
                  protecting users from malicious attacks that are common with traditional deep links.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Model Explanation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-blue-700 flex items-center">
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
              Trust Model
            </h3>
            <p className="text-gray-600">
              Understanding SDLP's three-state trust system
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Trusted State */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h4 className="font-medium text-green-800">Trusted</h4>
                </div>
                <p className="text-sm text-green-700">
                  Sender is in your trust store. Links proceed with minimal friction.
                </p>
              </div>

              {/* Untrusted State */}
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <h4 className="font-medium text-yellow-800">Untrusted</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Valid but unknown sender. Shows TOFU options: "Trust this Sender" or "Proceed Once".
                </p>
              </div>

              {/* Invalid State */}
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <h4 className="font-medium text-red-800">Invalid</h4>
                </div>
                <p className="text-sm text-red-700">
                  Cryptographic verification failed. Link is blocked for security.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 text-blue-600 mt-0.5">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Trust on First Use (TOFU)
                  </p>
                  <p className="text-sm text-blue-700">
                    All senders start as untrusted. When you encounter a valid link from an unknown sender, 
                    you can choose to "Trust this Sender" to add them to your trust store for future interactions, 
                    or "Proceed Once" to execute without trusting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Examples;
