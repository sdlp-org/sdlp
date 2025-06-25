<div align="center">
  <img src="../../../assets/logo.png" alt="SDLP Logo" width="200"/>
</div>

# SDLP SDK v1.1.0

A TypeScript reference implementation of the Secure Deep Link Protocol (SDLP) v1.0 specification.

## Overview

The Secure Deep Link Protocol (SDLP) enables the creation of cryptographically signed, tamper-evident deep links that can securely transmit structured data between applications. This library provides production-ready tools for creating and verifying SDLP links with support for:

- **🔐 Cryptographic Signatures**: EdDSA signatures with JWS Flattened JSON Serialization
- **🆔 DID-based Identity**: Support for `did:key` and `did:web` methods for sender identification
- **🗜️ Payload Compression**: Built-in Brotli compression support for efficient data transmission
- **🛡️ Security Controls**: Comprehensive validation including payload integrity, time bounds, and algorithm agility
- **🌐 Cross-platform**: Works in both Node.js and browser environments

## Documentation

- **[Complete API Reference](docs/API.md)** - Comprehensive API documentation with examples
- **[Getting Started Guide](../../../GETTING_STARTED.md)** - Step-by-step setup and usage guide
- **[SDLP Specification](../../../specs/sdlp-v0.1-draft.md)** - Protocol specification

## Installation

```bash
npm install @sdlp/sdk
```

## Quick Start

### Creating a Secure Deep Link

```typescript
import { createLink } from '@sdlp/sdk';

// Example payload
const payload = new TextEncoder().encode(
  JSON.stringify({
    action: 'open-document',
    documentId: 'doc-123',
    permissions: ['read', 'write'],
  })
);

// Create a signed link
const link = await createLink({
  payload,
  payloadType: 'application/json',
  signer: {
    kid: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    privateKeyJwk: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: 'O2onvM62pC1io6jQKm8Nc2UyFXcd4kOmOsBIoYtZ2ik',
      d: 'nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A',
    },
  },
  compress: 'br', // Use Brotli compression
  expiresIn: 3600, // Expires in 1 hour
});

console.log('Created SDLP link:', link);
// Output: sdlp://eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6...
```

### Verifying a Secure Deep Link

```typescript
import { verifyLink } from '@sdlp/sdk';

const result = await verifyLink(
  'sdlp://eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6...'
);

if (result.valid) {
  console.log('✅ Link verified successfully!');
  console.log('Sender DID:', result.sender);
  console.log('Content Type:', result.metadata.type);
  console.log('Payload:', new TextDecoder().decode(result.payload));

  // Access the parsed payload
  const data = JSON.parse(new TextDecoder().decode(result.payload));
  console.log('Action:', data.action);
} else {
  console.error('❌ Verification failed:', result.error.message);
  console.error('Error code:', result.error.code);
}
```

## API Reference

### `createLink(params: CreateLinkParameters): Promise<string>`

Creates and signs a Secure Deep Link according to SDLP v1.0 specification.

**Parameters:**

- `params.payload` (Uint8Array): The raw payload data to include in the link
- `params.payloadType` (string): MIME type of the payload (e.g., "application/json")
- `params.signer` (Signer): Signer information including private key and DID URL
- `params.compress` ("br" | "none", optional): Compression algorithm (default: "none")
- `params.expiresIn` (number, optional): Expiration time in seconds from now

**Returns:** Promise<string> - A complete SDLP link string

### `verifyLink(link: string, options?: VerifyOptions): Promise<VerificationResult>`

Verifies a Secure Deep Link with comprehensive security validation.

**Parameters:**

- `link` (string): The SDLP link string to verify
- `options.resolver` (DIDResolver, optional): Custom DID resolver
- `options.allowedAlgorithms` (string[], optional): Allowed signature algorithms (default: ['EdDSA'])
- `options.maxPayloadSize` (number, optional): Maximum payload size in bytes (default: 10MB)

**Returns:** Promise<VerificationResult> - Discriminated union result:

- Success: `{ valid: true, sender, payload, metadata, didDocument? }`
- Failure: `{ valid: false, error }`

## Types

### Core Interfaces

```typescript
interface Signer {
  kid: string; // DID URL with key fragment
  privateKeyJwk: Record<string, unknown>; // Private key in JWK format
}

interface VerificationSuccess {
  readonly valid: true;
  readonly sender: string; // Verified sender DID
  readonly payload: Uint8Array; // Original payload data
  readonly metadata: CoreMetadata; // Link metadata
  readonly didDocument?: DIDDocument;
}

interface VerificationFailure {
  readonly valid: false;
  readonly error: SdlpError; // Structured error with code
}
```

### Error Handling

The library provides structured error classes with specific error codes:

```typescript
// Error codes and their meanings
'DID_MISMATCH'; // Sender DID doesn't match key DID
'INVALID_JWS_FORMAT'; // Malformed JWS structure
'INVALID_SIGNATURE'; // Cryptographic signature verification failed
'PAYLOAD_CHECKSUM_MISMATCH'; // Payload integrity check failed
'LINK_EXPIRED'; // Link has expired
'LINK_NOT_YET_VALID'; // Link not yet valid (nbf)
'UNSUPPORTED_COMPRESSION'; // Unsupported compression algorithm
'DID_RESOLUTION_FAILED'; // Could not resolve sender DID
'INVALID_LINK_FORMAT'; // Malformed link structure
```

## Advanced Usage

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

### Payload Size Limits

```typescript
// Set custom payload size limits for security
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

## Browser Compatibility

The library works in both Node.js and browser environments:

- **Node.js**: Uses built-in `zlib` for Brotli compression (Node.js 12+)
- **Browser**: Uses `brotli-wasm` for Brotli compression support

## Contributing

This library follows the SDLP v1.0 specification. For issues or contributions, please refer to the main SDLP repository.

## License

[License information to be added]
