<div align="center">
  <img src="assets/logo.png" alt="SDLP Logo" width="200"/>
</div>

# Secure Deep Link Protocol (SDLP)

A cryptographically signed deep link protocol using Decentralized Identifiers (DIDs) for sender authentication and payload integrity verification.

## Overview

SDLP enables secure, verifiable deep links that can be trusted across applications and platforms. Each link is cryptographically signed by its creator using EdDSA signatures and can be independently verified without requiring a central authority.

**📄 Academic Paper**: Read our comprehensive analysis in ["SDLP: A Lightweight Protocol for Authenticated Deep Links with Decentralized Identity"](paper/sdlp-paper.pdf) - prepared for arXiv submission.

### Key Features

- **🔐 Cryptographic Signatures**: EdDSA with Ed25519 keys for tamper-evident links
- **🆔 Decentralized Identity**: DID-based sender authentication (`did:key` and `did:web`)
- **🛡️ Payload Integrity**: SHA-256 checksums prevent payload tampering
- **⏰ Time Bounds**: Optional expiration and not-before timestamps
- **🗜️ Compression**: Efficient Brotli compression for large payloads (35.9% reduction for 1KB payloads)
- **🌐 Cross-Platform**: Works in Node.js, browsers, and desktop applications
- **⚡ High Performance**: Sub-millisecond operations (0.09-0.11ms creation, 0.32-0.38ms verification)

## SDLP in the Deep-Link Ecosystem

While traditional deep links and platform-specific solutions like Android App Links and iOS Universal Links serve basic navigation needs, they were not designed for security-critical applications. SDLP fills a crucial gap by providing a comprehensive, platform-agnostic security layer for deep links.

A recent comparative analysis highlights the key differences:

| Feature                      | Traditional | Platform-Specific (iOS/Android) | JWT-Based | **SDLP**                               |
| ---------------------------- | ----------- | ------------------------------- | --------- | -------------------------------------- |
| **Link Hijacking Prevention**  | ❌ No       | ✅ Yes (Domain-based)           | ❌ No     | ✅ **Yes (Cryptographic Auth)**        |
| **Payload Tampering Protection** | ❌ No       | ❌ No                           | ⚠️ Limited | ✅ **Yes (JWS Signatures)**            |
| **Sender Authentication**    | ❌ No       | ✅ Yes (Domain-based)           | ⚠️ Limited | ✅ **Yes (Decentralized Identity)**    |
| **Cross-Platform Support**   | ✅ Yes      | ❌ No                           | ✅ Yes    | ✅ **Yes**                             |
| **Requires Domain Control**  | No          | Yes                             | No        | **No**                                 |
| **Cryptographic Integrity**  | ❌ No       | ❌ No                           | ✅ Yes    | ✅ **Yes (Enhanced)**                  |

### When to Choose SDLP

SDLP's use of DIDs and JWS provides a robust, verifiable chain of trust from sender to recipient, independent of platform or domain ownership. This makes it the ideal protocol for applications where security is non-negotiable:

- **🏦 Financial Services**: Secure transaction links and account access
- **🏥 Healthcare**: Patient data sharing and medical record access
- **🏢 Enterprise**: Internal tool integration and secure workflows
- **🔒 High-Security Applications**: Any scenario requiring verified sender identity and payload integrity

For basic navigation and consumer applications, traditional deep links or platform-specific solutions may be sufficient. However, when authenticity, integrity, and cross-platform security are paramount, SDLP provides the comprehensive solution.

### Protocol Format

SDLP links follow this structure:
```
sdlp://<base64url_jws_metadata>.<base64url_compressed_payload>
```

## Performance Benchmarks

SDLP is designed for high performance with minimal overhead:

| Operation | Average Time | Throughput | Notes |
|-----------|-------------|------------|-------|
| **Link Creation** | 0.09-0.11ms | 9,000-11,600 ops/sec | Consistent across payload sizes |
| **Link Verification** | 0.32-0.38ms | 2,600-3,100 ops/sec | Includes DID resolution |
| **Compression (1KB)** | +0.01ms | 35.9% size reduction | Brotli compression |
| **URL Efficiency** | | 72% payload ratio | Within URL length constraints |

*Benchmarks run on macOS ARM64 with Node.js v23.7.0. See [benchmarks/](benchmarks/) for reproducible tests.*

## Live Demo

Try SDLP interactively:

```bash
# Quick demo with Electron app
npm install && just local-demo
```

Or [run online demo](https://sdlp-demo.vercel.app) (coming soon)

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

## Real-World Use Cases

SDLP solves critical security problems across various applications:

### 🤖 AI Prompt Sharing
```typescript
// Share AI prompts with guaranteed authenticity
const promptLink = await createLink({
  payload: new TextEncoder().encode('{"system": "You are an expert...", "user": "Help me with..."}'),
  payloadType: 'application/json',
  signer: trustedOrganizationKey
});
```
*Prevents prompt injection attacks and ensures trusted AI interactions.*

### 🔧 Configuration Distribution
```typescript
// Distribute app configs securely across teams
const configLink = await createLink({
  payload: yamlConfig,
  payloadType: 'application/yaml',
  signer: devOpsKey,
  compress: 'br'
});
```
*Ensures configuration integrity and prevents unauthorized modifications.*

### 🔗 Cross-App Authentication
```typescript
// Pass authenticated session data between applications
const authLink = await createLink({
  payload: sessionToken,
  payloadType: 'application/jwt',
  signer: authServiceKey,
  expiresIn: 300 // 5 minutes
});
```
*Secure handoff between trusted applications without central auth server.*

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
