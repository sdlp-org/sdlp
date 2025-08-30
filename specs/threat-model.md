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

- **JWS Signature Verification:** The core defense is the cryptographic verification of the JWS signature against the public key resolved from the `sid` DID, as detailed in the _Receiver Workflow Summary_ (Section 3.8, Step 6).
- **DID-Based Sender Identification:** The protocol mandates sender identification via a DID in the `sid` field, with the public key for verification located via the `kid` field, ensuring cryptographic linkage (Section 3.3.2).
- **Cross-DID Key Reuse Prevention:** The receiver workflow explicitly requires that the base DID of the `kid` URL MUST match the `sid` DID, preventing an attacker from using a valid key from one DID to sign a link for another (Section 3.8, Step 5c).

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

- **Method Diversity:** The protocol is agnostic to the DID method, allowing implementers to choose methods whose security models they trust. The specification explicitly lists `did:web`, `did:key`, and `did:plc` as examples (Section 3.3.2).
- **Method-Specific Security:** The ultimate security relies on the guarantees of the chosen DID method (e.g., DNSSEC for `did:web`, cryptographic derivation for `did:key`), as noted in the _Security Considerations_ (Section 4).

**Residual Risks:**

- **MEDIUM:** Method-specific infrastructure vulnerabilities

### 3.2 Tampering Threats

#### 3.2.1 Threat: Link Metadata Tampering

**Description:** Attacker modifies JWS metadata in transit.

**Primary Controls:**

- **JWS Signature Protection:** All metadata, including the JWS Protected Header and the Core Metadata (JWS Payload), is covered by the JWS signature. Any modification would invalidate the signature, as defined in the signature generation process (Section 3.5).

**Residual Risks:**

- **LOW:** Successful tampering would invalidate signature and be detected

#### 3.2.2 Threat: Payload Tampering

**Description:** Attacker modifies the payload portion of the link.

**Primary Controls:**

- **Payload Checksum:** The `chk` field in the Core Metadata contains a SHA-256 hash of the original, uncompressed payload. Since the Core Metadata is protected by the JWS signature, this checksum is also integrity-protected (Section 3.3.2).
- **Mandatory Verification:** The receiver workflow mandates that after decompressing the payload, its SHA-256 hash MUST be calculated and compared against the `chk` value. A mismatch indicates tampering, and the process MUST be aborted (Section 3.8, Step 10).

**Residual Risks:**

- **LOW:** Tampering would be detected via checksum mismatch

#### 3.2.3 Threat: Compression Algorithm Substitution

**Description:** Attacker changes the compression algorithm identifier to cause decompression failures or exploits.

**Primary Controls:**

- **Signed `comp` Field:** The compression algorithm identifier is stored in the `comp` field within the Core Metadata, which is protected by the JWS signature. An attacker cannot change the algorithm without invalidating the signature (Section 3.3.2).
- **Graceful Handling:** The receiver workflow specifies that implementations should handle unsupported compression algorithms gracefully, preventing crashes or exploits based on an unexpected `comp` value (Section 3.8, Step 9.2).

**Residual Risks:**

- **LOW:** Algorithm identifier is integrity protected by signature

### 3.3 Repudiation Threats

#### 3.3.1 Threat: Sender Denies Creating Link

**Description:** A legitimate sender denies having created a link.

**Primary Controls:**

- **Cryptographic Signature:** The JWS signature, verifiable against the sender's public key, provides strong cryptographic evidence that the key holder associated with the `sid` DID created the link (Section 3.5).
- **DID-Based Identity:** The sender's identity is bound to the cryptographic key via the DID Document, making it difficult to repudiate ownership without claiming key compromise (Section 3.3.2).
- **Temporal Bounds:** The optional `exp` and `nbf` fields can be used to limit the validity window of a link, providing temporal context for the signature (Section 3.3.2).

**Residual Risks:**

- **LOW:** Strong cryptographic non-repudiation with Ed25519 signatures
- **MEDIUM:** Private key compromise claims (requires investigation)

### 3.4 Information Disclosure Threats

#### 3.4.1 Threat: Payload Content Exposure

**Description:** Sensitive payload content is readable by intermediaries or unauthorized parties.

**Controls:**

- **None by Design:** The protocol explicitly does not provide confidentiality for the payload, as stated in the _Security Considerations_ (Section 4). This is a deliberate design choice to prioritize simplicity and capacity.
- **Future Work:** The specification acknowledges that confidentiality can be layered on top and mentions JWE as a potential future direction (Section 6).

**Mitigations (Application Layer):**

- Use JWE (JSON Web Encryption) for sensitive payloads
- Application-layer encryption before SDLP packaging
- Avoid transmitting sensitive data in links

**Residual Risks:**

- **HIGH:** All payload content is readable by anyone with the link

#### 3.4.2 Threat: Sender Identity Disclosure

**Description:** Sender identity is always visible in clear text.

**Controls:**

- **None by Design:** The `sid` field, which contains the sender's DID, is a mandatory part of the Core Metadata and is required for the receiver to resolve the public key for signature verification (Section 3.3.2 and 3.8).

**Mitigations:**

