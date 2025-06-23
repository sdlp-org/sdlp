/**
 * SDLP SDK v1.0 - Secure Deep Link Protocol TypeScript Reference Library
 *
 * This library provides the core functionality for creating and verifying
 * Secure Deep Links according to the SDLP v1.0 specification.
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
