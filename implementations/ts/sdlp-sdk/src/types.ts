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
  compress?: "br" | "none";
  /** Optional expiration time in seconds from now */
  expiresIn?: number;
}

/**
 * The result of a successful link verification.
 */
export interface VerificationResult {
  valid: true;
  /** The original payload data */
  payload: Uint8Array;
  /** MIME type of the payload */
  payloadType: string;
  /** Metadata extracted from the verified link */
  metadata: {
    /** Signer DID from the 'sid' field */
    signerDid: string;
    /** Key ID from the 'kid' field */
    keyId: string;
    /** Protocol version */
    version?: string | undefined;
    /** Expiration timestamp */
    expiration?: number | undefined;
    /** Not before timestamp */
    notBefore?: number | undefined;
  };
}

/**
 * The result of a failed link verification.
 */
export interface VerificationFailure {
  valid: false;
  /** Error code indicating the type of failure */
  error:
    | "INVALID_LINK_FORMAT"
    | "DID_RESOLUTION_FAILED"
    | "INVALID_SIGNATURE"
    | "PAYLOAD_CHECKSUM_MISMATCH"
    | "LINK_EXPIRED"
    | "UNSUPPORTED_COMPRESSION";
  /** Additional error details */
  details?: string;
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
  comp: "br" | "none";
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
  alg: "EdDSA";
  /** Key ID (DID URL) */
  kid: string;
}

/**
 * Type for verification result union
 */
export type VerificationResultUnion = VerificationResult | VerificationFailure;
