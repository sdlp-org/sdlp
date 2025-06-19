# SDLP Threat Model

**Version:** 1.0  
**Date:** December 2024  
**Status:** Final  
**Based on:** SDLP v0.1 Draft Specification

## 1. Introduction

This document presents a formal threat model for the Secure Deep Link Protocol (SDLP) using the STRIDE methodology. The threat model identifies potential security threats, evaluates existing controls, and documents residual risks for implementers and security architects.

## 2. System Overview

The SDLP system consists of:

- **Senders:** Entities creating and signing secure deep links using DID-based identity
- **Receivers:** Applications processing and verifying secure deep links
- **DID Infrastructure:** Decentralized identifier resolution systems
- **Transport:** Various channels (chat, email, QR codes) for link distribution

## 3. Threat Analysis (STRIDE)

### 3.1 Spoofing Threats

#### 3.1.1 Threat: Attacker Impersonates Trusted Sender

**Description:** An attacker creates a link appearing to be from a trusted sender to deceive receivers.

**Attack Vectors:**

- Using a similar-looking DID (`did:web:examp1e.com` vs `did:web:example.com`)
- Compromising a sender's private key
- DNS/TLS compromise for `did:web` methods
- Social engineering to get users to trust malicious DIDs

**Primary Controls:**

- JWS signature verification against the sender's public key resolved via the `sid` DID
- DID-based sender identification with cryptographic verification
- `kid`/`sid` base DID matching requirement prevents cross-DID key reuse

**Secondary Controls:**

- User interface clearly displays verified sender DID
- Trust-on-first-use (TOFU) policies for new DIDs
- DID reputation systems (application-specific)

**Residual Risks:**

- **HIGH:** Compromise of sender's private key enables complete impersonation
- **MEDIUM:** DNS/TLS compromise for `did:web` methods
- **LOW:** User confusion with similar-looking DIDs

#### 3.1.2 Threat: DID Method Compromise

**Description:** Compromise of underlying infrastructure for specific DID methods.

**Controls:**

- Multiple DID method support allows diversity
- DID document integrity verification per method specification

**Residual Risks:**

- **MEDIUM:** Method-specific infrastructure vulnerabilities

### 3.2 Tampering Threats

#### 3.2.1 Threat: Link Metadata Tampering

**Description:** Attacker modifies JWS metadata in transit.

**Primary Controls:**

- JWS signature protects all metadata fields
- Base64URL encoding integrity

**Residual Risks:**

- **LOW:** Successful tampering would invalidate signature and be detected

#### 3.2.2 Threat: Payload Tampering

**Description:** Attacker modifies the payload portion of the link.

**Primary Controls:**

- SHA-256 checksum (`chk`) of original payload included in signed metadata
- Checksum verification before payload processing

**Residual Risks:**

- **LOW:** Tampering would be detected via checksum mismatch

#### 3.2.3 Threat: Compression Algorithm Substitution

**Description:** Attacker changes the compression algorithm identifier to cause decompression failures or exploits.

**Primary Controls:**

- Compression algorithm (`comp`) included in signed metadata
- Receiver validates supported compression algorithms

**Residual Risks:**

- **LOW:** Algorithm identifier is integrity protected by signature

### 3.3 Repudiation Threats

#### 3.3.1 Threat: Sender Denies Creating Link

**Description:** A legitimate sender denies having created a link.

**Primary Controls:**

- Cryptographic signature provides non-repudiation
- DID-based identity tied to cryptographic keys
- Optional timestamp fields (`exp`, `nbf`) for temporal verification

**Residual Risks:**

- **LOW:** Strong cryptographic non-repudiation with Ed25519 signatures
- **MEDIUM:** Private key compromise claims (requires investigation)

### 3.4 Information Disclosure Threats

#### 3.4.1 Threat: Payload Content Exposure

**Description:** Sensitive payload content is readable by intermediaries or unauthorized parties.

**Controls:**

- **NONE INHERENT:** SDLP v1.0 does not provide confidentiality

**Mitigations (Application Layer):**

- Use JWE (JSON Web Encryption) for sensitive payloads
- Application-layer encryption before SDLP packaging
- Avoid transmitting sensitive data in links

**Residual Risks:**

- **HIGH:** All payload content is readable by anyone with the link

#### 3.4.2 Threat: Sender Identity Disclosure

**Description:** Sender identity is always visible in clear text.

**Controls:**

- **NONE INHERENT:** Sender DID is required for verification

**Mitigations:**

- Use privacy-preserving DID methods where appropriate
- Consider delegated signing for privacy-sensitive scenarios

**Residual Risks:**

- **MEDIUM:** Sender identity always disclosed as part of protocol design

#### 3.4.3 Threat: Metadata Leakage

**Description:** Metadata reveals information about payload type, compression, etc.

**Controls:**

- **MINIMAL:** Basic metadata required for safe processing

**Residual Risks:**

- **LOW:** Minimal metadata exposure necessary for security

### 3.5 Denial of Service Threats

