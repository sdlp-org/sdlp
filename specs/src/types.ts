/**
 * Type definitions for the Secure Deep Link Protocol (SDLP)
 * Based on the specification in sdlp-v0.1-draft.md
 */

// JWK (JSON Web Key) types
export interface Ed25519PrivateKeyJWK {
  readonly kty: 'OKP';
  readonly crv: 'Ed25519';
  readonly d: string; // base64url-encoded private key
  readonly x: string; // base64url-encoded public key
}

export interface Ed25519PublicKeyJWK {
  readonly kty: 'OKP';
  readonly crv: 'Ed25519';
  readonly x: string; // base64url-encoded public key
}

// DID types
export type DIDMethod = 'key' | 'web';
export type DIDIdentifier = `did:${DIDMethod}:${string}`;
export type DIDKeyIdentifier = `did:key:${string}`;
export type DIDWebIdentifier = `did:web:${string}`;

// JWS types
export interface JWSProtectedHeader {
  readonly alg: 'EdDSA';
  readonly kid: string; // Key identifier (DID + fragment)
}

export interface JWSCompactSerialization {
  readonly protected: string; // base64url-encoded protected header
  readonly payload: string; // base64url-encoded payload
  readonly signature: string; // base64url-encoded signature
}

// SDLP Core types
export type SDLPVersion = 'SDL-1.0';
export type CompressionAlgorithm = 'none' | 'gzip' | 'brotli';
export type PayloadType = `${string}/${string}`; // MIME type

export interface SDLPCoreMetadata {
  readonly v: SDLPVersion;
  readonly sid: DIDIdentifier; // Sender ID
  readonly type: PayloadType;
  readonly comp: CompressionAlgorithm;
  readonly chk: string; // SHA-256 checksum (hex)
  readonly exp?: number; // Unix timestamp
  readonly nbf?: number; // Not before Unix timestamp
}

export interface SDLPLink {
  readonly scheme: 'sdlp';
  readonly jws: JWSCompactSerialization;
  readonly payload: string; // base64url-encoded compressed payload
}

export type SDLPLinkString = `sdlp://${string}.${string}`;

// Signer configuration
export interface SDLPSigner {
  readonly did: DIDIdentifier;
  readonly kid: string; // Key ID (DID + fragment)
  readonly privateKeyJwk: Ed25519PrivateKeyJWK;
}

// Link creation parameters
export interface CreateSDLPLinkParameters {
  readonly payload: string;
  readonly payloadType: PayloadType;
  readonly signer: SDLPSigner;
  readonly compress?: CompressionAlgorithm;
  readonly expiresIn?: number; // Seconds from now
  readonly notBefore?: number; // Unix timestamp
}

// Verification results
export interface SDLPVerificationResult {
  readonly valid: boolean;
  readonly payload: string | null;
  readonly payloadType: PayloadType | null;
  readonly senderDid: DIDIdentifier | null;
  readonly error: SDLPError | null;
  readonly metadata?: SDLPCoreMetadata;
}

// Error types
export type SDLPError =
  | 'INVALID_SCHEME'
  | 'INVALID_FORMAT'
  | 'INVALID_JWS'
  | 'INVALID_SIGNATURE'
  | 'PAYLOAD_CHECKSUM_MISMATCH'
  | 'LINK_EXPIRED'
  | 'LINK_NOT_YET_VALID'
  | 'UNSUPPORTED_ALGORITHM'
  | 'UNSUPPORTED_COMPRESSION'
  | 'DID_RESOLUTION_FAILED'
  | 'KEY_NOT_FOUND';

// Test vector types
export interface SDLPTestVector {
  readonly description: string;
  readonly link: SDLPLinkString;
  readonly expected: SDLPVerificationResult;
}

export type SDLPTestVectorSuite = readonly SDLPTestVector[];

// Test fixture types
export interface TestKeyFixtures {
  readonly description: string;
  readonly ed25519_private_key_jwk: Ed25519PrivateKeyJWK;
  readonly ed25519_public_key_jwk: Ed25519PublicKeyJWK;
  readonly did_key_identifier: DIDKeyIdentifier;
  readonly did_web_identifier: DIDWebIdentifier;
}

// DID Document types (simplified)
export interface DIDDocument {
  readonly '@context': string;
  readonly id: DIDIdentifier;
  readonly verificationMethod: readonly VerificationMethod[];
  readonly authentication: readonly string[];
  readonly assertionMethod: readonly string[];
  readonly capabilityInvocation?: readonly string[];
  readonly capabilityDelegation?: readonly string[];
}

export interface VerificationMethod {
  readonly id: string;
  readonly type: string;
  readonly controller: DIDIdentifier;
  readonly publicKeyJwk: Ed25519PublicKeyJWK;
}

// Parsed link structure (for debugging)
export interface ParsedSDLPLink {
  readonly valid: boolean;
  readonly error?: string;
  readonly structure?:
    | {
        readonly scheme: string;
        readonly jwsPart: {
          readonly length: number;
          readonly decoded: JWSCompactSerialization;
        };
        readonly payloadPart: {
          readonly length: number;
          readonly sizeBytes: number;
        };
      }
    | undefined;
  readonly jws?:
    | {
        readonly protectedHeader: JWSProtectedHeader;
        readonly coreMetadata: SDLPCoreMetadata;
        readonly signatureLength: number;
      }
    | undefined;
  readonly payload?:
    | {
        readonly raw: Buffer;
        readonly text: string | null;
        readonly encoding: CompressionAlgorithm;
      }
    | undefined;
  readonly metadata?:
    | {
        readonly version: SDLPVersion;
        readonly senderDid: DIDIdentifier;
        readonly payloadType: PayloadType;
        readonly compression: CompressionAlgorithm;
        readonly checksum: string;
        readonly expiration: string | null;
        readonly notBefore: string | null;
      }
    | undefined;
}

// Utility type guards
export const isValidDIDIdentifier = (did: string): did is DIDIdentifier => {
  return /^did:[a-z0-9]+:.+/.test(did);
};

export const isValidSDLPLink = (link: string): link is SDLPLinkString => {
  return /^sdlp:\/\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(link);
};

export const isValidPayloadType = (type: string): type is PayloadType => {
  return /^[a-zA-Z][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.+]*$/.test(
    type
  );
};
