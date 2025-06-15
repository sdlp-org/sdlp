/**
 * Comprehensive test suite for SDLP CLI
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

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
const CLI_PATH = './dist/index.js';

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
        it('should show help when called with --help', (done) => {
            const child = spawn('node', [CLI_PATH, '--help']);
            let stdout = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stdout).toContain('CLI for the Secure Deep Link Protocol (SDLP)');
                expect(stdout).toContain('keygen');
                expect(stdout).toContain('sign');
                expect(stdout).toContain('verify');
                done();
            });
        });

        it('should show version when called with --version', (done) => {
            const child = spawn('node', [CLI_PATH, '--version']);
            let stdout = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stdout.trim()).toBe('1.0.0');
                done();
            });
        });

        it('should show command help for keygen', (done) => {
            const child = spawn('node', [CLI_PATH, 'keygen', '--help']);
            let stdout = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stdout).toContain('Generate a did:key and save the private key');
                expect(stdout).toContain('--out');
                done();
            });
        });

        it('should show command help for sign', (done) => {
            const child = spawn('node', [CLI_PATH, 'sign', '--help']);
            let stdout = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stdout).toContain('Sign a payload file and create an SDLP link');
                expect(stdout).toContain('--payload-file');
                expect(stdout).toContain('--type');
                done();
            });
        });

        it('should show command help for verify', (done) => {
            const child = spawn('node', [CLI_PATH, 'verify', '--help']);
            let stdout = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stdout).toContain('Verify an SDLP link and output the payload');
                expect(stdout).toContain('--json');
                done();
            });
        });
    });

    describe('Keygen Command', () => {
        it('should generate a key pair successfully', (done) => {
            const child = spawn('node', [CLI_PATH, 'keygen', '--out', TEST_FILES.key]);
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stdout).toContain('✅ Key pair generated successfully!');
                expect(stdout).toContain('📁 Private key saved to:');
                expect(stdout).toContain('🔑 DID:');
                expect(stdout).toContain('did:key:');
                expect(existsSync(TEST_FILES.key)).toBe(true);

                // Validate the generated key file
                const keyContent = readFileSync(TEST_FILES.key, 'utf8');
                const key = JSON.parse(keyContent);
                expect(key).toHaveProperty('kty');
                expect(key).toHaveProperty('crv');
                expect(key).toHaveProperty('kid');
                expect(key).toHaveProperty('alg');
                expect(key.kid).toMatch(/^did:key:z[A-Za-z0-9]+#key-1$/);

                done();
            });
        });

        it('should fail when output file is not writable', (done) => {
            const child = spawn('node', [CLI_PATH, 'keygen', '--out', '/invalid/path/key.jwk']);
            let stderr = '';

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(1);
                expect(stderr).toContain('❌ Error generating key pair');
                done();
            });
        });
    });

    describe('Sign Command', () => {
        it('should sign a payload successfully', (done) => {
            const child = spawn('node', [
                CLI_PATH,
                'sign',
                '--payload-file', TEST_FILES.payload,
                '--type', 'application/json',
                '--signer-key', TEST_FILES.key,
            ]);
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stdout).toMatch(/^sdlp:\/\/[A-Za-z0-9\-_=\n\r]+\.[A-Za-z0-9\-_=\n\r]+$/);

                // Save the link for use in verification tests
                writeFileSync(TEST_FILES.link, stdout.trim());
                done();
            });
        });

        it('should fail when payload file does not exist', (done) => {
            const child = spawn('node', [
                CLI_PATH,
                'sign',
                '--payload-file', 'nonexistent.json',
                '--type', 'application/json',
                '--signer-key', TEST_FILES.key,
            ]);
            let stderr = '';

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(1);
                expect(stderr).toContain('❌ Error creating link');
                done();
            });
        });

        it('should fail when signer key does not exist', (done) => {
            const child = spawn('node', [
                CLI_PATH,
                'sign',
                '--payload-file', TEST_FILES.payload,
                '--type', 'application/json',
                '--signer-key', 'nonexistent.jwk',
            ]);
            let stderr = '';

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(1);
                expect(stderr).toContain('❌ Error creating link');
                done();
            });
        });

        it('should accept compression options', (done) => {
            const child = spawn('node', [
                CLI_PATH,
                'sign',
                '--payload-file', TEST_FILES.payload,
                '--type', 'application/json',
                '--signer-key', TEST_FILES.key,
                '--compression', 'none',
            ]);
            let stdout = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stdout).toMatch(/^sdlp:\/\/[A-Za-z0-9\-_=\n\r]+\.[A-Za-z0-9\-_=\n\r]+$/);
                done();
            });
        });
    });

    describe('Verify Command', () => {
        let testLink: string;

        beforeAll(async () => {
            // Generate a test link for verification tests
            testLink = await new Promise<string>((resolve, reject) => {
                const child = spawn('node', [
                    CLI_PATH,
                    'sign',
                    '--payload-file', TEST_FILES.payload,
                    '--type', 'application/json',
                    '--signer-key', TEST_FILES.key,
                ]);
                let stdout = '';

                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                child.on('close', (code) => {
                    if (code === 0) {
                        const link = stdout.trim();
                        writeFileSync(TEST_FILES.link, link);
                        resolve(link);
                    } else {
                        reject(new Error(`Sign command failed with code ${code}`));
                    }
                });
            });
        });

        it('should verify a valid link successfully', (done) => {
            const child = spawn('node', [CLI_PATH, 'verify']);
            let stdout = '';
            let stderr = '';

            // Use the generated test link
            child.stdin.write(testLink);
            child.stdin.end();

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stderr).toContain('✅ Link verified successfully!');
                expect(stderr).toContain('👤 Sender:');
                expect(stderr).toContain('did:key:');
                expect(stderr).toContain('📄 Content Type: application/json');
                expect(stdout).toContain('"message": "Hello, SDLP!"');
                done();
            });
        });

        it('should verify a link passed as argument', (done) => {
            const child = spawn('node', [CLI_PATH, 'verify', testLink]);
            let stderr = '';

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);
                expect(stderr).toContain('✅ Link verified successfully!');
                done();
            });
        });

        it('should output JSON format when requested', (done) => {
            const child = spawn('node', [CLI_PATH, 'verify', '--json']);
            let stdout = '';

            // Use the generated test link
            child.stdin.write(testLink);
            child.stdin.end();

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(0);

                // Parse the JSON output (first part)
                const lines = stdout.split('\n');
                const jsonOutput = JSON.parse(lines[0]);

                expect(jsonOutput).toHaveProperty('valid', true);
                expect(jsonOutput).toHaveProperty('sender');
                expect(jsonOutput).toHaveProperty('contentType', 'application/json');
                expect(jsonOutput).toHaveProperty('payloadSize');
                expect(jsonOutput).toHaveProperty('metadata');
                done();
            });
        });

        it('should fail with invalid link format', (done) => {
            const child = spawn('node', [CLI_PATH, 'verify']);
            let stderr = '';

            child.stdin.write('invalid-link-format');
            child.stdin.end();

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(1);
                expect(stderr).toContain('❌ Link verification failed');
                expect(stderr).toContain('Error:');
                done();
            });
        });

        it('should fail with malformed link', (done) => {
            const child = spawn('node', [CLI_PATH, 'verify', 'sdlp://invalid.link']);
            let stderr = '';

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(1);
                expect(stderr).toContain('❌ Link verification failed');
                done();
            });
        });

        it('should respect max payload size option', (done) => {
            const child = spawn('node', [
                CLI_PATH,
                'verify',
                '--max-payload-size', '10', // Very small limit
                testLink,
            ]);
            let stderr = '';

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                expect(code).toBe(1);
                expect(stderr).toContain('❌ Link verification failed');
                done();
            });
        });
    });

    describe('Integration Tests', () => {
        it('should complete full round-trip: keygen -> sign -> verify', (done) => {
            const tempKey = 'temp-integration-key.jwk';
            const tempPayload = 'temp-integration-payload.json';
            const integrationPayload = { test: 'integration', value: 42 };

            writeFileSync(tempPayload, JSON.stringify(integrationPayload));

            // Step 1: Generate key
            const keygenChild = spawn('node', [CLI_PATH, 'keygen', '--out', tempKey]);

            keygenChild.on('close', (keygenCode) => {
                expect(keygenCode).toBe(0);
                expect(existsSync(tempKey)).toBe(true);

                // Step 2: Sign payload
                const signChild = spawn('node', [
                    CLI_PATH,
                    'sign',
                    '--payload-file', tempPayload,
                    '--type', 'application/json',
                    '--signer-key', tempKey,
                ]);

                let signStdout = '';
                signChild.stdout.on('data', (data) => {
                    signStdout += data.toString();
                });

                signChild.on('close', (signCode) => {
                    expect(signCode).toBe(0);
                    const link = signStdout.trim();
                    expect(link).toMatch(/^sdlp:\/\//);

                    // Step 3: Verify the link
                    const verifyChild = spawn('node', [CLI_PATH, 'verify', '--json', link]);
                    let verifyStdout = '';

                    verifyChild.stdout.on('data', (data) => {
                        verifyStdout += data.toString();
                    });

                    verifyChild.on('close', (verifyCode) => {
                        expect(verifyCode).toBe(0);

                        const lines = verifyStdout.split('\n');
                        const verificationResult = JSON.parse(lines[0]);
                        const payload = JSON.parse(lines[1]);

                        expect(verificationResult.valid).toBe(true);
                        expect(payload).toEqual(integrationPayload);

                        // Clean up
                        unlinkSync(tempKey);
                        unlinkSync(tempPayload);
                        done();
                    });
                });
            });
        });
    });
}); 
