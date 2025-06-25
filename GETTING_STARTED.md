# Getting Started with SDLP

Welcome to the Secure Deep Link Protocol (SDLP)! This guide will walk you through setting up the development environment, building the project, running tests, and completing a full sign/verify cycle using both the CLI tools and the interactive demo application.

## What is SDLP?

SDLP enables secure, verifiable deep links that can be trusted across applications and platforms. Each link is cryptographically signed by its creator using Decentralized Identifiers (DIDs) and can be independently verified without requiring a central authority.

### Key Features

- **Cryptographic Signatures**: Uses EdDSA with Ed25519 keys for tamper-evident links
- **Decentralized Identity**: DID-based sender authentication (`did:key` and `did:web`)
- **Payload Integrity**: SHA-256 checksums prevent payload tampering
- **Compression**: Efficient Brotli compression for large payloads
- **Time Bounds**: Optional expiration and not-before timestamps
- **Cross-Platform**: Works in Node.js, browsers, and desktop applications

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Just** command runner - [Install from just.systems](https://just.systems/)

### Installing Just

```bash
# macOS (using Homebrew)
brew install just

# Linux (using cargo)
cargo install just

# Windows (using scoop)
scoop install just

# Or download from GitHub releases
# https://github.com/casey/just/releases
```

## Project Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd sdlp

# Install all dependencies across packages
npm install
```

### 2. Build All Packages

```bash
# Build all TypeScript packages
just build
```

### 3. Run Quality Checks

```bash
# Run linting, formatting, and tests across all packages
just check-all
```

If all checks pass, you're ready to start using SDLP!

## Project Structure

The repository contains several TypeScript packages:

```
implementations/ts/
├── sdlp-sdk/           # Core TypeScript library
├── sdlp-cli/           # Command-line interface
└── sdlp-electron-demo/ # Interactive desktop demo

specs/                  # Protocol specification and test vectors
docs/                   # Additional documentation
```

## Quick Start: CLI Workflow

Let's walk through a complete sign/verify cycle using the CLI tools.

### 1. Generate a Key Pair

```bash
# Navigate to the CLI package
cd implementations/ts/sdlp-cli

# Generate a new DID:key identity
node dist/src/index.js keygen --out my-key.jwk
```

You should see output like:
```
✅ Key pair generated successfully!
📁 Private key saved to: my-key.jwk
🔑 DID: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
```

**Important**: Keep the `my-key.jwk` file secure - it contains your private key!

### 2. Create a Payload

```bash
# Create a simple JSON payload
echo '{"message": "Hello, SDLP!", "timestamp": "'$(date -Iseconds)'", "action": "greet"}' > message.json

# Or create a plain text payload
echo "This is a secure message from SDLP!" > message.txt
```

### 3. Sign the Payload

```bash
# Sign the JSON payload
node dist/src/index.js sign \
  --payload-file message.json \
  --type application/json \
  --signer-key my-key.jwk

# The output will be an SDLP link like:
# sdlp://eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6...
```

Copy the generated link - you'll need it for verification.

### 4. Verify the Link

```bash
# Verify the link (replace with your actual link)
echo "sdlp://eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6..." | node dist/src/index.js verify
```

You should see verification output like:
```
✅ Link verified successfully!
👤 Sender: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
📄 Content Type: application/json
📊 Payload Size: 89 bytes
🗜️  Compression: none

--- Payload ---
{"message": "Hello, SDLP!", "timestamp": "2025-06-25T00:10:45+00:00", "action": "greet"}
```

### 5. Advanced CLI Features

```bash
# Sign with compression and expiration
node dist/src/index.js sign \
  --payload-file message.json \
  --type application/json \
  --signer-key my-key.jwk \
  --compression br \
  --expires 3600

# Verify with JSON output
echo "sdlp://..." | node dist/src/index.js verify --json

# Generate did:web identity (requires domain setup)
node dist/src/index.js keygen --did-web example.com --out web-key.jwk
```

## Interactive Demo Application

The Electron demo provides a user-friendly interface for testing SDLP links.

### 1. Start the Demo

```bash
# From the project root
just local-demo

# Or manually:
cd implementations/ts/sdlp-electron-demo
npm run dev
```

The application will open with two main tabs:

### 2. Home Tab - Protocol Testing

- **Example Links**: Test pre-built SDLP links
  - Click "Valid Link" to see successful verification
  - Try "Invalid Link" to see how tampering is detected
  - Test "Untrusted Link" to see security warnings
- **Command Execution**: See how commands are safely executed with user confirmation

### 3. Tester Tab - Interactive Tools

- **Link Generator**:
  1. Enter a command like `echo "Hello from SDLP!"`
  2. Click "Generate Link"
  3. Copy the generated SDLP link
  4. Test it by opening in your browser or pasting into the verifier

- **Link Verifier**:
  1. Paste any SDLP link
  2. View detailed verification results
  3. See sender DID, payload type, and content

### 4. Protocol Handler Testing

The demo registers as a system handler for `sdlp://` links:

```bash
# Generate a link using the CLI
LINK=$(cd implementations/ts/sdlp-cli && echo '{"action": "test"}' | node dist/src/index.js sign --payload-file /dev/stdin --type application/json --signer-key ../../fixtures/valid-key.jwk)

# Open the link (macOS/Linux)
open "$LINK"

# Or on Windows
start "$LINK"
```

The demo will capture the link and show a security dialog for user confirmation.

## SDK Integration

For programmatic use, integrate the SDLP SDK into your applications:

### 1. Install the SDK

```bash
npm install @sdlp/sdk
```

### 2. Create Links

```typescript
import { createLink } from '@sdlp/sdk';

const payload = new TextEncoder().encode(JSON.stringify({
  action: 'open-document',
  documentId: 'doc-123'
}));

const link = await createLink({
  payload,
  payloadType: 'application/json',
  signer: {
    kid: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    privateKeyJwk: { /* your private key JWK */ }
  },
  compress: 'br',
  expiresIn: 3600
});
```

### 3. Verify Links

```typescript
import { verifyLink } from '@sdlp/sdk';

const result = await verifyLink('sdlp://...');

if (result.valid) {
  console.log('Verified sender:', result.sender);
  console.log('Payload:', new TextDecoder().decode(result.payload));
} else {
  console.error('Verification failed:', result.error.message);
}
```

## Running Tests

The project includes comprehensive test suites:

### 1. Run All Tests

```bash
# Run tests across all packages
just test
```

### 2. Package-Specific Tests

```bash
# SDK tests
cd implementations/ts/sdlp-sdk
npm test

# CLI tests
cd implementations/ts/sdlp-cli
npm test

# Specification validation tests
cd specs
npm test
```

### 3. Test Coverage

```bash
# Generate coverage reports
cd implementations/ts/sdlp-sdk
npm run test:coverage
```

## Development Workflow

### 1. Code Quality

```bash
# Run linting
just lint

# Auto-format code
just format

# Run all quality checks
just check-all
```

### 2. Simulate CI Environment

```bash
# Clean install and test (like CI)
just ci-local
```

### 3. Individual Package Development

```bash
# Work on the SDK
cd implementations/ts/sdlp-sdk
npm run dev        # Watch mode for development
npm run build      # Build the package
npm test           # Run tests

# Work on the CLI
cd implementations/ts/sdlp-cli
npm run build
npm test

# Work on the demo
cd implementations/ts/sdlp-electron-demo
npm run dev        # Start development server
npm run build      # Build for production
```

## Troubleshooting

### Common Issues

**1. Network errors during npm install**

If you see network errors, the project includes an `.npmrc` file to handle corporate networks:

```bash
# Check if .npmrc exists
cat .npmrc
# Should contain: registry=https://registry.npmjs.org/
```

**2. Just command not found**

Install the Just command runner:
```bash
# macOS
brew install just

# Or download from https://github.com/casey/just/releases
```

**3. Build failures**

Clean and rebuild:
```bash
# Clean all node_modules
just ci-local

# Or manually
rm -rf node_modules package-lock.json
npm install
just build
```

**4. Test failures**

Some tests may fail if implementation features are not yet complete. Check the test output for specific failures and refer to the project's issue tracker.

**5. Demo app won't start**

Ensure all packages are built:
```bash
just build
cd implementations/ts/sdlp-electron-demo
npm run dev
```

### Getting Help

- **Specification**: Read `specs/sdlp-v0.1-draft.md` for protocol details
- **API Documentation**: Check individual package READMEs
- **Development Guide**: See `docs/development.md`
- **Test Vectors**: Examine `specs/mvp-test-vectors.json` for examples

## Choosing a DID Method

SDLP supports multiple Decentralized Identifier (DID) methods for sender authentication. Understanding the different options helps you choose the right approach for your use case.

### DID Method Comparison

| Method | Best For | Setup Complexity | Domain Required | Key Management |
|--------|----------|------------------|-----------------|----------------|
| `did:key` | Development, Testing, Simple Apps | ⭐ Very Easy | No | Self-managed |
| `did:web` | Production, Organizations | ⭐⭐ Easy | Yes | Self-managed |
| Other Methods | Enterprise, Complex Identity | ⭐⭐⭐ Complex | Varies | Varies |

### Using `did:key` (Recommended for Getting Started)

`did:key` is perfect for development and simple applications. The identifier is derived directly from the public key, making it completely self-contained.

#### Generate a `did:key` Identity

```bash
cd implementations/ts/sdlp-cli

# Generate a new Ed25519 key pair
node dist/src/index.js keygen --out my-did-key.jwk

# The output shows your DID:key identifier
# ✅ Key pair generated successfully!
# 🔑 DID: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
```

#### Sign with `did:key`

```bash
# Create and sign a payload
echo '{"action": "hello", "message": "Getting started with SDLP!"}' > hello.json

node dist/src/index.js sign \
  --payload-file hello.json \
  --type application/json \
  --signer-key my-did-key.jwk
```

**Advantages of `did:key`:**
- ✅ No domain or infrastructure required
- ✅ Works immediately after key generation
- ✅ Perfect for development and testing
- ✅ Completely decentralized

**Limitations of `did:key`:**
- ❌ No human-readable identity
- ❌ Cannot rotate keys (new key = new DID)
- ❌ No additional metadata or services

### Using `did:web` (Recommended for Production)

`did:web` provides a more flexible identity system that's perfect for organizations with domain control.

#### Set Up `did:web` Identity

1. **Generate a key pair:**
```bash
cd implementations/ts/sdlp-cli
node dist/src/index.js keygen --out my-web-key.jwk
```

2. **Create a DID document:**
```bash
# Generate DID document for your domain
node dist/src/index.js didgen \
  --domain example.com \
  --key-file my-web-key.jwk \
  --out did-document.json
```

3. **Host the DID document:**
```bash
# Upload did-document.json to your web server at:
# https://example.com/.well-known/did.json
```

4. **Sign with your `did:web` identity:**
```bash
echo '{"action": "welcome", "from": "Example Corp"}' > welcome.json

node dist/src/index.js sign \
  --payload-file welcome.json \
  --type application/json \
  --signer-key my-web-key.jwk
```

**Advantages of `did:web`:**
- ✅ Human-readable domain-based identity
- ✅ Can rotate keys by updating DID document
- ✅ Can include additional metadata and services
- ✅ Familiar web-based infrastructure

**Limitations of `did:web`:**
- ❌ Requires domain ownership and HTTPS
- ❌ Depends on DNS and web infrastructure
- ❌ More complex setup process

### DID Method Selection Guide

#### Choose `did:key` if:
- 🚀 You're just getting started with SDLP
- 🧪 Building a prototype or development application
- 🔒 You need maximum decentralization
- ⚡ You want the simplest possible setup

#### Choose `did:web` if:
- 🏢 You represent an organization with a domain
- 🔄 You need the ability to rotate keys
- 📋 You want to include additional identity metadata
- 🌐 Your users expect domain-based verification

#### Consider other DID methods if:
- 🏛️ You need enterprise-grade identity infrastructure
- 🔗 You're integrating with existing DID ecosystems
- 📜 You have specific compliance requirements

### Migration Path

Start with `did:key` for development, then migrate to `did:web` for production:

1. **Development Phase**: Use `did:key` for rapid prototyping
2. **Testing Phase**: Test with both `did:key` and `did:web`
3. **Production Phase**: Deploy with `did:web` for your organization
4. **Scale Phase**: Consider enterprise DID methods as needed

### Example: Complete Workflow

Here's a complete example showing both methods:

```bash
cd implementations/ts/sdlp-cli

# 1. Quick start with did:key
node dist/src/index.js keygen --out dev-key.jwk
echo '{"env": "development"}' | node dist/src/index.js sign \
  --payload-file /dev/stdin \
  --type application/json \
  --signer-key dev-key.jwk

# 2. Production setup with did:web
node dist/src/index.js keygen --out prod-key.jwk
node dist/src/index.js didgen \
  --domain mycompany.com \
  --key-file prod-key.jwk \
  --out did-document.json

# Upload did-document.json to https://mycompany.com/.well-known/did.json

echo '{"env": "production", "company": "My Company"}' | node dist/src/index.js sign \
  --payload-file /dev/stdin \
  --type application/json \
  --signer-key prod-key.jwk
```

## Next Steps

Now that you have SDLP running:

1. **Explore the Specification**: Read `specs/sdlp-v0.1-draft.md` to understand the protocol
2. **Review Security Model**: Check `specs/threat-model.md` for security considerations
3. **Learn Key Management**: Read our [Key Management Guidance](docs/key-management-guidance.md) for production best practices
4. **Try Advanced Features**: Experiment with compression, expiration, and different DID methods
5. **Build Applications**: Integrate the SDK into your own projects
6. **Contribute**: See `docs/development.md` for contribution guidelines

## Security Considerations

⚠️ **Important Security Notes**:

- **Private Keys**: Never commit private key files to version control
- **Key Management**: For production deployments, follow comprehensive security practices outlined in our [Key Management Guidance](docs/key-management-guidance.md)
- **Production Use**: The demo app executes arbitrary commands - implement proper sandboxing for production
- **Network Security**: did:web resolution relies on HTTPS - ensure secure connections
- **Payload Validation**: Always validate payloads before processing in your applications
- **Size Limits**: Set appropriate payload size limits to prevent resource exhaustion

## Example Workflows

### Workflow 1: Document Sharing

```bash
# 1. Create a document
echo '{"title": "Meeting Notes", "content": "...", "permissions": ["read"]}' > document.json

# 2. Sign the document
LINK=$(cd implementations/ts/sdlp-cli && node dist/src/index.js sign --payload-file ../../document.json --type application/json --signer-key my-key.jwk --expires 86400)

# 3. Share the link
echo "Share this secure link: $LINK"

# 4. Recipient verifies
echo "$LINK" | cd implementations/ts/sdlp-cli && node dist/src/index.js verify --json
```

### Workflow 2: Command Execution

```bash
# 1. Create a command payload
echo '{"command": "ls -la", "directory": "/tmp"}' > command.json

# 2. Sign with short expiration
LINK=$(cd implementations/ts/sdlp-cli && node dist/src/index.js sign --payload-file ../../command.json --type application/json --signer-key my-key.jwk --expires 300)

# 3. Execute via demo app
open "$LINK"
```

### Workflow 3: API Integration

```bash
# 1. Create API request payload
echo '{"endpoint": "/api/users", "method": "GET", "auth": "bearer-token"}' > api-request.json

# 2. Sign with compression
LINK=$(cd implementations/ts/sdlp-cli && node dist/src/index.js sign --payload-file ../../api-request.json --type application/json --signer-key my-key.jwk --compression br)

# 3. Verify and process
echo "$LINK" | cd implementations/ts/sdlp-cli && node dist/src/index.js verify
```

---

**Congratulations!** You now have a complete SDLP development environment set up and understand how to create, sign, and verify secure deep links. Start building secure, verifiable applications with SDLP!
