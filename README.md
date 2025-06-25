<div align="center">
  <img src="assets/logo.png" alt="SDLP Logo" width="200"/>
</div>

# Secure Deep Link Protocol (SDLP)

A cryptographically signed deep link protocol using Decentralized Identifiers (DIDs) for sender authentication and payload integrity verification.

## Overview

SDLP enables secure, verifiable deep links that can be trusted across applications and platforms. Each link is cryptographically signed by its creator using EdDSA signatures and can be independently verified without requiring a central authority.

### Key Features

- **🔐 Cryptographic Signatures**: EdDSA with Ed25519 keys for tamper-evident links
- **🆔 Decentralized Identity**: DID-based sender authentication (`did:key` and `did:web`)
- **🛡️ Payload Integrity**: SHA-256 checksums prevent payload tampering
- **⏰ Time Bounds**: Optional expiration and not-before timestamps
- **🗜️ Compression**: Efficient Brotli compression for large payloads
- **🌐 Cross-Platform**: Works in Node.js, browsers, and desktop applications

### Protocol Format

SDLP links follow this structure:
```
sdlp://<base64url_jws_metadata>.<base64url_compressed_payload>
```

## Getting Started

**New to SDLP?** Start with our comprehensive [Getting Started Guide](GETTING_STARTED.md) for step-by-step setup instructions, examples, and tutorials.

### Quick Start

```bash
# Install and build all packages
npm install
just check-all

# Run the interactive demo application
just local-demo
```

## Documentation

### 📚 Core Documentation

- **[Getting Started Guide](GETTING_STARTED.md)** - Complete setup and tutorial guide
- **[SDLP v0.1 Specification](specs/sdlp-v0.1-draft.md)** - Complete protocol specification
- **[Threat Model](specs/threat-model.md)** - Security analysis and threat mitigation
- **[Development Guide](docs/development.md)** - Development setup and contribution guidelines

### 📦 Package Documentation

- **[SDLP SDK](implementations/ts/sdlp-sdk/)** - Core TypeScript library
  - [API Reference](implementations/ts/sdlp-sdk/docs/API.md) - Complete API documentation
- **[SDLP CLI](implementations/ts/sdlp-cli/)** - Command-line interface
- **[Electron Demo](implementations/ts/sdlp-electron-demo/)** - Interactive demonstration application

### 🧪 Testing & Validation

- **[Test Vectors](specs/mvp-test-vectors.json)** - Reference implementation test cases
- **[Edge Case Vectors](specs/sdlp-edge-case-vectors-v1.json)** - Edge case test scenarios
- **[Validation Scripts](specs/scripts/)** - Protocol validation utilities

## Packages

This repository contains multiple TypeScript packages:

| Package | Description | Version |
|---------|-------------|---------|
| [`sdlp-sdk`](implementations/ts/sdlp-sdk/) | Core TypeScript library for creating and verifying SDLP links | v1.1.0 |
| [`sdlp-cli`](implementations/ts/sdlp-cli/) | Command-line interface for key generation, signing, and verification | v1.1.0 |
| [`sdlp-electron-demo`](implementations/ts/sdlp-electron-demo/) | Interactive Electron demonstration application | v1.1.0 |

## Example Usage

### Creating a Signed Link

```typescript
import { createLink } from '@sdlp/sdk';

const link = await createLink({
  payload: new TextEncoder().encode('{"message": "Hello, SDLP!"}'),
  payloadType: 'application/json',
  signer: {
    kid: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1',
    privateKeyJwk: { /* your private key JWK */ }
  },
  compress: 'br',
  expiresIn: 3600 // 1 hour
});
```

### Verifying a Link

```typescript
import { verifyLink } from '@sdlp/sdk';

const result = await verifyLink(link);
if (result.valid) {
  console.log('Verified sender:', result.sender);
  console.log('Payload:', new TextDecoder().decode(result.payload));
}
```

## Security Considerations

SDLP implements multiple layers of security:

- **Cryptographic Integrity**: All links are signed with EdDSA using Ed25519 keys
- **Identity Verification**: Sender identity is verified through DID resolution
- **Payload Protection**: SHA-256 checksums prevent tampering
- **Time Bounds**: Optional expiration prevents replay attacks
- **Algorithm Agility**: Configurable algorithm restrictions prevent downgrade attacks

For detailed security analysis, see the [Threat Model](specs/threat-model.md).

## Contributing

We welcome contributions! Please see our [Development Guide](docs/development.md) for:

- Development environment setup
- Code quality standards
- Testing requirements
- Contribution workflow

## Specifications

SDLP follows open standards and specifications:

- **[SDLP v0.1 Draft](specs/sdlp-v0.1-draft.md)** - Core protocol specification
- **[RFC 7515 - JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515)** - Signature format
- **[W3C Decentralized Identifiers (DIDs) v1.0](https://www.w3.org/TR/did-core/)** - Identity framework
- **[DID Key Method](https://w3c-ccg.github.io/did-method-key/)** - Cryptographic identity method

## License

[License information to be determined]

---

**Ready to get started?** Check out the [Getting Started Guide](GETTING_STARTED.md) for detailed setup instructions and examples.
