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
 * Implements standardized error codes as defined in the SDLP specification
 */
export abstract class SdlpError extends Error {
  abstract readonly code: string;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown> | undefined;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
  }
}

// ===== Structural Errors =====

/**
 * Error for invalid SDLP link structure
 * Corresponds to E_INVALID_STRUCTURE in the specification
 */
export class InvalidStructureError extends SdlpError {
  readonly code = 'E_INVALID_STRUCTURE';

  constructor(reason: string, context?: Record<string, unknown>) {
    super(`Invalid SDLP link structure: ${reason}`, context);
  }
}

// ===== Cryptographic Errors =====

/**
 * Error for signature verification failures
 * Corresponds to E_SIGNATURE_VERIFICATION_FAILED in the specification
 */
export class SignatureVerificationError extends SdlpError {
  readonly code = 'E_SIGNATURE_VERIFICATION_FAILED';

  constructor(reason?: string, context?: Record<string, unknown>) {
    super(reason ?? 'JWS signature verification failed', context);
  }
}

/**
 * Error for missing or invalid key identifiers
 * Corresponds to E_KEY_NOT_FOUND in the specification
 */
export class KeyNotFoundError extends SdlpError {
  readonly code = 'E_KEY_NOT_FOUND';

  constructor(kid: string, reason?: string, context?: Record<string, unknown>) {
    super(
      `Key not found: ${kid}${reason !== null && reason !== undefined ? ` - ${reason}` : ''}`,
      context
    );
  }
}

// ===== Identity Resolution Errors =====

/**
 * Error for DID resolution failures
 * Corresponds to E_DID_RESOLUTION_FAILED in the specification
 */
export class DIDResolutionError extends SdlpError {
  readonly code = 'E_DID_RESOLUTION_FAILED';

  constructor(
    didUrl: string,
    reason: string,
    context?: Record<string, unknown>
  ) {
    super(`Failed to resolve DID '${didUrl}': ${reason}`, context);
  }
}

/**
 * Error for DID mismatch between sid and kid
 * Corresponds to E_DID_MISMATCH in the specification
 */
export class DIDMismatchError extends SdlpError {
  readonly code = 'E_DID_MISMATCH';

  constructor(sid: string, kid: string, context?: Record<string, unknown>) {
    super(
      `DID mismatch: sid='${sid}' does not match kid base DID='${kid}'`,
      context
    );
  }
}

// ===== Payload Processing Errors =====

/**
 * Error for payload decompression failures
 * Corresponds to E_PAYLOAD_DECOMPRESSION_FAILED in the specification
 */
export class PayloadDecompressionError extends SdlpError {
  readonly code = 'E_PAYLOAD_DECOMPRESSION_FAILED';

  constructor(
    algorithm: string,
    reason?: string,
    context?: Record<string, unknown>
  ) {
    super(
      `Payload decompression failed (${algorithm})${reason !== null && reason !== undefined ? `: ${reason}` : ''}`,
      context
    );
  }
}

/**
 * Error for payload integrity check failures
 * Corresponds to E_PAYLOAD_INTEGRITY_FAILED in the specification
 */
export class PayloadIntegrityError extends SdlpError {
  readonly code = 'E_PAYLOAD_INTEGRITY_FAILED';

  constructor(
    expected: string,
    actual: string,
    context?: Record<string, unknown>
  ) {
    super(
      `Payload integrity check failed: expected=${expected}, actual=${actual}`,
      context
    );
  }
}

// ===== Time Validation Errors =====

/**
 * Error for time bounds violations (exp/nbf)
 * Corresponds to E_TIME_BOUNDS_VIOLATED in the specification
 */
export class TimeBoundsViolatedError extends SdlpError {
  readonly code = 'E_TIME_BOUNDS_VIOLATED';

  constructor(reason: string, context?: Record<string, unknown>) {
    super(`Time bounds violated: ${reason}`, context);
  }