- Use privacy-preserving DID methods where appropriate
- Consider delegated signing for privacy-sensitive scenarios

**Residual Risks:**

- **MEDIUM:** Sender identity always disclosed as part of protocol design

#### 3.4.3 Threat: Metadata Leakage

**Description:** Metadata reveals information about payload type, compression, etc.

**Controls:**

- **None by Design:** All fields within the Core Metadata (version, sender DID, payload type, compression algorithm, etc.) are unencrypted and visible to any party with access to the link. This is a necessary trade-off to allow receivers to make processing decisions (Section 3.3.2).

**Residual Risks:**

- **LOW:** Minimal metadata exposure necessary for security

### 3.5 Denial of Service Threats

#### 3.5.1 Threat: Malformed Link Processing

**Description:** Attacker sends malformed links to crash or overload receivers.

**Primary Controls:**

- **Strict Parsing:** The receiver workflow begins with a strict parsing requirement, mandating that the link MUST be split into exactly two non-empty parts separated by a dot. Any deviation results in an immediate abort, preventing further processing of malformed structures (Section 3.8, Step 1).
- **Component Validation:** The workflow implicitly requires valid Base64URL decoding and JSON parsing at multiple steps. Failures in these steps should be caught by robust libraries.
- **URL Length Limits:** The specification discusses URL length limits as a consideration for senders, which indirectly encourages receivers to enforce a reasonable maximum length (Section 3.6).

**Residual Risks:**

- **LOW:** Well-implemented parsers should handle malformed input gracefully

#### 3.5.2 Threat: DID Resolution DoS

**Description:** Attacker forces expensive DID resolution operations.

**Implementation-Layer Controls:**

- **DID Document Caching:** Receivers SHOULD cache resolved DID Documents to reduce redundant network requests, respecting HTTP caching headers where applicable (e.g., for `did:web`).
- **Resolution Timeouts:** Receivers MUST implement timeouts for DID resolution operations to prevent indefinite hangs, as suggested by the ABORT step in the workflow (Section 3.8, Step 5d).
- **Rate Limiting:** Application-level rate limiting on link processing can mitigate repeated resolution attempts from a malicious actor.

**Residual Risks:**

- **MEDIUM:** Novel or complex DIDs may require expensive resolution

#### 3.5.3 Threat: Decompression Bomb

**Description:** Attacker crafts payload that expands to consume excessive memory/CPU during decompression.

**Implementation-Layer Controls:**

- **Resource Limiting:** Receivers MUST implement limits on the maximum size of the decompressed payload to prevent excessive memory allocation.
- **Timeout Enforcement:** Decompression operations SHOULD be subject to a timeout to prevent CPU exhaustion attacks.
- **Safe Libraries:** Using well-vetted decompression libraries is critical, as noted in the _Security Considerations_ (Section 4).

**Residual Risks:**

- **MEDIUM:** Requires careful implementation of decompression limits

#### 3.5.4 Threat: Cryptographic DoS

**Description:** Attacker forces expensive signature verification operations.

**Implementation-Layer Controls:**

- **Algorithm Allow-List:** While the protocol allows for various JWS algorithms, it recommends "EdDSA" for its performance and security characteristics (Section 3.3.1). Receivers MUST maintain an allow-list of accepted algorithms and reject any link that specifies an unsupported or computationally expensive algorithm.
- **Rate Limiting:** Application-level rate limiting can prevent an attacker from forcing a large number of signature verifications.

**Residual Risks:**

- **LOW:** Ed25519 signature verification is computationally efficient

### 3.6 Elevation of Privilege Threats

#### 3.6.1 Threat: Malicious Payload Execution

**Description:** Valid link from compromised or malicious sender causes receiver to perform dangerous actions.

**Controls:**

- **None at Protocol Level:** The protocol is designed only to authenticate the _origin_ of a payload, not the _intent_ of the sender. This is explicitly stated in the _Security Considerations_ (Section 4).
- **Receiver Responsibility:** The specification places the full responsibility for safe payload handling on the receiver. The _Receiver Workflow Summary_ mandates sandboxed execution and explicit user confirmation before taking action as critical, required controls (Section 3.8, Steps 11 and 12).

**Mitigations (Application Layer):**

- Sandboxed payload processing environments
- User confirmation before significant actions
- Payload validation against known-safe schemas
- Principle of least privilege for link handlers

**Residual Risks:**

- **HIGH:** Protocol cannot prevent authorized but malicious actions

#### 3.6.2 Threat: Parser/Library Vulnerabilities

**Description:** Vulnerabilities in JSON parsers, cryptographic libraries, or decompression code allow privilege escalation.

**Implementation-Layer Controls:**

- **Use of Robust Libraries:** The specification's _Security Considerations_ advises that "Receivers should use robust, well-tested libraries" for parsing and decompression (Section 4).
- **Dependency Management:** Standard software supply chain security practices, such as regular dependency scanning and updates, are essential.
- **Input Validation:** The strict parsing and validation steps defined in the receiver workflow (Section 3.8) serve as a primary defense against malformed inputs that could trigger library vulnerabilities.

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
