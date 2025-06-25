# SDLP SDK API Reference

This document provides comprehensive API documentation for the SDLP SDK TypeScript library.

## Table of Contents

- [Overview](#overview)
- [Main Functions](#main-functions)
  - [createLink](#createlink)
  - [verifyLink](#verifylink)
- [Types and Interfaces](#types-and-interfaces)
  - [Core Types](#core-types)
  - [DID Resolution Types](#did-resolution-types)
- [Error Classes](#error-classes)
- [Compression Functions](#compression-functions)
- [Usage Examples](#usage-examples)

## Overview

The SDLP SDK provides a TypeScript implementation of the Secure Deep Link Protocol (SDLP) v1.0 specification. It enables the creation and verification of cryptographically signed deep links with support for:

- **Cryptographic Signatures**: EdDSA signatures with JWS Flattened JSON Serialization
- **DID-based Identity**: Support for `did:key` and `did:web` methods
- **Payload Compression**: Built-in Brotli compression for efficient transmission
- **Security Controls**: Comprehensive validation including integrity, time bounds, and algorithm agility
- **Cross-platform**: Works in both Node.js and browser environments

## Main Functions

### createLink

Creates and signs a Secure Deep Link according to SDLP v1.0 specification.

```typescript
function createLink(params: CreateLinkParameters): Promise<string>;
```

#### Parameters

- **params** (`CreateLinkParameters`): Configuration object containing:
  - **payload** (`Uint8Array`): The raw payload data to include in the link
  - **payloadType** (`string`): MIME type of the payload (e.g., "application/json")
  - **signer** (`Signer`): Signer information including private key and DID URL
  - **compress** (`"br" | "none"`, optional): Compression algorithm (default: "none")
  - **expiresIn** (`number`, optional): Expiration time in seconds from now

#### Returns

`Promise<string>` - A complete SDLP link string (e.g., "sdlp://...")

#### Throws

- `Error` - When the signer's kid is not a valid DID URL format
- `Error` - When an unsupported compression algorithm is specified

#### Example

```typescript
import { createLink } from '@sdlp/sdk';

const link = await createLink({
  payload: new TextEncoder().encode('{"message": "Hello World"}'),
  payloadType: 'application/json',
  signer: {
    kid: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1',
    privateKeyJwk: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: 'O2onvM62pC1io6jQKm8Nc2UyFXcd4kOmOsBIoYtZ2ik',
      d: 'nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A',
    },
  },
  compress: 'br',
  expiresIn: 3600, // 1 hour
});
```

### verifyLink

Verifies a Secure Deep Link with comprehensive security validation.

```typescript
function verifyLink(
  link: string,
  options?: VerifyOptions
): Promise<VerificationResult>;
```

#### Parameters

- **link** (`string`): The SDLP link string to verify (e.g., "sdlp://...")
- **options** (`VerifyOptions`, optional): Verification options:
  - **resolver** (`DIDResolver`, optional): Custom DID resolver (defaults to did:key and did:web support)
  - **allowedAlgorithms** (`string[]`, optional): Allowed signature algorithms (default: ['EdDSA'])
  - **maxPayloadSize** (`number`, optional): Maximum payload size in bytes (default: 10MB)

#### Returns

`Promise<VerificationResult>` - Discriminated union result:

- **Success**: `{ valid: true, sender, payload, metadata, didDocument? }`
- **Failure**: `{ valid: false, error }`

#### Throws

- `TypeError` - When input parameters are invalid types

#### Example

```typescript
import { verifyLink } from '@sdlp/sdk';

const result = await verifyLink(
  'sdlp://eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQSJ9...'
);

if (result.valid) {
  console.log('Verified sender:', result.sender);
  console.log('Payload:', new TextDecoder().decode(result.payload));
  console.log('Content type:', result.metadata.type);
} else {
  console.error('Verification failed:', result.error.message);
  console.error('Error code:', result.error.code);
}
```

## Types and Interfaces

### Core Types

#### Signer

Represents the private key and its identifier needed for signing.

```typescript
interface Signer {
  /** DID URL with key fragment, e.g., "did:web:acme.example#key-1" */
  kid: string;
  /** Private key in JWK format */
  privateKeyJwk: Record<string, unknown>;
}
```

#### CreateLinkParameters

Parameters for creating a new Secure Deep Link.

```typescript
interface CreateLinkParameters {
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
```

#### VerifyOptions

Options for verifying a link.

```typescript
interface VerifyOptions {
  /** DID resolver instance for resolving sender DIDs */
  resolver?: DIDResolver;
  /** Allowed signature algorithms (defaults to ['EdDSA']) */
  allowedAlgorithms?: string[];
  /** Maximum decompressed payload size in bytes (defaults to 10MB) */
  maxPayloadSize?: number;
}
```

#### VerificationResult

Type for verification result union.

```typescript
type VerificationResult = VerificationSuccess | VerificationFailure;
```

#### VerificationSuccess

The result of a successful link verification.

```typescript
interface VerificationSuccess {
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
```

#### VerificationFailure

The result of a failed link verification.

```typescript
interface VerificationFailure {
  readonly valid: false;
  /** Structured error with type and details */
  readonly error: SdlpError;
}
```

#### CoreMetadata

Core metadata that gets signed in the JWS payload.

```typescript
interface CoreMetadata extends Record<string, unknown> {
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
```

#### JWSProtectedHeader

JWS Protected Header structure.

```typescript
interface JWSProtectedHeader extends Record<string, unknown> {
  /** Signature algorithm */
  alg: 'EdDSA';
  /** Key ID (DID URL) */
  kid: string;
}
```

### DID Resolution Types

#### DIDResolver

Interface for DID resolver.

```typescript
interface DIDResolver {
  /** Resolve a DID to its DID Document */
  resolve(didUrl: string): Promise<DIDResolutionResult>;
}
```

#### DIDResolutionResult

Result of DID resolution.

```typescript
interface DIDResolutionResult {
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
```

#### DIDDocument

DID Document interface for resolved DID documents.

```typescript
interface DIDDocument {
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
```

## Error Classes

All SDLP errors extend the base `SdlpError` class and include standardized error codes as defined in the SDLP specification. Each error includes a timestamp and optional context for debugging.

### SdlpError

Base class for all SDLP-specific errors.

```typescript
abstract class SdlpError extends Error {
  abstract readonly code: string;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;
}
```

### Standardized Error Types

The SDK implements the standardized error codes defined in the SDLP specification:

#### Structural Errors

| Error Class             | Code                  | Description                          |
| ----------------------- | --------------------- | ------------------------------------ |
| `InvalidStructureError` | `E_INVALID_STRUCTURE` | Link does not conform to SDLP format |

#### Cryptographic Errors

| Error Class                  | Code                              | Description                                |
| ---------------------------- | --------------------------------- | ------------------------------------------ |
| `SignatureVerificationError` | `E_SIGNATURE_VERIFICATION_FAILED` | JWS signature is cryptographically invalid |
| `KeyNotFoundError`           | `E_KEY_NOT_FOUND`                 | Key identifier cannot be located           |

#### Identity Resolution Errors

| Error Class          | Code                      | Description                        |
| -------------------- | ------------------------- | ---------------------------------- |
| `DIDResolutionError` | `E_DID_RESOLUTION_FAILED` | Sender's DID cannot be resolved    |
| `DIDMismatchError`   | `E_DID_MISMATCH`          | DID in sid does not match kid base |

#### Payload Processing Errors

| Error Class                 | Code                             | Description                          |
| --------------------------- | -------------------------------- | ------------------------------------ |
| `PayloadDecompressionError` | `E_PAYLOAD_DECOMPRESSION_FAILED` | Payload cannot be decompressed       |
| `PayloadIntegrityError`     | `E_PAYLOAD_INTEGRITY_FAILED`     | Payload checksum verification failed |

#### Time Validation Errors

| Error Class               | Code                     | Description                          |
| ------------------------- | ------------------------ | ------------------------------------ |
| `TimeBoundsViolatedError` | `E_TIME_BOUNDS_VIOLATED` | Link violates time-based constraints |

#### Replay Protection Errors

| Error Class           | Code                | Description                    |
| --------------------- | ------------------- | ------------------------------ |
| `ReplayDetectedError` | `E_REPLAY_DETECTED` | Link has been processed before |

### Legacy Error Classes (Deprecated)

For backward compatibility, the following legacy error classes are still available but deprecated:

| Legacy Error Class             | New Error Class              | Status     |
| ------------------------------ | ---------------------------- | ---------- |
| `InvalidLinkFormatError`       | `InvalidStructureError`      | Deprecated |
| `InvalidJWSFormatError`        | `InvalidStructureError`      | Deprecated |
| `InvalidSignatureError`        | `SignatureVerificationError` | Deprecated |
| `PayloadChecksumMismatchError` | `PayloadIntegrityError`      | Deprecated |
| `LinkExpiredError`             | `TimeBoundsViolatedError`    | Deprecated |
| `LinkNotYetValidError`         | `TimeBoundsViolatedError`    | Deprecated |
| `UnsupportedCompressionError`  | `PayloadDecompressionError`  | Deprecated |

### Error Handling Example

```typescript
import { verifyLink, SdlpError } from '@sdlp/sdk';

try {
  const result = await verifyLink(link);
  if (!result.valid) {
    switch (result.error.code) {
      case 'E_TIME_BOUNDS_VIOLATED':
        console.log('Link has expired or is not yet valid');
        break;
      case 'E_SIGNATURE_VERIFICATION_FAILED':
        console.log('Signature verification failed');
        break;
      case 'E_DID_RESOLUTION_FAILED':
        console.log('Could not resolve sender DID');
        break;
      case 'E_PAYLOAD_INTEGRITY_FAILED':
        console.log('Payload has been tampered with');
        break;
      case 'E_INVALID_STRUCTURE':
        console.log('Link format is invalid');
        break;
      default:
        console.log('Verification failed:', result.error.message);
    }
  }
} catch (error) {
  if (error instanceof SdlpError) {
    console.error('SDLP Error:', error.code, error.message);
    if (error.context) {
      console.error('Context:', error.context);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Compression Functions

### compressBrotli

Compress data using Brotli compression algorithm.

```typescript
function compressBrotli(data: Uint8Array): Promise<Uint8Array>;
```

#### Parameters

- **data** (`Uint8Array`): The raw data to compress

#### Returns

`Promise<Uint8Array>` - The compressed data

#### Example

```typescript
import { compressBrotli } from '@sdlp/sdk';

const payload = new TextEncoder().encode('{"message": "Hello, World!"}');
const compressed = await compressBrotli(payload);
console.log(
  `Original: ${payload.length} bytes, Compressed: ${compressed.length} bytes`
);
```

### decompressBrotli

Decompress Brotli-compressed data back to its original form.

```typescript
function decompressBrotli(compressedData: Uint8Array): Promise<Uint8Array>;
```

#### Parameters

- **compressedData** (`Uint8Array`): The Brotli-compressed data to decompress

#### Returns

`Promise<Uint8Array>` - The original uncompressed data

#### Throws

- `Error` - When the compressed data is invalid or corrupted

#### Example

```typescript
import { compressBrotli, decompressBrotli } from '@sdlp/sdk';

const original = new TextEncoder().encode('Hello, World!');
const compressed = await compressBrotli(original);
const decompressed = await decompressBrotli(compressed);
// decompressed should be identical to original
```

## Usage Examples

### Basic Link Creation and Verification

```typescript
import { createLink, verifyLink } from '@sdlp/sdk';

// Create a key pair (in practice, use proper key generation)
const signer = {
  kid: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1',
  privateKeyJwk: {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'O2onvM62pC1io6jQKm8Nc2UyFXcd4kOmOsBIoYtZ2ik',
    d: 'nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A',
  },
};

// Create a signed link
const payload = new TextEncoder().encode(
  JSON.stringify({
    action: 'open-document',
    documentId: 'doc-123',
    permissions: ['read', 'write'],
  })
);

const link = await createLink({
  payload,
  payloadType: 'application/json',
  signer,
  compress: 'br',
  expiresIn: 3600, // 1 hour
});

console.log('Created SDLP link:', link);

// Verify the link
const result = await verifyLink(link);

if (result.valid) {
  console.log('✅ Link verified successfully!');
  console.log('Sender DID:', result.sender);
  console.log('Content Type:', result.metadata.type);

  const data = JSON.parse(new TextDecoder().decode(result.payload));
  console.log('Action:', data.action);
  console.log('Document ID:', data.documentId);
} else {
  console.error('❌ Verification failed:', result.error.message);
}
```

### Custom DID Resolver

```typescript
import { verifyLink } from '@sdlp/sdk';
import { Resolver } from 'did-resolver';
import { getResolver as getEthrResolver } from 'ethr-did-resolver';

// Create custom resolver with additional DID methods
const customResolver = new Resolver({
  ...getEthrResolver({ infuraProjectId: 'your-project-id' }),
  // Add other DID method resolvers as needed
});

const result = await verifyLink(link, {
  resolver: customResolver,
  allowedAlgorithms: ['EdDSA', 'ES256K'], // Allow additional algorithms
  maxPayloadSize: 5 * 1024 * 1024, // 5MB limit
});
```

### Error Handling with Specific Error Types

```typescript
import { verifyLink, LinkExpiredError, InvalidSignatureError } from '@sdlp/sdk';

const result = await verifyLink(link);

if (!result.valid) {
  if (result.error instanceof LinkExpiredError) {
    console.log('Link has expired, please request a new one');
  } else if (result.error instanceof InvalidSignatureError) {
    console.log('Link signature is invalid, possible tampering detected');
  } else {
    console.log('Verification failed:', result.error.message);
  }
}
```

### Payload Size Limits

```typescript
import { verifyLink } from '@sdlp/sdk';

const result = await verifyLink(link, {
  maxPayloadSize: 1024 * 1024, // 1MB limit
});

if (!result.valid && result.error.code === 'PAYLOAD_TOO_LARGE') {
  console.error('Payload exceeds size limit');
}
```

## Security Considerations

1. **Algorithm Agility**: Always specify `allowedAlgorithms` in production to prevent downgrade attacks
2. **Payload Size Limits**: Set appropriate `maxPayloadSize` limits to prevent decompression bomb attacks
3. **DID Resolution**: Use trusted DID resolvers and implement proper caching with respect to Cache-Control headers
4. **Key Management**: Store private keys securely and rotate them regularly
5. **Time Validation**: Always validate link expiration times in security-sensitive contexts
6. **Input Validation**: The SDK performs comprehensive input validation, but always validate payloads before processing in your application

## Browser Compatibility

The library works in both Node.js and browser environments:

- **Node.js**: Uses built-in `zlib` for Brotli compression (Node.js 12+)
- **Browser**: Uses `brotli-wasm` for Brotli compression support

## Performance Considerations

- **Compression**: Brotli compression provides excellent compression ratios but has CPU overhead
- **DID Resolution**: Network-dependent for `did:web` identities; implement caching for production use
- **Payload Size**: Larger payloads increase processing time and memory usage
- **Key Operations**: Ed25519 operations are fast, but avoid unnecessary key imports

## Version Compatibility

This API documentation is for SDLP SDK v1.0, which implements the SDLP v1.0 specification. The library follows semantic versioning:

- **Major versions**: Breaking API changes
- **Minor versions**: New features, backward compatible
- **Patch versions**: Bug fixes, backward compatible
