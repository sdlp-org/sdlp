import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const CLI_PATH = join(__dirname, '../src/index.ts');

describe('sign command DID-centric workflow', () => {
  const testId = Math.random().toString(36).substring(7);
  const testKeyFile = `test-sign-key-${testId}.jwk`;
  const testDidDocumentFile = `test-did-document-${testId}.json`;
  const testPayloadFile = `test-payload-${testId}.txt`;

  beforeEach(() => {
    // Create a test key file
    const testKey = {
      kty: 'OKP',
      crv: 'Ed25519',
      x: 'O2onvM62pC1io6jQKm8Nc2UyFXcd4kOmOsBIoYtZ2ik',
      d: 'nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A',
      kid: 'did:key:z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV#z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV',
      alg: 'EdDSA'
    };
    writeFileSync(testKeyFile, JSON.stringify(testKey, null, 2));

    // Create a test DID document
    const testDidDocument = {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ],
      "id": "did:key:z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV",
      "verificationMethod": [
        {
          "id": "did:key:z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV#z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV",
          "type": "Ed25519VerificationKey2020",
          "controller": "did:key:z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV",
          "publicKeyJwk": {
            "kty": "OKP",
            "crv": "Ed25519",
            "x": "O2onvM62pC1io6jQKm8Nc2UyFXcd4kOmOsBIoYtZ2ik"
          }
        }
      ],
      "authentication": ["did:key:z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV#z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV"],
      "assertionMethod": ["did:key:z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV#z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV"]
    };
    writeFileSync(testDidDocumentFile, JSON.stringify(testDidDocument, null, 2));

    // Create a test payload file
    writeFileSync(testPayloadFile, 'Hello, SDLP!');
  });

  afterEach(() => {
    // Clean up test files
    [testKeyFile, testDidDocumentFile, testPayloadFile].forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
  });

  it('should sign with DID document workflow', () => {
    const result = execSync(
      `npx tsx ${CLI_PATH} sign --payload-file ${testPayloadFile} --type text/plain --did-document ${testDidDocumentFile} --kid "did:key:z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV#z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV" --key ${testKeyFile}`,
      { encoding: 'utf-8' }
    );

    // Should output an SDLP link
    expect(result.trim()).toMatch(/^sdlp:/);
  });

  it('should sign with did:web document workflow', () => {
    // Create a did:web document
    const didWebDocument = {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ],
      "id": "did:web:example.com",
      "verificationMethod": [
        {
          "id": "did:web:example.com#key-1",
          "type": "Ed25519VerificationKey2020",
          "controller": "did:web:example.com",
          "publicKeyJwk": {
            "kty": "OKP",
            "crv": "Ed25519",
            "x": "O2onvM62pC1io6jQKm8Nc2UyFXcd4kOmOsBIoYtZ2ik"
          }
        }
      ],
      "authentication": ["did:web:example.com#key-1"],
      "assertionMethod": ["did:web:example.com#key-1"]
    };
    
    const didWebFile = 'test-did-web.json';
    writeFileSync(didWebFile, JSON.stringify(didWebDocument, null, 2));

    try {
      const result = execSync(
        `npx tsx ${CLI_PATH} sign --payload-file ${testPayloadFile} --type text/plain --did-document ${didWebFile} --kid "did:web:example.com#key-1" --key ${testKeyFile}`,
        { encoding: 'utf-8' }
      );

      // Should output an SDLP link
      expect(result.trim()).toMatch(/^sdlp:/);
    } finally {
      if (existsSync(didWebFile)) {
        unlinkSync(didWebFile);
      }
    }
  });

  it('should fail when key does not match DID document', () => {
    // Create a mismatched key
    const mismatchedKey = {
      kty: 'OKP',
      crv: 'Ed25519',
      x: 'different_x_value_here_that_wont_match_the_did_doc',
      d: 'different_d_value_here_that_wont_match_the_did_doc',
      kid: 'test-key-1',
      alg: 'EdDSA'
    };
    
    const mismatchedKeyFile = 'mismatched-key.jwk';
    writeFileSync(mismatchedKeyFile, JSON.stringify(mismatchedKey, null, 2));

    try {
      expect(() => {
        execSync(
          `npx tsx ${CLI_PATH} sign --payload-file ${testPayloadFile} --type text/plain --did-document ${testDidDocumentFile} --kid "did:key:z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV#z6Mkp7AVwvWxnsNDuSSbf19sgKzrx223WY95AqZyAGifFVyV" --key ${mismatchedKeyFile}`,
          { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
      }).toThrow();
    } finally {
      if (existsSync(mismatchedKeyFile)) {
        unlinkSync(mismatchedKeyFile);
      }
    }
  });

  it('should fail when kid is not found in DID document', () => {
    expect(() => {
      execSync(
        `npx tsx ${CLI_PATH} sign --payload-file ${testPayloadFile} --type text/plain --did-document ${testDidDocumentFile} --kid "did:key:nonexistent#key" --key ${testKeyFile}`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).toThrow();
  });

  it('should still work with traditional workflow', () => {
    const result = execSync(
      `npx tsx ${CLI_PATH} sign --payload-file ${testPayloadFile} --type text/plain --signer-key ${testKeyFile}`,
      { encoding: 'utf-8' }
    );

    // Should output an SDLP link
    expect(result.trim()).toMatch(/^sdlp:/);
  });
});
