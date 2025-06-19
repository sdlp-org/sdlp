#!/usr/bin/env node

/**
 * SDLP Test Vector Generator
 *
 * Generates comprehensive test vectors for the Secure Deep Link Protocol (SDLP)
 * Implements the protocol as specified in specs/sdlp-v0.1-draft.md
 *
 * Usage:
 *   tsx generate-test-vectors.ts [--output <file>]
 *   tsx generate-test-vectors.ts --help
 *   npm run generate-vectors [-- --output <file>]
 *   npm run generate-vectors -- --help
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from '@noble/hashes/sha256';
import type {
  Ed25519PrivateKeyJWK,
  SDLPSigner,
  CreateSDLPLinkParameters,
  SDLPLinkString,
  SDLPTestVector,
  SDLPTestVectorSuite,
  TestKeyFixtures,
  CompressionAlgorithm,
  SDLPCoreMetadata,
  JWSProtectedHeader,
  JWSCompactSerialization,
  PayloadType,
} from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test identities with proper typing
function getKeysPath(): string {
  const fixturesPath = path.join(__dirname, '..', 'test-fixtures', 'keys.json');
  if (fs.existsSync(fixturesPath)) {
    return fixturesPath;
  }
  // Fallback if run from different directory
  const altPath = path.join(process.cwd(), 'test-fixtures', 'keys.json');
  if (fs.existsSync(altPath)) {
    return altPath;
  }
  throw new Error(
    'Could not find keys.json file. Make sure to run from specs directory or that test-fixtures/keys.json exists.'
  );
}

function loadTestKeys(): TestKeyFixtures {
  const keysPath = getKeysPath();
  const keysData = fs.readFileSync(keysPath, 'utf8');
  return JSON.parse(keysData) as TestKeyFixtures;
}

// Utility functions with proper typing
export function base64urlEncode(buffer: Buffer | Uint8Array | string): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64urlDecode(str: string): Buffer {
  // Add padding if needed
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  // Convert base64url to base64
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

export function sha256Hash(data: Buffer | Uint8Array | string): string {
  // Use @noble/hashes for better security and consistency
  const hash = sha256(data instanceof Buffer ? data : Buffer.from(data));
  return Buffer.from(hash).toString('hex');
}

// Compression with type safety
function compressPayload(
  payload: string,
  algorithm: CompressionAlgorithm = 'none'
): Buffer {
  if (algorithm === 'none') {
    return Buffer.from(payload, 'utf8');
  }
  // For MVP, we'll only support 'none' compression
  throw new Error(`Unsupported compression algorithm: ${algorithm}`);
}

// Ed25519 signing using Node.js crypto with proper typing
function createEd25519KeyPair(privateKeyJwk: Ed25519PrivateKeyJWK): {
  privateKey: crypto.KeyObject;
} {
  // Convert JWK private key to Node.js KeyObject format
  const privateKeyDer = Buffer.concat([
    Buffer.from([
      0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
      0x04, 0x22, 0x04, 0x20,
    ]),
    base64urlDecode(privateKeyJwk.d),
  ]);

  const privateKey = crypto.createPrivateKey({
    key: privateKeyDer,
    format: 'der',
    type: 'pkcs8',
  });

  return { privateKey };
}

function signJWS(
  payload: SDLPCoreMetadata,
  protectedHeader: JWSProtectedHeader,
  privateKey: crypto.KeyObject
): JWSCompactSerialization {
  const encodedProtected = base64urlEncode(JSON.stringify(protectedHeader));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${encodedProtected}.${encodedPayload}`;

  const signature = crypto.sign(null, Buffer.from(signingInput), privateKey);
  const encodedSignature = base64urlEncode(signature);

  return {
    protected: encodedProtected,
    payload: encodedPayload,
    signature: encodedSignature,
  };
}

export function createSDLPLink(
  params: CreateSDLPLinkParameters
): SDLPLinkString {
  const payload = params.payload;
  const payloadType = params.payloadType;
  const signer = params.signer;
  const compress = params.compress ?? 'none';
  const expiresIn = params.expiresIn ?? null;
  const notBefore = params.notBefore;

  // Step 1: Calculate checksum of original payload
  const payloadBuffer = Buffer.from(payload, 'utf8');
  const chk = sha256Hash(payloadBuffer);

  // Step 2: Compress payload
  const compressedPayload = compressPayload(payload, compress);

  // Step 3: Base64URL encode compressed payload
  const encodedPayload = base64urlEncode(compressedPayload);

  // Step 4: Create Core Metadata
  const now = Math.floor(Date.now() / 1000);
  const coreMetadata: SDLPCoreMetadata = {
    v: 'SDL-1.0',
    sid: signer.did,
    type: payloadType,
    comp: compress,
    chk: chk,
    ...(expiresIn !== null && { exp: now + expiresIn }),
    ...(notBefore !== undefined && { nbf: notBefore }),
  };

  // Step 5: Create JWS Protected Header
  const protectedHeader: JWSProtectedHeader = {
    alg: 'EdDSA',
    kid: signer.kid,
  };

  // Step 6: Sign the Core Metadata
  const { privateKey } = createEd25519KeyPair(signer.privateKeyJwk);
  const jws = signJWS(coreMetadata, protectedHeader, privateKey);

  // Step 7: Base64URL encode the JWS object
  const jwsObject: JWSCompactSerialization = {
    protected: jws.protected,
    payload: jws.payload,
    signature: jws.signature,
  };
  const encodedJWS = base64urlEncode(JSON.stringify(jwsObject));

  // Step 8: Assemble final link
  return `sdlp://${encodedJWS}.${encodedPayload}`;
}

// Generate test vectors with full type safety
export function generateTestVectors(): SDLPTestVectorSuite {
  const keys = loadTestKeys();
  const vectors: SDLPTestVector[] = [];

  // Test case 1: Happy path with did:key
  const didKeySigner: SDLPSigner = {
    did: keys.did_key_identifier,
    kid: `${keys.did_key_identifier}#${keys.did_key_identifier.split(':')[2] ?? 'key'}`,
    privateKeyJwk: keys.ed25519_private_key_jwk,
  };

  const happyPathDidKey = createSDLPLink({
    payload: 'Hello, World!',
    payloadType: 'text/plain' as PayloadType,
    signer: didKeySigner,
  });

  vectors.push({
    description: 'Happy path with did:key - A valid link signed with a did:key',
    link: happyPathDidKey,
    expected: {
      valid: true,
      payload: 'Hello, World!',
      payloadType: 'text/plain' as PayloadType,
      senderDid: keys.did_key_identifier,
      error: null,
    },
  });

  // Test case 2: Happy path with did:web
  const didWebSigner: SDLPSigner = {
    did: keys.did_web_identifier,
    kid: `${keys.did_web_identifier}#key-1`,
    privateKeyJwk: keys.ed25519_private_key_jwk,
  };

  const happyPathDidWeb = createSDLPLink({
    payload: 'Hello from ACME Corp!',
    payloadType: 'text/plain' as PayloadType,
    signer: didWebSigner,
  });

  vectors.push({
    description:
      'Happy path with did:web - A valid link signed with a did:web key',
    link: happyPathDidWeb,
    expected: {
      valid: true,
      payload: 'Hello from ACME Corp!',
      payloadType: 'text/plain' as PayloadType,
      senderDid: keys.did_web_identifier,
      error: null,
    },
  });

  // Test case 3: Invalid signature (manipulate the signature)
  const validLink = createSDLPLink({
    payload: 'Test payload',
    payloadType: 'text/plain' as PayloadType,
    signer: didKeySigner,
  });

  // Parse and manipulate the signature
  const [scheme, rest] = validLink.split('://');
  if (!scheme || !rest) {
    throw new Error('Invalid link format');
  }

  const [jwsPart, payloadPart] = rest.split('.');
  if (!jwsPart || !payloadPart) {
    throw new Error('Invalid link format');
  }

  const jwsObject = JSON.parse(
    base64urlDecode(jwsPart).toString()
  ) as JWSCompactSerialization;

  // Corrupt the signature by changing the last character
  const lastChar = jwsObject.signature.slice(-1);
  const corruptedSignature =
    jwsObject.signature.slice(0, -1) + (lastChar === 'A' ? 'B' : 'A');
  const corruptedJwsObject: JWSCompactSerialization = {
    ...jwsObject,
    signature: corruptedSignature,
  };

  const corruptedJWS = base64urlEncode(JSON.stringify(corruptedJwsObject));
  const invalidSignatureLink =
    `${scheme}://${corruptedJWS}.${payloadPart}` as SDLPLinkString;

  vectors.push({
    description:
      'Invalid signature - A link with valid structure but manipulated signature',
    link: invalidSignatureLink,
    expected: {
      valid: false,
      payload: null,
      payloadType: null,
      senderDid: null,
      error: 'INVALID_SIGNATURE',
    },
  });

  // Test case 4: Payload tampering (alter the payload to cause checksum mismatch)
  const validLink2 = createSDLPLink({
    payload: 'Original payload',
    payloadType: 'text/plain' as PayloadType,
    signer: didKeySigner,
  });

  const [scheme2, rest2] = validLink2.split('://');
  if (!scheme2 || !rest2) {
    throw new Error('Invalid link format');
  }

  const [jwsPart2, payloadPart2] = rest2.split('.');
  if (!jwsPart2 || !payloadPart2) {
    throw new Error('Invalid link format');
  }

  // Create a different payload but keep the same JWS (which has the original checksum)
  const tamperedPayload = base64urlEncode(
    Buffer.from('Tampered payload', 'utf8')
  );
  const tamperedLink =
    `${scheme2}://${jwsPart2}.${tamperedPayload}` as SDLPLinkString;

  vectors.push({
    description:
      'Payload tampering - A link with valid signature but altered payload causing checksum mismatch',
    link: tamperedLink,
    expected: {
      valid: false,
      payload: null,
      payloadType: null,
      senderDid: null,
      error: 'PAYLOAD_CHECKSUM_MISMATCH',
    },
  });

  // Test case 5: Expired link
  const expiredLink = createSDLPLink({
    payload: 'Expired content',
    payloadType: 'text/plain' as PayloadType,
    signer: didKeySigner,
    expiresIn: -3600, // Expired 1 hour ago
  });

  vectors.push({
    description:
      'Expired link - A validly signed link where the exp timestamp is in the past',
    link: expiredLink,
    expected: {
      valid: false,
      payload: null,
      payloadType: null,
      senderDid: null,
      error: 'LINK_EXPIRED',
    },
  });

  return vectors as SDLPTestVectorSuite;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
SDLP Test Vector Generator

Usage:
  tsx generate-test-vectors.ts [--output <file>]
  npm run generate-vectors [-- --output <file>]
  
Options:
  --output <file>   Output file path (default: ../mvp-test-vectors.json)
  --help           Show this help message

Examples:
  tsx generate-test-vectors.ts
  tsx generate-test-vectors.ts --output my-vectors.json
  npm run generate-vectors
  npm run generate-vectors -- --output my-vectors.json
`);
    process.exit(0);
  }

  // Parse output option
  let outputPath = path.join(__dirname, '..', 'mvp-test-vectors.json');
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    const outputArgument = args[outputIndex + 1];
    if (!outputArgument) {
      throw new Error('Output path argument is required after --output');
    }
    outputPath = path.resolve(outputArgument);
  }

  try {
    console.log('Generating test vectors...');
    const testVectors = generateTestVectors();

    fs.writeFileSync(outputPath, JSON.stringify(testVectors, null, 2));
    console.log(`✅ Test vectors generated successfully!`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📊 Generated ${testVectors.length} test vectors`);

    // Print summary
    console.log('\n📋 Test Vector Summary:');
    testVectors.forEach((vector, index) => {
      const status = vector.expected.valid ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${vector.description}`);
    });
  } catch (error) {
    console.error(
      '❌ Error generating test vectors:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    if (process.env.DEBUG) {
      console.error(error instanceof Error ? error.stack : error);
    }
    process.exit(1);
  }
}
