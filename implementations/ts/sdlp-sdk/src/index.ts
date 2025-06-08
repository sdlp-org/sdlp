/**
 * SDLP SDK - Secure Deep Link Protocol TypeScript Reference Library
 *
 * This library provides the core functionality for creating and verifying
 * Secure Deep Links according to the SDLP specification.
 */

// Export main functions
export { createLink } from "./create-link.js";
export { verifyLink } from "./verify-link.js";

// Export types
export type {
  Signer,
  CreateLinkParams,
  VerificationResult,
  VerificationFailure,
  VerificationResultUnion,
  CoreMetadata,
  JWSProtectedHeader,
} from "./types.js";

// Export DID resolution utilities (for advanced use cases)
export { resolveDid, extractDidFromKid } from "./did-resolver.js";
export type { DidDocument, VerificationMethod } from "./did-resolver.js";