  static expired(expiration: number): TimeBoundsViolatedError {
    return new TimeBoundsViolatedError(
      `Link expired at ${new Date(expiration * 1000).toISOString()}`,
      { expiration, currentTime: Math.floor(Date.now() / 1000) }
    );
  }

  static notYetValid(notBefore: number): TimeBoundsViolatedError {
    return new TimeBoundsViolatedError(
      `Link not valid until ${new Date(notBefore * 1000).toISOString()}`,
      { notBefore, currentTime: Math.floor(Date.now() / 1000) }
    );
  }
}

// ===== Replay Protection Errors =====

/**
 * Error for detected replay attacks
 * Corresponds to E_REPLAY_DETECTED in the specification
 */
export class ReplayDetectedError extends SdlpError {
  readonly code = 'E_REPLAY_DETECTED';

  constructor(jti: string, context?: Record<string, unknown>) {
    super(`Replay detected: JWT ID '${jti}' has been seen before`, context);
  }
}

// ===== Legacy Error Classes (for backward compatibility) =====

/**
 * @deprecated Use InvalidStructureError instead
 */
export class InvalidLinkFormatError extends SdlpError {
  readonly code = 'INVALID_LINK_FORMAT';

  constructor(reason: string) {
    super(`Invalid link format: ${reason}`);
  }
}

/**
 * @deprecated Use InvalidStructureError instead
 */
export class InvalidJWSFormatError extends SdlpError {
  readonly code = 'INVALID_JWS_FORMAT';

  constructor(reason: string) {
    super(`Invalid JWS format: ${reason}`);
  }
}

/**
 * @deprecated Use SignatureVerificationError instead
 */
export class InvalidSignatureError extends SdlpError {
  readonly code = 'INVALID_SIGNATURE';

  constructor(message?: string) {
    super(message ?? 'Invalid signature');
  }
}

/**
 * @deprecated Use PayloadIntegrityError instead
 */
export class PayloadChecksumMismatchError extends SdlpError {
  readonly code = 'PAYLOAD_CHECKSUM_MISMATCH';

  constructor(expected: string, actual: string) {
    super(`Payload checksum mismatch: expected=${expected}, actual=${actual}`);
  }
}

/**
 * @deprecated Use TimeBoundsViolatedError.expired() instead
 */
export class LinkExpiredError extends SdlpError {
  readonly code = 'LINK_EXPIRED';

  constructor(expiration: number) {
    super(`Link expired at ${new Date(expiration * 1000).toISOString()}`);
  }
}

/**
 * @deprecated Use TimeBoundsViolatedError.notYetValid() instead
 */
export class LinkNotYetValidError extends SdlpError {
  readonly code = 'LINK_NOT_YET_VALID';

  constructor(notBefore: number) {
    super(`Link not valid until ${new Date(notBefore * 1000).toISOString()}`);
  }
}

/**
 * @deprecated Use PayloadDecompressionError instead
 */
export class UnsupportedCompressionError extends SdlpError {
  readonly code = 'UNSUPPORTED_COMPRESSION';

  constructor(compression: string) {
    super(`Unsupported compression algorithm: ${compression}`);
  }
}

/**
 * Legacy DIDResolutionError for backward compatibility
 * Note: This maintains the old error code for existing tests
 */
export class LegacyDIDResolutionError extends SdlpError {
  readonly code = 'DID_RESOLUTION_FAILED';

  constructor(didUrl: string, reason: string) {
    super(`Failed to resolve DID '${didUrl}': ${reason}`);
    this.name = 'DIDResolutionError';
  }
}

/**
 * Legacy DIDMismatchError for backward compatibility
 * Note: This maintains the old error code for existing tests
 */
export class LegacyDIDMismatchError extends SdlpError {
  readonly code = 'DID_MISMATCH';

  constructor(sid: string, kid: string) {
    super(`DID mismatch: sid='${sid}' does not match kid base DID='${kid}'`);
    this.name = 'DIDMismatchError';
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
