# SDLP Specification Validation System

This document describes the validation system that prevents inconsistencies between the SDLP specification, test fixtures, and test vectors.

## 🎯 Purpose

During implementation, we discovered critical inconsistencies that caused significant debugging effort:

1. **Invalid Key Pairs**: Test fixtures contained private/public keys that weren't mathematically related
2. **Mismatched Keys**: Test vectors were generated with different keys than the fixtures
3. **Non-Spec Compliance**: Implementation used formats that didn't match the specification

This validation system prevents these issues from recurring.

## 🛡️ Validation Components

### 1. Test Fixture Validation (`validate-fixtures.ts`)

**Purpose**: Ensures test fixtures are cryptographically valid and consistent.

**Validates**:

- ✅ JWK format correctness (OKP/Ed25519)
- ✅ Private/public key mathematical relationship
- ✅ Signature generation and verification
- ✅ DID key derivation from public key
- ✅ DID format compliance

**Run with**: `npm run validate-fixtures`

### 2. Test Vector Validation (`validate-test-vectors.ts`)

**Purpose**: Ensures test vectors conform to SDLP specification format.

**Validates**:

- ✅ SDLP link structure (`sdlp://`)
- ✅ JWS format (protected/payload/signature)
- ✅ Algorithm specification (EdDSA)
- ✅ Version string (`SDL-1.0`)
- ✅ Checksum format (64-char hex)
- ✅ Compression algorithms (`none`, `br`, `gz`, `zstd`)
- ✅ DID format and consistency
- ✅ Expected result format
- ✅ Required test case coverage

**Run with**: `npm run validate-test-vectors`

### 3. Complete Validation Suite (`validate-all.ts`)

**Purpose**: Runs all validations in dependency order.

**Process**:

1. **Fixtures First**: Validates test fixtures
2. **Vectors Second**: Only if fixtures pass
3. **Summary Report**: Clear pass/fail status
4. **Actionable Guidance**: Specific fix instructions

**Run with**: `npm run validate-all`

## 🔄 Workflow Integration

### Pre-Commit Validation

Always run before committing changes to specs:

```bash
cd specs
npm run validate-all
```

### CI/CD Pipeline

GitHub Actions automatically validates on:

- Push to `main`/`develop`
- Pull requests affecting `specs/`
- Manual workflow dispatch

### Implementation Testing

The validation system ensures implementations test against valid specs:

```bash
# In implementation directory
npm test  # Uses symlinked, validated test fixtures
```

## 🔧 Fixing Validation Failures

### Test Fixture Issues

If `validate-fixtures` fails:

```bash
# Generate new valid key pair
npm run generate-did-key

# Manually edit test-fixtures/keys.json if needed
# Then validate
npm run validate-fixtures
```

### Test Vector Issues

If `validate-test-vectors` fails:

```bash
# Regenerate vectors from valid fixtures
npm run generate-vectors

# Then validate
npm run validate-test-vectors
```

### Complete Recovery

If everything is broken:

```bash
# 1. Fix/regenerate fixtures
npm run generate-did-key
npm run validate-fixtures

# 2. Regenerate vectors
npm run generate-vectors
npm run validate-test-vectors

# 3. Verify everything
npm run validate-all
```

## 📋 Validation Rules

### Test Fixtures Must Have

- ✅ Valid Ed25519 key pairs (mathematically related)
- ✅ Correct JWK format (`kty: "OKP"`, `crv: "Ed25519"`)
- ✅ Matching public key components between private/public JWKs
- ✅ DID key that derives from the public key
- ✅ Valid DID web identifier format

### Test Vectors Must Have

- ✅ Valid SDLP link format (`sdlp://jws.payload`)
- ✅ Proper JWS structure (Flattened JSON Serialization)
- ✅ Correct algorithm (`EdDSA`)
- ✅ Specification-compliant version (`SDL-1.0`)
- ✅ Hex-encoded checksums (64 characters)
- ✅ Consistent DID usage (kid matches sid)
- ✅ Proper expected result format
- ✅ Coverage of required test cases

### Protocol Compliance

- ✅ Version string: `"SDL-1.0"` (not `"0.1-mvp"`)
- ✅ Checksum format: Hexadecimal (not base64url)
- ✅ Compression: `"none"`, `"br"`, `"gz"`, `"zstd"`
- ✅ Algorithm: `"EdDSA"`
- ✅ Key type: `"OKP"` with `"Ed25519"`

## 🚨 Error Prevention

### Automated Checks

1. **CI Validation**: All changes validated automatically
2. **Dependency Order**: Fixtures validated before vectors
3. **Implementation Sync**: Symlinks ensure consistency
4. **Format Validation**: Strict schema compliance

### Manual Processes

1. **Generate, Don't Edit**: Always use generation scripts
2. **Validate Early**: Run validation before making changes
3. **Test Locally**: Verify changes before pushing
4. **Document Changes**: Update this file if validation rules change

## 🎓 Best Practices

### When Adding New Test Cases

1. **Add to Generation Script**: Update `generate-test-vectors.ts`
2. **Regenerate Vectors**: Run `npm run generate-vectors`
3. **Validate**: Run `npm run validate-all`
4. **Test Implementation**: Verify implementation passes

### When Changing Cryptographic Parameters

1. **Update Fixtures First**: Use `generate-did-key.ts`
2. **Validate Fixtures**: Run `npm run validate-fixtures`
3. **Regenerate Vectors**: Run `npm run generate-vectors`
4. **Full Validation**: Run `npm run validate-all`

### When Modifying Protocol Spec

1. **Update Types**: Modify type definitions first
2. **Update Validation**: Add new validation rules
3. **Update Generation**: Modify generation scripts
4. **Regenerate Everything**: Create new fixtures and vectors
5. **Full Test**: Ensure implementation compliance

## 🔍 Debugging Validation Failures

### Common Issues

| Error                            | Cause                 | Solution                       |
| -------------------------------- | --------------------- | ------------------------------ |
| "Private key does not derive..." | Invalid key pair      | Run `npm run generate-did-key` |
| "Version must be 'SDL-1.0'..."   | Wrong version string  | Update generation script       |
| "chk must be 64-char hex..."     | Wrong checksum format | Fix generation to use hex      |
| "DID key does not match..."      | DID/key mismatch      | Regenerate fixtures            |

### Debugging Steps

1. **Check Logs**: Validation provides detailed error messages
2. **Run Individual Validations**: Isolate the failing component
3. **Compare with Spec**: Verify against `sdlp-v0.1-draft.md`
4. **Regenerate Clean**: Start fresh with generation scripts

## 📊 Validation Reports

Successful validation produces:

```
🔍 SDLP Specification Validation Suite
=====================================

1️⃣  Validating test fixtures...
   ✅ Test fixtures are valid

2️⃣  Validating test vectors...
   ✅ Test vectors are valid

📊 Validation Summary
====================
Test Fixtures: ✅ PASS
Test Vectors:  ✅ PASS
Overall:       ✅ PASS

🎉 All validations passed! Spec is consistent.
```

## 🔮 Future Enhancements

Planned validation improvements:

- [ ] **Semantic Validation**: Verify payloads match expected content
- [ ] **Cross-Reference Validation**: Ensure test vectors exercise all spec features
- [ ] **Performance Validation**: Check for reasonable test vector generation times
- [ ] **Fuzzing Integration**: Generate edge case test vectors automatically
- [ ] **Implementation Compliance**: Validate implementations against extended test suites

---

**Remember**: The validation system is your safety net. Use it early and often to prevent the debugging pain we experienced during initial implementation! 🛡️
