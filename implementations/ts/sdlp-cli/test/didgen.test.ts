import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const CLI_PATH = join(__dirname, '../src/index.ts');

describe('didgen command', () => {
  const testId = Math.random().toString(36).substring(7);
  const testKeyFile = `test-didgen-key-${testId}.jwk`;
  const testOutputFile = `test-did-document-${testId}.json`;

  beforeEach(() => {
    // Create a test key file
    const testKey = {
      kty: 'OKP',
      crv: 'Ed25519',
      x: 'O2onvM62pC1io6jQKm8Nc2UyFXcd4kOmOsBIoYtZ2ik',
      d: 'nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A',
      kid: 'test-key-1',
      alg: 'EdDSA',
    };
    writeFileSync(testKeyFile, JSON.stringify(testKey, null, 2));
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(testKeyFile)) {
      unlinkSync(testKeyFile);
    }
    if (existsSync(testOutputFile)) {
      unlinkSync(testOutputFile);
    }
  });

  it('should generate a did:key document', () => {
    const result = execSync(
      `npx tsx ${CLI_PATH} didgen --key ${testKeyFile} --method key --output ${testOutputFile}`,
      { encoding: 'utf-8' }
    );

    expect(result).toContain('✅ DID document generated successfully');
    expect(existsSync(testOutputFile)).toBe(true);

    const didDocument = JSON.parse(readFileSync(testOutputFile, 'utf-8'));
    expect(didDocument.id).toMatch(/^did:key:z/);
    expect(didDocument['@context']).toContain('https://www.w3.org/ns/did/v1');
    expect(didDocument.verificationMethod).toHaveLength(1);
    expect(didDocument.verificationMethod[0].type).toBe(
      'Ed25519VerificationKey2020'
    );
  });

  it('should generate a did:web document', () => {
    const result = execSync(
      `npx tsx ${CLI_PATH} didgen --key ${testKeyFile} --method web --domain example.com --output ${testOutputFile}`,
      { encoding: 'utf-8' }
    );

    expect(result).toContain('✅ DID document generated successfully');
    expect(result).toContain('🚀 To publish your DID');
    expect(result).toContain('https://example.com/.well-known/did.json');
    expect(existsSync(testOutputFile)).toBe(true);

    const didDocument = JSON.parse(readFileSync(testOutputFile, 'utf-8'));
    expect(didDocument.id).toBe('did:web:example.com');
    expect(didDocument['@context']).toContain('https://www.w3.org/ns/did/v1');
    expect(didDocument.verificationMethod).toHaveLength(1);
    expect(didDocument.verificationMethod[0].id).toBe(
      'did:web:example.com#key-1'
    );
  });

  it('should output to stdout when no output file specified', () => {
    const result = execSync(
      `npx tsx ${CLI_PATH} didgen --key ${testKeyFile} --method key`,
      { encoding: 'utf-8' }
    );

    // Should contain JSON output
    expect(result).toContain('"@context"');
    expect(result).toContain('"id"');
    expect(result).toContain('did:key:');
  });

  it('should fail when method is invalid', () => {
    expect(() => {
      execSync(
        `npx tsx ${CLI_PATH} didgen --key ${testKeyFile} --method invalid`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).toThrow();
  });

  it('should fail when domain is missing for did:web', () => {
    expect(() => {
      execSync(`npx tsx ${CLI_PATH} didgen --key ${testKeyFile} --method web`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }).toThrow();
  });

  it('should fail when key file is invalid', () => {
    // Create invalid key file
    const invalidKeyFile = 'invalid-key.jwk';
    writeFileSync(invalidKeyFile, JSON.stringify({ invalid: 'key' }));

    try {
      expect(() => {
        execSync(
          `npx tsx ${CLI_PATH} didgen --key ${invalidKeyFile} --method key`,
          { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
      }).toThrow();
    } finally {
      if (existsSync(invalidKeyFile)) {
        unlinkSync(invalidKeyFile);
      }
    }
  });
});
