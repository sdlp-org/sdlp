/**
 * Comprehensive test suite for SDLP CLI
 */

import { execSync, spawn } from 'node:child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Test data and files
const TEST_PAYLOAD = JSON.stringify({
    message: 'Hello, SDLP!',
    timestamp: '2025-06-15T15:00:00Z',
    test: true,
});

const TEST_FILES = {
    payload: 'test-payload.json',
    key: 'test-key.jwk',
    link: 'test-link.sdlp',
    invalidLink: 'invalid-link.txt',
};

// CLI executable path
const CLI_PATH = './dist/src/index.js';

// Helper function to spawn a child process and return a Promise
function spawnCommand(args: string[], input?: string): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [CLI_PATH, ...args]);
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            resolve({ code: code ?? 0, stdout, stderr });
        });

        child.on('error', (err) => {
            reject(err);
        });

        if (input) {
            child.stdin.write(input);
            child.stdin.end();
        }
    });
}

describe('SDLP CLI', () => {
    beforeAll(() => {
        // Ensure CLI is built
        try {
            execSync('npm run build', { stdio: 'inherit' });
        } catch (error) {
            throw new Error('Failed to build CLI');
        }

        // Create test payload file
        writeFileSync(TEST_FILES.payload, TEST_PAYLOAD);

        // Create invalid link file
        writeFileSync(TEST_FILES.invalidLink, 'invalid-link-content');
    });

    afterAll(() => {
        // Clean up test files
        Object.values(TEST_FILES).forEach(file => {
            if (existsSync(file)) {
                unlinkSync(file);
            }
        });
    });

    describe('Command Parsing and Help', () => {
        it('should show help when called with --help', async () => {
            const result = await spawnCommand(['--help']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('CLI for the Secure Deep Link Protocol (SDLP)');
            expect(result.stdout).toContain('keygen');
            expect(result.stdout).toContain('sign');
            expect(result.stdout).toContain('verify');
        });

        it('should show version when called with --version', async () => {
            const result = await spawnCommand(['--version']);

            expect(result.code).toBe(0);
            expect(result.stdout.trim()).toBe('1.0.0');
        });

        it('should show command help for keygen', async () => {
            const result = await spawnCommand(['keygen', '--help']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Generate a did:key and save the private key');
            expect(result.stdout).toContain('--out');
        });

        it('should show command help for sign', async () => {
            const result = await spawnCommand(['sign', '--help']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Sign a payload file and create an SDLP link');
            expect(result.stdout).toContain('--payload-file');
            expect(result.stdout).toContain('--type');
        });

        it('should show command help for verify', async () => {
            const result = await spawnCommand(['verify', '--help']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Verify an SDLP link and output the payload');
            expect(result.stdout).toContain('--json');
        });
    });

    describe('Keygen Command', () => {
        it('should generate a key pair successfully', async () => {
            const result = await spawnCommand(['keygen', '--out', TEST_FILES.key]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Key pair generated successfully!');
            expect(result.stdout).toContain('📁 Private key saved to:');
            expect(result.stdout).toContain('🔑 DID:');
            expect(result.stdout).toContain('did:key:');
            expect(existsSync(TEST_FILES.key)).toBe(true);

            // Validate the generated key file
            const keyContent = readFileSync(TEST_FILES.key, 'utf8');
            const key = JSON.parse(keyContent);
            expect(key).toHaveProperty('kty');
            expect(key).toHaveProperty('crv');
            expect(key).toHaveProperty('kid');
            expect(key).toHaveProperty('alg');
            expect(key.kid).toMatch(/^did:key:z[A-Za-z0-9]+#z[A-Za-z0-9]+$/);
        });

        it('should fail when output file is not writable', async () => {
            const result = await spawnCommand(['keygen', '--out', '/invalid/path/key.jwk']);

            expect(result.code).toBe(1);
            expect(result.stderr).toContain('❌ Error generating key pair');
        });
    });

    describe('Sign Command', () => {
        it('should sign a payload successfully', async () => {
            const result = await spawnCommand([
                'sign',
                '--payload-file', TEST_FILES.payload,
                '--type', 'application/json',
                '--signer-key', TEST_FILES.key,
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toMatch(/^sdlp:\/\/[A-Za-z0-9\-_=\n\r]+\.[A-Za-z0-9\-_=\n\r]+$/);

            // Save the link for use in verification tests
            writeFileSync(TEST_FILES.link, result.stdout.trim());
        });

        it('should fail when payload file does not exist', async () => {
            const result = await spawnCommand([
                'sign',
                '--payload-file', 'nonexistent.json',
                '--type', 'application/json',
                '--signer-key', TEST_FILES.key,
            ]);

            expect(result.code).toBe(1);
            expect(result.stderr).toContain('❌ Error creating link');
        });

        it('should fail when signer key does not exist', async () => {
            const result = await spawnCommand([
                'sign',
                '--payload-file', TEST_FILES.payload,
                '--type', 'application/json',
                '--signer-key', 'nonexistent.jwk',
            ]);

            expect(result.code).toBe(1);
            expect(result.stderr).toContain('❌ Error creating link');
        });

        it('should accept compression options', async () => {
            const result = await spawnCommand([
                'sign',
                '--payload-file', TEST_FILES.payload,
                '--type', 'application/json',
                '--signer-key', TEST_FILES.key,
                '--compression', 'none',
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toMatch(/^sdlp:\/\/[A-Za-z0-9\-_=\n\r]+\.[A-Za-z0-9\-_=\n\r]+$/);
        });
    });

    describe('Verify Command', () => {
        let testLink: string;

        beforeAll(async () => {
            // Generate a test link for verification tests
            const result = await spawnCommand([
                'sign',
                '--payload-file', TEST_FILES.payload,
                '--type', 'application/json',
                '--signer-key', TEST_FILES.key,
            ]);

            if (result.code !== 0) {
                throw new Error(`Sign command failed with code ${result.code}`);
            }

            testLink = result.stdout.trim();
            writeFileSync(TEST_FILES.link, testLink);
        });

        it('should verify a valid link successfully', async () => {
            const result = await spawnCommand(['verify'], testLink);

            expect(result.code).toBe(0);
            expect(result.stderr).toContain('✅ Link verified successfully!');
            expect(result.stderr).toContain('👤 Sender:');
            expect(result.stderr).toContain('did:key:');
            expect(result.stderr).toContain('📄 Content Type: application/json');
            expect(result.stdout).toContain('"message":"Hello, SDLP!"');
        });

        it('should verify a link passed as argument', async () => {
            const result = await spawnCommand(['verify', testLink]);

            expect(result.code).toBe(0);
            expect(result.stderr).toContain('✅ Link verified successfully!');
        });

        it('should output JSON format when requested', async () => {
            const result = await spawnCommand(['verify', '--json'], testLink);

            expect(result.code).toBe(0);

            // Parse the JSON output (first part)
            const lines = result.stdout.split('\n');
            const jsonOutput = JSON.parse(lines[0]);

            expect(jsonOutput).toHaveProperty('valid', true);
            expect(jsonOutput).toHaveProperty('sender');
            expect(jsonOutput).toHaveProperty('contentType', 'application/json');
            expect(jsonOutput).toHaveProperty('payloadSize');
            expect(jsonOutput).toHaveProperty('metadata');
        });

        it('should fail with invalid link format', async () => {
            const result = await spawnCommand(['verify'], 'invalid-link-format');

            expect(result.code).toBe(1);
            expect(result.stderr).toContain('❌ Link verification failed');
            expect(result.stderr).toContain('Error:');
        });

        it('should fail with malformed link', async () => {
            const result = await spawnCommand(['verify', 'sdlp://invalid.link']);

            expect(result.code).toBe(1);
            expect(result.stderr).toContain('❌ Link verification failed');
        });

        it('should respect max payload size option', async () => {
            const result = await spawnCommand([
                'verify',
                '--max-payload-size', '10', // Very small limit
                testLink,
            ]);

            expect(result.code).toBe(1);
            expect(result.stderr).toContain('❌ Link verification failed');
        });

        it('should fail verification for a link with trailing data', async () => {
            // This test case addresses the security vulnerability where appending arbitrary data
            // to a valid SDLP link does not cause verification to fail
            const tamperedLink = "sdlp://part1.part2.extradata";

            const result = await spawnCommand(['verify', tamperedLink]);

            expect(result.code).toBe(1);
            expect(result.stderr).toContain('❌ Link verification failed');
            expect(result.stderr).toContain('Error:');
        });
    });

    describe('Integration Tests', () => {
        it('should complete full round-trip: keygen -> sign -> verify', async () => {
            const tempKey = 'temp-integration-key.jwk';
            const tempPayload = 'temp-integration-payload.json';
            const integrationPayload = { test: 'integration', value: 42 };

            writeFileSync(tempPayload, JSON.stringify(integrationPayload));

            try {
                // Step 1: Generate key
                const keygenResult = await spawnCommand(['keygen', '--out', tempKey]);
                expect(keygenResult.code).toBe(0);
                expect(existsSync(tempKey)).toBe(true);

                // Step 2: Sign payload
                const signResult = await spawnCommand([
                    'sign',
                    '--payload-file', tempPayload,
                    '--type', 'application/json',
                    '--signer-key', tempKey,
                ]);
                expect(signResult.code).toBe(0);
                const link = signResult.stdout.trim();
                expect(link).toMatch(/^sdlp:\/\//);

                // Step 3: Verify the link
                const verifyResult = await spawnCommand(['verify', '--json', link]);
                expect(verifyResult.code).toBe(0);

                const lines = verifyResult.stdout.split('\n');
                const verificationResult = JSON.parse(lines[0]);
                const payload = JSON.parse(lines[1]);

                expect(verificationResult.valid).toBe(true);
                expect(payload).toEqual(integrationPayload);
            } finally {
                // Clean up
                if (existsSync(tempKey)) {
                    unlinkSync(tempKey);
                }
                if (existsSync(tempPayload)) {
                    unlinkSync(tempPayload);
                }
            }
        });
    });
});
