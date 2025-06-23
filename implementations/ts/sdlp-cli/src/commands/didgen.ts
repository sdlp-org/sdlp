import { readFileSync, writeFileSync } from 'node:fs';
import bs58 from 'bs58';
import { Command } from 'commander';
import type { JWK } from 'jose';

interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk: JWK;
  }>;
  authentication: string[];
  assertionMethod: string[];
}

export const didgenCommand = new Command('didgen')
  .description('Generate a DID document from an existing key')
  .requiredOption('--key <file>', 'Path to the JWK key file')
  .requiredOption('--method <method>', 'DID method: "key" or "web"')
  .option('--domain <domain>', 'Domain name for did:web method (required for did:web)')
  .option('-o, --output <file>', 'Output file for the DID document (default: stdout)')
  .action(async (options) => {
    try {
      // Validate method
      if (options.method !== 'key' && options.method !== 'web') {
        throw new Error('Method must be either "key" or "web"');
      }

      // Validate domain for did:web
      if (options.method === 'web' && (options.domain === undefined || options.domain === '')) {
        throw new Error('--domain is required when using did:web method');
      }

      // Read the key file
      const keyContent = readFileSync(options.key, 'utf-8');
      const keyData: JWK = JSON.parse(keyContent);

      // Extract public key components
      if (keyData.kty !== 'OKP' || keyData.crv !== 'Ed25519') {
        throw new Error('Only Ed25519 keys are supported');
      }

      if (keyData.x === undefined || keyData.x === null || keyData.x === '') {
        throw new Error('Invalid key: missing x coordinate');
      }

      const publicJWK: JWK = {
        kty: keyData.kty,
        crv: keyData.crv,
        x: keyData.x,
      };

      let didDocument: DIDDocument;

      if (options.method === 'key') {
        // Generate did:key document
        const didIdentifier = generateDidKey(publicJWK);
        const keyIdentifier = didIdentifier.replace('did:key:', '');
        const keyId = `${didIdentifier}#${keyIdentifier}`;

        didDocument = {
          "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1"
          ],
          "id": didIdentifier,
          "verificationMethod": [
            {
              "id": keyId,
              "type": "Ed25519VerificationKey2020",
              "controller": didIdentifier,
              "publicKeyJwk": publicJWK
            }
          ],
          "authentication": [keyId],
          "assertionMethod": [keyId]
        };
      } else {
        // Generate did:web document
        const didIdentifier = `did:web:${options.domain}`;
        const keyId = `${didIdentifier}#key-1`;

        didDocument = {
          "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1"
          ],
          "id": didIdentifier,
          "verificationMethod": [
            {
              "id": keyId,
              "type": "Ed25519VerificationKey2020",
              "controller": didIdentifier,
              "publicKeyJwk": publicJWK
            }
          ],
          "authentication": [keyId],
          "assertionMethod": [keyId]
        };
      }

      const didDocumentJson = JSON.stringify(didDocument, null, 2);

      // Output the DID document
      if (typeof options.output === 'string' && options.output.length > 0) {
        writeFileSync(options.output, didDocumentJson);
        console.log(`✅ DID document generated successfully at ${options.output}`);
      } else {
        console.log(didDocumentJson);
      }

      // Print publishing instructions for did:web
      if (options.method === 'web') {
        console.log('');
        console.log('🚀 To publish your DID, host this file on your web server at the following location:');
        console.log(`https://${options.domain}/.well-known/did.json`);
        console.log('');
        console.log('You can verify it using a universal resolver or by running:');
        console.log(`sdlp-cli verify <some-link> --resolver-url https://${options.domain}`);
      }

    } catch (error) {
      console.error('❌ Error generating DID document:', error);
      process.exit(1);
    }
  });

/**
 * Generate a did:key identifier from a public JWK
 */
function generateDidKey(publicJWK: JWK): string {
  // For Ed25519 keys, we need to extract the x coordinate and encode it
  if (publicJWK.kty !== 'OKP' || publicJWK.crv !== 'Ed25519') {
    throw new Error('Only Ed25519 keys are supported for did:key generation');
  }

  const x = publicJWK.x;
  if (typeof x !== 'string') {
    throw new Error('Invalid Ed25519 public key: missing x coordinate');
  }
  if (x.length === 0) {
    throw new Error('Invalid Ed25519 public key: empty x coordinate');
  }

  // Decode the base64url x coordinate
  const xBytes = base64urlDecode(x);

  // For Ed25519, the multicodec prefix is 0xed (237 in decimal) followed by 0x01
  const multicodecPrefix = new Uint8Array([0xed, 0x01]);
  const publicKeyBytes = new Uint8Array(
    multicodecPrefix.length + xBytes.length
  );
  publicKeyBytes.set(multicodecPrefix);
  publicKeyBytes.set(xBytes, multicodecPrefix.length);

  // Encode with base58btc
  const base58Key = bs58.encode(publicKeyBytes);

  return `did:key:z${base58Key}`;
}

/**
 * Base64URL decode
 */
function base64urlDecode(str: string): Uint8Array {
  // Replace base64url characters with base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Decode
  const buffer = Buffer.from(base64, 'base64');
  return new Uint8Array(buffer);
}
