/**
 * SDLP SDK v1.0 - Secure Deep Link Protocol TypeScript Reference Library
 *
 * This library provides the core functionality for creating and verifying
 * Secure Deep Links according to the SDLP v1.0 specification.
 *
 * The Secure Deep Link Protocol (SDLP) enables the creation of cryptographically
 * signed, tamper-evident deep links that can securely transmit structured data
 * between applications. This library provides production-ready tools with:
 *
 * - Cryptographic Signatures: EdDSA signatures with JWS Flattened JSON Serialization
 * - DID-based Identity: Support for did:key and did:web methods
 * - Payload Compression: Built-in Brotli compression for efficient transmission
 * - Security Controls: Comprehensive validation including integrity, time bounds, and algorithm agility
 * - Cross-platform: Works in both Node.js and browser environments
 *
 * @example
 * Basic usage example:
 * ```typescript
 * import { createLink, verifyLink } from '@sdlp/sdk';
 *
 * // Create a signed link
 * const link = await createLink({
 *   payload: new TextEncoder().encode('{"message": "Hello, SDLP!"}'),
 *   payloadType: 'application/json',
 *   signer: {
 *     kid: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1',
 *     privateKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: '...', d: '...' }
 *   }
 * });
 *
 * // Verify a link
 * const result = await verifyLink(link);
 * if (result.valid) {
 *   console.log('Verified sender:', result.sender);
 *   console.log('Payload:', new TextDecoder().decode(result.payload));
 * }
 * ```
 *
 * @packageDocumentation
 */

// Export main functions
export { createLink } from './create-link.js';
export { verifyLink } from './verify-link.js';

// Export types and interfaces
export type {
  // Core types
  Signer,
  CreateLinkParameters,
  VerifyOptions,
  VerificationResult,
  VerificationSuccess,
  VerificationFailure,
  CoreMetadata,
  JWSProtectedHeader,

  // DID resolution types
  DIDResolver,
  DIDResolutionResult,
  DIDDocument,
} from './types.js';

// Export error classes as values
export {
  SdlpError,
  DIDMismatchError,
  InvalidJWSFormatError,
  InvalidSignatureError,
  PayloadChecksumMismatchError,
  LinkExpiredError,
  LinkNotYetValidError,
  UnsupportedCompressionError,
  DIDResolutionError,
  InvalidLinkFormatError,
} from './types.js';

// Export compression functions
export { compressBrotli, decompressBrotli } from './compression.js';