#### 3.5.1 Threat: Malformed Link Processing

**Description:** Attacker sends malformed links to crash or overload receivers.

**Primary Controls:**

- Maximum URL length enforcement
- Robust JSON parsing with error handling
- Base64URL decoding validation
- JWS structure validation

**Residual Risks:**

- **LOW:** Well-implemented parsers should handle malformed input gracefully

#### 3.5.2 Threat: DID Resolution DoS

**Description:** Attacker forces expensive DID resolution operations.

**Primary Controls:**

- DID document caching with proper TTL/Cache-Control header respect
- Rate limiting on DID resolution requests
- Timeout enforcement for resolution operations

**Residual Risks:**

- **MEDIUM:** Novel or complex DIDs may require expensive resolution

#### 3.5.3 Threat: Decompression Bomb

**Description:** Attacker crafts payload that expands to consume excessive memory/CPU during decompression.

**Primary Controls:**

- Maximum decompressed payload size limits
- Decompression timeout enforcement
- Memory usage monitoring during decompression

**Residual Risks:**

- **MEDIUM:** Requires careful implementation of decompression limits

#### 3.5.4 Threat: Cryptographic DoS

**Description:** Attacker forces expensive signature verification operations.

**Primary Controls:**

- Signature algorithm allow-list (default to `['EdDSA']`)
- Rejection of computationally expensive algorithms
- Rate limiting on verification operations

**Residual Risks:**

- **LOW:** Ed25519 signature verification is computationally efficient

### 3.6 Elevation of Privilege Threats

#### 3.6.1 Threat: Malicious Payload Execution

**Description:** Valid link from compromised or malicious sender causes receiver to perform dangerous actions.

**Primary Controls:**

- **NONE INHERENT:** Protocol authenticates sender but cannot prevent malicious intent

**Mitigations (Application Layer):**

- Sandboxed payload processing environments
- User confirmation before significant actions
- Payload validation against known-safe schemas
- Principle of least privilege for link handlers

**Residual Risks:**

- **HIGH:** Protocol cannot prevent authorized but malicious actions

#### 3.6.2 Threat: Parser/Library Vulnerabilities

**Description:** Vulnerabilities in JSON parsers, cryptographic libraries, or decompression code allow privilege escalation.

**Primary Controls:**

- Use of well-established, audited libraries (`jose`, `brotli-wasm`)
- Regular dependency updates
- Input validation and sanitization

**Residual Risks:**

- **MEDIUM:** Dependency on third-party library security

## 4. Implementation Security Considerations

### 4.1 For Receivers

1. **Implement Strict Input Validation:**

   - Enforce maximum URL length (recommended: 32KB)
   - Validate Base64URL encoding before decoding
   - Verify JWS structure before signature verification

2. **Use Safe Decompression:**

   - Implement decompression bomb protection (max size: 10MB recommended)
   - Set decompression timeouts
   - Monitor memory usage during decompression

3. **Secure DID Resolution:**

   - Cache DID documents with appropriate TTL
   - Implement resolution timeouts
   - Validate DID document structure

4. **User Experience Security:**
   - Clearly display verified sender identity
   - Show trust status (known/unknown DID)
   - Require explicit user confirmation for actions
   - Provide payload preview/summary before execution

### 4.2 For Senders

1. **Private Key Security:**

   - Use hardware security modules (HSMs) for high-value keys
   - Implement proper key rotation procedures
   - Secure key storage and access controls

2. **DID Management:**
   - Keep DID documents up-to-date
   - Use appropriate DID methods for use case
   - Consider key rotation and revocation procedures

### 4.3 For Application Developers

1. **Choose Appropriate DID Methods:**

   - `did:key` for simple, self-contained use cases
   - `did:web` for organization-based identity
   - Consider privacy implications of DID method choice

2. **Implement Defense in Depth:**
   - Don't rely solely on SDLP for security
   - Add application-layer encryption for sensitive data
   - Implement proper access controls and audit logging

## 5. Risk Assessment Summary

| Risk Category              | Overall Risk | Key Concerns                             |
| -------------------------- | ------------ | ---------------------------------------- |
| **Spoofing**               | MEDIUM       | Private key compromise, DNS attacks      |
| **Tampering**              | LOW          | Well-protected by cryptographic controls |
| **Repudiation**            | LOW          | Strong cryptographic non-repudiation     |
| **Information Disclosure** | HIGH         | No inherent confidentiality              |
| **Denial of Service**      | MEDIUM       | Implementation-dependent protections     |
| **Elevation of Privilege** | HIGH         | Application-layer responsibility         |

## 6. Conclusion

SDLP provides strong authenticity and integrity guarantees through its cryptographic design. The primary security considerations for implementers are:

1. **Confidentiality:** Use additional encryption for sensitive data
2. **Implementation Security:** Follow secure coding practices for parsers and handlers
3. **User Experience:** Design clear, secure user interfaces for link verification
4. **Key Management:** Implement proper private key security measures

This threat model should be reviewed and updated as the protocol evolves and new attack vectors are discovered.
