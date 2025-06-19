# SDLP Specifications

This directory contains the **authoritative SDLP specification**, test fixtures, test vectors, and validation tools.

## 🛡️ Validation System (IMPORTANT!)

**Before making any changes**, run the validation suite:

```bash
npm run validate-all
```

This prevents the cryptographic key mismatches and spec inconsistencies that caused debugging issues during initial implementation.

## 📋 Quick Start

```bash
# Install dependencies
npm install

# Validate everything is consistent
npm run validate-all

# Generate new test vectors (if needed)
npm run generate-vectors

# Run all tests
npm test
```

## 🔍 Validation Commands

| Command                         | Purpose                            |
| ------------------------------- | ---------------------------------- |
| `npm run validate-all`          | **Run complete validation suite**  |
| `npm run validate-fixtures`     | Validate test fixtures (keys/DIDs) |
| `npm run validate-test-vectors` | Validate test vectors format       |
| `npm run generate-vectors`      | Generate new test vectors          |
| `npm run generate-did-key`      | Generate new key pairs             |

**💡 Always run `npm run validate-all` before committing changes!**

## 📁 Directory Structure

```
specs/
├── sdlp-v0.1-draft.md           # 📋 Protocol specification
├── mvp-test-vectors.json        # 🧪 Official test vectors
├── test-fixtures/               # 🔑 Test keys and DIDs
│   ├── keys.json               #     Ed25519 key pairs
│   └── did-web-acme-example.json #   DID web document
├── scripts/                     # 🔧 Generation & validation tools
│   ├── validate-all.ts         #     Complete validation suite
│   ├── validate-fixtures.ts    #     Key pair validation
│   ├── validate-test-vectors.ts #     Test vector validation
│   ├── generate-test-vectors.ts #     Test vector generation
│   └── generate-did-key.ts     #     Key pair generation
├── VALIDATION.md               # 📖 Validation system docs
└── .github/workflows/          # 🤖 CI validation pipeline
    └── validate-specs.yml
```

## 🎯 Key Files

### 📋 Protocol Specification

- **`sdlp-v0.1-draft.md`**: The authoritative SDLP protocol specification
- Defines link format, cryptographic requirements, and security model

### 🧪 Test Vectors

- **`mvp-test-vectors.json`**: Official test vectors for implementation testing
- Includes happy path, error cases, and edge conditions
- **Always validated** against specification requirements

### 🔑 Test Fixtures

- **`test-fixtures/keys.json`**: Cryptographically valid Ed25519 key pairs
- **`test-fixtures/did-web-acme-example.json`**: Sample DID document
- **Automatically validated** for mathematical correctness

## 🔄 Workflow

### For Spec Changes

1. **Modify specification**: Edit `sdlp-v0.1-draft.md`
2. **Update validation**: Modify validation rules if needed
3. **Regenerate fixtures**: `npm run generate-did-key` (if needed)
4. **Regenerate vectors**: `npm run generate-vectors`
5. **Validate everything**: `npm run validate-all`
6. **Test implementations**: Ensure implementations still pass

### For Test Case Changes

1. **Update generation script**: Modify `scripts/generate-test-vectors.ts`
2. **Regenerate vectors**: `npm run generate-vectors`
3. **Validate**: `npm run validate-all`
4. **Test implementations**: Verify implementation compliance

### For Key Changes

1. **Generate new keys**: `npm run generate-did-key`
2. **Validate fixtures**: `npm run validate-fixtures`
3. **Regenerate vectors**: `npm run generate-vectors`
4. **Full validation**: `npm run validate-all`

## 🚨 Error Prevention

The validation system prevents these critical issues:

- ❌ **Invalid Key Pairs**: Private/public keys that aren't mathematically related
- ❌ **Key Mismatches**: Test vectors using different keys than fixtures
- ❌ **Spec Drift**: Implementation formats diverging from specification
- ❌ **Format Errors**: Wrong version strings, checksum formats, etc.

## 🔧 Available Scripts

### 🧪 Testing & Validation

```bash
npm run validate-all           # Complete validation suite
npm run validate-fixtures      # Validate test fixtures
npm run validate-test-vectors  # Validate test vectors
npm test                      # Run all tests
npm run test:coverage         # Test with coverage
```

### 🔨 Generation & Development

```bash
npm run generate-vectors      # Generate test vectors
npm run generate-did-key      # Generate key pairs
npm run parse-link           # Parse SDLP links (debug)
npm run dev                  # Start dev server
npm run build                # Build for production
```

### 📏 Code Quality

```bash
npm run lint                 # Lint TypeScript
npm run format              # Format with Prettier
npm run typecheck           # TypeScript type checking
```

## 🤖 CI/CD Integration

GitHub Actions automatically:

- ✅ Validates all changes to specs
- ✅ Runs cryptographic validation
- ✅ Checks implementation consistency
- ✅ Prevents invalid specs from merging

## 📖 Documentation

- **[VALIDATION.md](./VALIDATION.md)**: Complete validation system documentation
- **[scripts/README.md](./scripts/README.md)**: Script usage and API reference

## 🔗 Related

- **Implementation**: `../implementations/ts/sdlp-sdk/` - TypeScript reference implementation
- **Protocol**: `../protocol/` - Original protocol development files

---

## ⚠️ Important Notes

1. **Always validate before committing**: `npm run validate-all`
2. **Never edit fixtures manually**: Use generation scripts
3. **Test implementations after changes**: Ensure compatibility
4. **Document validation rule changes**: Update VALIDATION.md

The validation system is your safety net - use it! 🛡️
