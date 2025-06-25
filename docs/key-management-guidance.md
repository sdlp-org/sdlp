# SDLP Key Management Guidance

This document provides comprehensive best practices for managing cryptographic keys within the SDLP ecosystem. Proper key management is critical for maintaining the security guarantees that SDLP provides.

## Overview

SDLP relies on cryptographic keys for:
- **Digital Signatures**: Signing SDLP links to ensure authenticity and integrity
- **Identity Verification**: Associating keys with Decentralized Identifiers (DIDs)
- **Trust Establishment**: Enabling recipients to verify sender identity

The security of your SDLP implementation depends entirely on how well you protect and manage these keys.

## Key Generation

### Recommended Algorithms

SDLP supports multiple signature algorithms, but we strongly recommend:

**Primary Choice: Ed25519 (EdDSA)**
- Excellent security properties
- Fast signature generation and verification
- Compact signatures (64 bytes)
- Resistant to timing attacks

```bash
# Generate Ed25519 key using SDLP CLI
sdlp keygen --algorithm Ed25519 --output my-key.jwk
```

**Alternative: ES256 (ECDSA with P-256)**
- Widely supported
- Good performance
- Larger signatures than Ed25519

```bash
# Generate ES256 key using SDLP CLI
sdlp keygen --algorithm ES256 --output my-key.jwk
```

### Entropy Requirements

**Critical**: Ensure your key generation process has sufficient entropy:

- Use cryptographically secure random number generators
- Avoid generating keys on systems with low entropy (e.g., fresh VMs, embedded devices)
- Consider using hardware random number generators for production keys

```bash
# Check entropy on Linux systems
cat /proc/sys/kernel/random/entropy_avail
# Should be > 1000 for key generation
```

### Key Format

SDLP uses JSON Web Key (JWK) format for key storage:

```json
{
  "kty": "OKP",
  "crv": "Ed25519",
  "x": "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo",
  "d": "nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A",
  "use": "sig",
  "kid": "2021-05-01"
}
```

## Key Storage

### Development Environment

For development and testing:

**Environment Variables** (Recommended for development)
```bash
export SDLP_PRIVATE_KEY='{"kty":"OKP","crv":"Ed25519",...}'
```

**Encrypted Files**
```bash
# Encrypt key file with GPG
gpg --symmetric --cipher-algo AES256 my-key.jwk
# Creates my-key.jwk.gpg
```

### Production Environment

**⚠️ Never store production keys in plain text files or environment variables**

#### Software-Based Solutions

**1. HashiCorp Vault**
```bash
# Store key in Vault
vault kv put secret/sdlp/signing-key value=@my-key.jwk

# Retrieve key in application
vault kv get -field=value secret/sdlp/signing-key
```

**2. AWS KMS / Secrets Manager**
```bash
# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "sdlp/signing-key" \
  --secret-string file://my-key.jwk
```

**3. Azure Key Vault**
```bash
# Store in Azure Key Vault
az keyvault secret set \
  --vault-name "MyKeyVault" \
  --name "sdlp-signing-key" \
  --file my-key.jwk
```

#### Hardware Security Modules (HSMs)

**Strongly Recommended for Production**

HSMs provide the highest level of key security by storing keys in tamper-resistant hardware.

**Cloud HSMs:**
- AWS CloudHSM
- Azure Dedicated HSM
- Google Cloud HSM

**Hardware Tokens:**
- YubiKey 5 Series (supports Ed25519)
- Ledger Hardware Wallets
- SoloKeys

**Example: Using YubiKey with SDLP**
```bash
# Generate key on YubiKey (requires ykman)
ykman piv keys generate 9a yubikey-public.pem
ykman piv certificates generate 9a yubikey-public.pem

# Convert to JWK format for SDLP
sdlp keygen --from-pem yubikey-public.pem --output yubikey.jwk
```

### Access Control

Implement strict access controls for key storage:

- **Principle of Least Privilege**: Only authorized services/users can access keys
- **Audit Logging**: Log all key access attempts
- **Multi-Factor Authentication**: Require MFA for key access
- **Network Isolation**: Restrict network access to key storage systems

## Key Rotation

Regular key rotation is essential for maintaining security over time.

### Rotation Strategy

**Recommended Schedule:**
- **Development**: Every 90 days
- **Production**: Every 30-60 days
- **High-Security**: Every 7-30 days
- **Emergency**: Immediately upon suspected compromise

### DID Document Updates

