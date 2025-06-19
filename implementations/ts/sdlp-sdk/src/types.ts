/**
 * Represents the private key and its identifier needed for signing.
 */
export interface Signer {
  /** DID URL with key fragment, e.g., "did:web:acme.example#key-1" */
  kid: string;
  /** Private key in JWK format */
  privateKeyJwk: Record<string, unknown>;
}

/**
 * Parameters for creating a new Secure Deep Link.
 */
export interface CreateLinkParameters {
  /** The payload data to include in the link */
  payload: Uint8Array;
  /** MIME type of the payload, e.g., "application/json" */
  payloadType: string;
  /** Signer information including private key and key ID */
  signer: Signer;
  /** Compression algorithm to use. Defaults to 'none' for MVP */
  compress?: 'br' | 'none';
  /** Optional expiration time in seconds from now */
  expiresIn?: number;
}

/**
 * DID Document interface for resolved DID documents
 */
export interface DIDDocument {
  /** DID subject */
  id: string;
  /** Verification methods (public keys) */
  verificationMethod?: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk?: Record<string, unknown>;
    publicKeyMultibase?: string;
    publicKeyBase58?: string;
  }>;
  /** Additional DID document properties */
  [key: string]: unknown;
}

/**
 * The result of a successful link verification.
 */
export interface VerificationSuccess {
  readonly valid: true;
  /** The verified sender DID (from 'sid') */
  readonly sender: string;
  /** The original payload data */
  readonly payload: Uint8Array;
  /** Core metadata from the verified link */
  readonly metadata: CoreMetadata;
  /** The resolved DID Document (optional) */
  readonly didDocument?: DIDDocument;
}

/**
 * The result of a failed link verification.
 */
export interface VerificationFailure {
  readonly valid: false;
  /** Structured error with type and details */
  readonly error: SdlpError;
}

/**
 * Structured error class hierarchy for SDLP errors
 */
export abstract class SdlpError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error for DID mismatch between sid and kid
 */
export class DIDMismatchError extends SdlpError {
  readonly code = 'DID_MISMATCH';

  constructor(sid: string, kid: string) {
    super(`DID mismatch: sid='${sid}' does not match kid base DID='${kid}'`);
  }
}

/**
 * Error for invalid JWS format
 */
export class InvalidJWSFormatError extends SdlpError {
  readonly code = 'INVALID_JWS_FORMAT';

  constructor(reason: string) {
    super(`Invalid JWS format: ${reason}`);
  }
}

/**
 * Error for invalid signature
 */
export class InvalidSignatureError extends SdlpError {
  readonly code = 'INVALID_SIGNATURE';

  constructor(message?: string) {
    super(message ?? 'Invalid signature');
  }
}

/**
 * Error for payload checksum mismatch
 */
export class PayloadChecksumMismatchError extends SdlpError {
  readonly code = 'PAYLOAD_CHECKSUM_MISMATCH';

  constructor(expected: string, actual: string) {
    super(`Payload checksum mismatch: expected=${expected}, actual=${actual}`);
  }
}

/**
 * Error for expired links
 */
export class LinkExpiredError extends SdlpError {
  readonly code = 'LINK_EXPIRED';

  constructor(expiration: number) {
    super(`Link expired at ${new Date(expiration * 1000).toISOString()}`);
  }
}

/**
 * Error for links not yet valid
 */
export class LinkNotYetValidError extends SdlpError {
  readonly code = 'LINK_NOT_YET_VALID';

  constructor(notBefore: number) {
    super(`Link not valid until ${new Date(notBefore * 1000).toISOString()}`);
  }
}

/**
 * Error for unsupported compression
 */
export class UnsupportedCompressionError extends SdlpError {
  readonly code = 'UNSUPPORTED_COMPRESSION';

  constructor(compression: string) {
    super(`Unsupported compression algorithm: ${compression}`);
  }
}

/**
 * Error for DID resolution failures
 */
export class DIDResolutionError extends SdlpError {
  readonly code = 'DID_RESOLUTION_FAILED';

  constructor(didUrl: string, reason: string) {
    super(`Failed to resolve DID '${didUrl}': ${reason}`);
  }
}

/**
 * Error for invalid link format
 */
export class InvalidLinkFormatError extends SdlpError {
  readonly code = 'INVALID_LINK_FORMAT';

  constructor(reason: string) {
    super(`Invalid link format: ${reason}`);
  }
}

/**
 * Core metadata that gets signed in the JWS payload
 */
export interface CoreMetadata extends Record<string, unknown> {
  /** Protocol version */
  v: string;
  /** Sender DID */
  sid: string;
  /** Payload MIME type */
  type: string;
  /** Compression algorithm used */
  comp: 'br' | 'none';
  /** SHA-256 checksum of the original payload */
  chk: string;
  /** Optional expiration timestamp (Unix epoch) */
  exp?: number;
  /** Optional not-before timestamp (Unix epoch) */
  nbf?: number;
}

/**
 * JWS Protected Header
 */
export interface JWSProtectedHeader extends Record<string, unknown> {
  /** Signature algorithm */
  alg: 'EdDSA';
  /** Key ID (DID URL) */
  kid: string;
}

/**
 * Type for verification result union
 */
export type VerificationResult = VerificationSuccess | VerificationFailure;

/**
 * Options for verifying a link
 */
export interface VerifyOptions {
  /** DID resolver instance for resolving sender DIDs */
  resolver?: DIDResolver;
  /** Allowed signature algorithms (defaults to ['EdDSA']) */
  allowedAlgorithms?: string[];
  /** Maximum decompressed payload size in bytes (defaults to 10MB) */
  maxPayloadSize?: number;
}

/**
 * Interface for DID resolver
 */
export interface DIDResolver {
  /** Resolve a DID to its DID Document */
  // eslint-disable-next-line no-unused-vars
  resolve(didUrl: string): Promise<DIDResolutionResult>;
}

/**
 * Result of DID resolution
 */
export interface DIDResolutionResult {
  /** The resolved DID Document */
  didDocument: DIDDocument | null;
  /** Resolution metadata */
  didResolutionMetadata: {
    error?: string;
    contentType?: string;
  };
  /** Document metadata */
  didDocumentMetadata: Record<string, unknown>;
}