When rotating keys, you must update your DID document to include the new key:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:web:example.com",
  "verificationMethod": [
    {
      "id": "did:web:example.com#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:example.com",
      "publicKeyJwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo"
      }
    },
    {
      "id": "did:web:example.com#key-2",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:example.com",
      "publicKeyJwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "NEW_KEY_PUBLIC_COMPONENT_HERE"
      }
    }
  ],
  "authentication": ["#key-2"],
  "assertionMethod": ["#key-1", "#key-2"]
}
```

### Rotation Process

1. **Generate New Key**: Create new key pair using secure process
2. **Update DID Document**: Add new key to verification methods
3. **Deploy New Key**: Update applications to use new key for signing
4. **Grace Period**: Allow time for DID document propagation (24-48 hours)
5. **Remove Old Key**: Remove old key from DID document
6. **Secure Deletion**: Securely delete old private key

### Backward Compatibility

During rotation, maintain both old and new keys temporarily:
- New links should be signed with the new key
- Old links remain verifiable with the old key
- Remove old key only after all old links have expired

## Key Revocation

### When to Revoke

Immediately revoke keys if:
- Private key is compromised or suspected to be compromised
- Employee with key access leaves the organization
- Security incident affects key storage systems
- Regular security audit identifies vulnerabilities

### Revocation Process

**1. Immediate Actions:**
```bash
# Remove key from DID document immediately
# Update did:web document or regenerate did:key
```

**2. Notification:**
- Notify all stakeholders about the revocation
- Update security incident logs
- Consider public disclosure if compromise affects users

**3. Cleanup:**
```bash
# Securely delete private key from all systems
shred -vfz -n 3 compromised-key.jwk

# Rotate any derived secrets
# Update all dependent systems
```

### DID Document Revocation

For `did:web`, remove the compromised key from the verification methods:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:web:example.com",
  "verificationMethod": [
    // Remove compromised key entry
  ],
  "authentication": ["#new-key-id"],
  "assertionMethod": ["#new-key-id"]
}
```

For `did:key`, generate a completely new DID as `did:key` identifiers are derived from the key itself.

## Monitoring and Auditing

### Key Usage Monitoring

Implement monitoring for:
- **Signature Operations**: Log all signing activities
- **Key Access**: Monitor access to key storage systems
- **Failed Verifications**: Track verification failures that might indicate key compromise
- **Unusual Patterns**: Detect abnormal signing patterns

### Audit Requirements

Maintain audit logs including:
- Key generation events
- Key rotation activities
- Access attempts (successful and failed)
- Revocation events
- System configuration changes

### Example Monitoring Setup

```bash
# Log signing operations
echo "$(date): Signed SDLP link with key ${KID}" >> /var/log/sdlp-signing.log

# Monitor key file access (Linux)
auditctl -w /path/to/keys -p rwxa -k sdlp-key-access
```

## Security Checklist

### Key Generation ✓
- [ ] Used cryptographically secure random number generator
- [ ] Generated keys on system with sufficient entropy
- [ ] Used recommended algorithms (Ed25519 preferred)
- [ ] Stored keys in appropriate format (JWK)

### Key Storage ✓
- [ ] Never stored production keys in plain text
- [ ] Used appropriate storage solution for environment
- [ ] Implemented proper access controls
- [ ] Enabled audit logging
- [ ] Considered HSM for high-security applications

### Key Rotation ✓
- [ ] Established rotation schedule
- [ ] Documented rotation procedures
- [ ] Tested rotation process in development
- [ ] Updated DID documents properly
- [ ] Maintained backward compatibility during transitions

### Key Revocation ✓
- [ ] Defined revocation triggers
- [ ] Documented revocation procedures
- [ ] Tested emergency revocation process
- [ ] Established notification procedures
- [ ] Implemented secure deletion practices

### Monitoring ✓
- [ ] Enabled key usage logging
- [ ] Implemented access monitoring
- [ ] Set up alerting for suspicious activities
- [ ] Regular audit log reviews
- [ ] Incident response procedures documented

## Common Pitfalls to Avoid

### ❌ Don't Do This

- **Plain Text Storage**: Never store private keys in plain text files
- **Version Control**: Never commit keys to Git repositories
- **Shared Keys**: Don't share the same key across multiple applications
- **Weak Entropy**: Don't generate keys on systems with insufficient randomness
- **No Rotation**: Don't use the same key indefinitely
- **Insecure Transmission**: Don't send keys over unencrypted channels
- **Hardcoded Keys**: Don't embed keys directly in source code

### ✅ Best Practices

- **Defense in Depth**: Use multiple layers of security
- **Regular Audits**: Conduct periodic security reviews
- **Incident Planning**: Have a key compromise response plan
- **Documentation**: Keep detailed records of key management procedures
- **Testing**: Regularly test key rotation and revocation procedures
- **Training**: Ensure team members understand key management importance

## Getting Help

If you need assistance with key management:

1. **Review the SDLP Specification**: [specs/sdlp-v0.1-draft.md](../specs/sdlp-v0.1-draft.md)
2. **Check the Getting Started Guide**: [GETTING_STARTED.md](../GETTING_STARTED.md)
3. **Consult the CLI Documentation**: [implementations/ts/sdlp-cli/README.md](../implementations/ts/sdlp-cli/README.md)
4. **Review Security Considerations**: [specs/threat-model.md](../specs/threat-model.md)

Remember: The security of SDLP depends entirely on proper key management. When in doubt, err on the side of caution and consult security professionals.
