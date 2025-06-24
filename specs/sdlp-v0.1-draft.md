# Secure Deep Link Protocol Proposal

**Version:** 0.1-mvp  
**Date:** Jun 3, 2025
**Status:** Draft for MVP Phase 1 Implementation
**Authors:** [Prem Pillai](mailto:prem@block.xyz)

## Abstract

This document proposes a "Secure Deep Link Protocol" designed to transmit arbitrary data payloads via deep links (custom URL schemes) with strong guarantees of authenticity and integrity. The protocol is optimized for capacity within common URL length constraints, supports flexible payload types and compression algorithms, and leverages standard cryptographic primitives like JWS (JSON Web Signature) for signing and Decentralized Identifiers (DIDs) for sender identification. It is intended for use cases where a single, verifiable link needs to be shared across various channels (e.g., chat, email, QR codes), such as distributing parameterised AI prompts, configurations, or small data objects. While the protocol itself is generic (`sdlp://`), applications can implement it using their own custom schemes (e.g., `myapp://`, `goose://`).

## 1. Introduction

Deep links offer a powerful mechanism for inter-application communication and invoking specific functionalities with contextual data. However, standard deep links lack inherent security features to verify the sender's authenticity or the integrity of the transmitted data. This proposal addresses this gap by defining a protocol that wraps a data payload within a cryptographically signed envelope, ensuring that the receiver can trust its origin and that it has not been tampered with.

The protocol prioritizes:

- **Authenticity:** Verifying the identity of the sender via Decentralized Identifiers (DIDs).
- **Integrity:** Ensuring the payload has not been altered.
- **Genericity:** Supporting diverse payload types (via MIME types) and compression algorithms.
- **Capacity:** Efficiently utilizing URL length for maximal payload size.
- **Interoperability:** Using established standards like JWS, Base64URL, and W3C DIDs.
- **Safety:** Enabling receivers to make informed decisions before processing payloads.

This protocol does not inherently provide confidentiality (encryption) or strong replay attack prevention beyond optional time-bounds, as these are often application-specific concerns that can be layered on top if required.

## 2. Terminology

- **Deep Link:** A URI that links to a specific location or resource within an application rather than a general website.
- **Custom URL Scheme:** A unique prefix for a URI (e.g., `myapp://`, `goose://`) that an operating system uses to route the link to a registered handler application.
- **Sender:** The entity creating and signing the Secure Deep Link, identified by a DID.
- **Receiver:** The application processing the Secure Deep Link.
- **Payload:** The actual data being transmitted.
- **JWS:** JSON Web Signature (RFC 7515).
- **DID:** Decentralized Identifier (W3C Recommendation). A globally unique persistent identifier that does not require a centralized registration authority.
- **DID Document:** A JSON document containing information associated with a DID, including cryptographic public keys for verification.
- **Base64URL:** Base64 Encoding with URL and Filename Safe Alphabet (RFC 4648, Section 5).

## 3. Protocol Definition

### 3.1. General Scheme and Application-Specific Schemes

This document defines the protocol mechanics using a generic scheme `sdlp://` for illustrative purposes. Implementers are encouraged to use their own application-specific custom URL schemes (e.g., `goose://`, `myapp://`) while adhering to the structure defined herein.

### 3.2. Deep Link Format

A Secure Deep Link is structured as follows: `<custom_scheme>://<base64url_encoded_jws_metadata_object>.<base64url_encoded_compressed_payload>`

- **<custom_scheme>://**: The scheme registered by the receiving application (e.g., `sdlp://`).
- **<base64url_encoded_jws_metadata_object>**: The first part, containing signed metadata as a Base64URL encoded Flattened JWS JSON Serialization object.
- **. (dot)**: A literal period character separating the two main parts.
- **<base64url_encoded_compressed_payload>**: The second part, containing the Base64URL encoded, compressed (or uncompressed) actual payload.

_Note on URL Encoding: The two main parts of the link are encoded using the Base64URL alphabet, which is safe for use in URLs without further percent-encoding. Receivers SHOULD NOT perform additional URL-decoding on the link content before parsing._

_Note on JWS/Payload Separation: This structure intentionally separates the JWS metadata object from the payload to avoid double Base64URL encoding. If the payload were embedded within the JWS structure (as is typical), it would need to be Base64URL encoded once to become the JWS payload field, then the entire JWS object would be Base64URL encoded again for URL transmission. This would result in approximately 78% size overhead (1.33 × 1.33 ≈ 1.78) compared to the original binary data. By separating them with a dot delimiter, we achieve only the necessary 33% overhead from single Base64URL encoding of the compressed payload, maximizing the usable payload capacity within URL length constraints._

### 3.3. JWS Metadata Object{#3.3.-jws-metadata-object}

This object provides verifiable information about the sender and the payload. After Base64URL decoding its string representation from the link, it forms a Flattened JWS JSON Serialization object:

```json
{
  "protected": "<Base64URL(JWS Protected Header JSON)>",
  "payload": "<Base64URL(Core Metadata JSON)>",
  "signature": "<Base64URL(JWS Signature)>"
}
```

**3.3.1. JWS Protected Header (RFC 7515)** This JSON object contains parameters integrity-protected by the signature. It MUST be Base64URL encoded to form the protected field value.

```json
{
  "alg": "EdDSA", // Algorithm. "EdDSA" (using Ed25519) is RECOMMENDED.
  // Other JWS-compliant algorithms MAY be supported.
  "kid": "<did_url_with_key_fragment>" // Key Identifier. Full DID URL pointing to a specific
  // verification method in the sender's DID Document.
  // (e.g., "did:example:12345#key-1")
}
```

- **kid (string):** Key Identifier. This MUST be a complete DID URL that includes a fragment identifier pointing to a specific verification method (public key) within the DID Document associated with the `sid` (Sender Identifier) from the Core Metadata. Example: "did:web:example.com#key-1".

**3.3.2. JWS Payload (Core Metadata JSON)** This JSON object contains the core metadata claims. It MUST be Base64URL encoded to form the payload field value in the JWS structure.

```json
{
  "v": "SDL-1.0", // Protocol Name and Version.
  "sid": "<sender_did_string>", // Sender Identifier (DID).
  "type": "<payload_mime_type_string>", // MIME type of the original, uncompressed payload.
  "comp": "<compression_algorithm_id>", // Algorithm used to compress the payload.
  "chk": "<sha256_hex_hash_original_uncompressed_payload>", // Integrity check for the final payload.
  "exp": <integer_unix_timestamp>, // Optional: Expiration time (RFC 7519).
  "nbf": <integer_unix_timestamp>  // Optional: Not Before time (RFC 7519).
}
```

- **v (string):** Identifies the protocol and its version (e.g., "SDL-1.0").
- **sid (string):** Sender Identifier. Specifies the sender's identity using a Decentralized Identifier (DID) (W3C Recommendation).
  - Example: "did:web:example.com", "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuZH8vPk9NVdatgsTT", "did:plc:...". The receiver uses this DID to resolve the sender's DID Document and locate the public key specified by the kid from the JWS Protected Header.
- **type (string):** The MIME type of the original, uncompressed payload (e.g., "application/yaml", "text/promptml", "application/octet-stream").
- **comp (string):** Identifier for the compression algorithm applied to the payload before its Base64URL encoding. Recommended values:
  - "br": Brotli
  - "gz": Gzip
  - "zstd": Zstandard
  - "none": No compression applied. For baseline interoperability, receivers MUST support `none`. Support for `br` is RECOMMENDED for efficiency. Support for `gz` and `zstd` is OPTIONAL.
- **chk (string):** The hexadecimal string representation of the SHA-256 hash of the original, uncompressed payload data.
- **exp (integer, optional):** Expiration time. Unix timestamp (seconds since epoch). If present, the link MUST NOT be processed on or after this time.
- **nbf (integer, optional):** Not Before time. Unix timestamp. If present, the link MUST NOT be processed before this time.

### 3.4. Actual Payload{#3.4.-actual-payload}

The second part of the deep link (after the dot separator and Base64URL decoding) is the binary payload data, which has been compressed according to the comp field in the Core Metadata.

### 3.5. Signature Generation and Verification

The JWS signature is generated and verified according to RFC 7515. The JWS Signing Input is: ASCII(BASE64URL(UTF8(JWS Protected Header)) + '.' + BASE64URL(UTF8(JWS Payload))) This input is signed by the sender using the private key corresponding to the public key identified by kid (which is a key within the DID Document of the sid). Receivers MUST verify this signature.

### 3.6. URL Length and Payload Capacity Considerations

The protocol aims to maximize usable payload within typical URL length limits.

- **Baseline Interoperability Profile (e.g., for QR Codes):** A shorter total URL length (e.g., 2,500 characters) is recommended for broad compatibility. This results in a compressed payload capacity of approximately 1.2 KB. Senders targeting this profile must ensure their payload fits this constraint.
- **Extended Capacity Profile:** Modern environments may support URLs up to 32,000 characters or more for deep links handled by OS-level registrars. With this target, after accounting for estimated metadata overhead (800-900 characters for Base64URL encoded JWS Metadata Object with DID-based sid and kid), approximately 31,000 characters remain for the Base64URL encoded compressed payload. This translates to roughly 23 KB of actual (compressed according to comp) payload data.
  - Payload Ratio: $\approx 23\text{KB} / 32\text{KB} \approx 72%$
- Senders should choose a payload size appropriate for their intended distribution channels and receiver capabilities.

### 3.7. Sender Workflow Summary

1. Prepare the original payload data.
2. Determine its MIME type (type).
3. Calculate the SHA-256 hash of the original payload (chk).
4. Choose a compression algorithm (comp). Compress the payload (unless comp is "none").
5. Base64URL encode the (compressed) payload data. This forms the second part of the link.
6. Construct the Core Metadata JSON object (v, sid [sender's DID], type, comp, chk, optional exp/nbf).
7. Construct the JWS Protected Header JSON object (alg, kid [DID URL with key fragment]).
8. Generate the JWS (Flattened JSON Serialization) by signing the Core Metadata with the sender's private key corresponding to the specified kid, using the specified alg.
9. Base64URL encode the complete JWS object. This forms the first part of the link.
10. Assemble the full deep link: <custom_scheme>://<part1>.<part2>.

### 3.8. Receiver Workflow Summary

_Note: The term "ABORT" in this workflow signifies that the entire process MUST be terminated immediately, and the link MUST be treated as invalid. No further processing should occur, and the receiver SHOULD present an appropriate error to the user or calling application._

1.  **Strictly Parse the Deep Link:**
    a. Extract the scheme and verify it is the expected one (e.g., `sdlp://`).
    b. Remove the scheme prefix (`sdlp://`) to get the link's content.
    c. Split the content string by the `.` delimiter. The result MUST be an array of exactly two non-empty strings: `part1_b64` (the JWS) and `part2_b64` (the payload).
    d. If the link does not conform to this exact structure, it is invalid; ABORT.
2.  Base64URL decode `part1_b64` to get the JWS Metadata Object (JSON).
3.  Parse JWS: Extract `protected` (string), `payload` (string), and `signature` (string) segments.
4.  Decode Headers & Core Metadata: Base64URL decode the `protected` segment (JWS Protected Header) and `payload` segment (Core Metadata). Parse the resulting JSONs.
5.  **Key Discovery & DID Resolution:**
    a. Extract the sender's DID from the `sid` field (Core Metadata) and the key identifier from the `kid` field (JWS Protected Header).
    b. The `kid`'s base DID (the part before the `#` fragment) MUST be identical to the `sid` DID. If they do not match, the link is invalid; ABORT.
    c. Resolve the DID specified in `sid` using a conformant DID resolver for its method (e.g., `did:web`, `did:key`, `did:plc`). This process retrieves the DID Document.
    d. From the resolved DID Document, locate the public key (verification method) identified by the full `kid`.
    e. If DID resolution fails, the specified `kid` is not found in the DID Document, or the key material is not appropriate for signature verification, the link is invalid; ABORT.
6. **JWS Verification:** Verify the JWS signature using the retrieved public key, alg, and the protected, payload, and signature segments. If verification fails, the link is invalid; ABORT.
7. **Time-Bound Check:** If exp or nbf are present in Core Metadata, validate them against the current time. If checks fail, the link is not currently valid; ABORT.
8. **Sender Information Display:** After successful JWS verification, display information about the verified sender to the user. This should be based on the resolved DID (sid) and potentially enhanced with data from the DID Document (e.g., service endpoints, linked profiles if available). Clearly indicate trust status (e.g., known/trusted DID, new DID).
9. **Payload Retrieval:**
   1. Base64URL decode part2_b64 to get the (potentially) compressed payload data.
   2. Decompress this data using the algorithm specified in the comp field from Core Metadata. (If comp is "none", no decompression).
      Handle unsupported compression algorithms gracefully.
10. **Payload Integrity Check:** Calculate the SHA-256 hash of the fully decompressed payload. Compare it with the chk field from Core Metadata. If hashes do not match, the payload is corrupted or altered; ABORT.
11. **Payload Processing & User Confirmation:**
    1. Interpret the payload based on its type (from Core Metadata).
    2. If applicable, validate the payload against any known schemas or rules for that type.
    3. **Crucially, before taking any significant action, present the verified sender information (based on the resolved DID), payload type, and a summary/preview of the intended action to the user and request explicit confirmation.**
12. **Controlled Execution:** If all checks pass and the user confirms, process the payload in a sandboxed or appropriately restricted environment.

## 4. Security Considerations

- **Trust in DID Resolution:** The security of sender authentication relies on the integrity and security of the specific DID method used (e.g., HTTPS and DNSSEC for did:web, blockchain consensus for DIDs like did:ion, cryptographic derivation for did:key) and the conformant operation of the DID resolver.
- **Private Key Security:** Senders are responsible for securing their private keys. Compromise of a private key allows impersonation of the DID. Use of hardware security modules or secure enclaves for private key storage is recommended for high-value DIDs.
- **Key Management and Rotation:** Senders are responsible for managing their keys within their DID Document. Receivers SHOULD fetch the latest DID Document for verification. For signatures where the `kid` is valid but no longer present in the resolved DID Document (i.e., a rotated key), receivers MAY have a policy to trust the signature based on a previously cached version of the DID Document (a form of Trust On First Use), but this increases the risk of accepting signatures from a key that was deliberately revoked.
- **DID Resolution Failures:** If a DID cannot be resolved (e.g., due to a network failure, DNS outage for `did:web`, etc.), the link cannot be verified and MUST be rejected. Implementations SHOULD surface a distinct error to the user indicating a resolution failure, as this is a different condition from an invalid signature.
- **Clock Skew:** The `exp` and `nbf` fields are sensitive to clock differences between the sender and receiver. Receivers SHOULD allow for a small, configurable grace period (e.g., 30-60 seconds) when validating these timestamps to account for minor clock skew.
- **Payload Handling:** Receivers MUST treat all incoming payloads as potentially untrusted until all verifications (signature, checksum, schema) pass. Payloads, especially those that can trigger actions (e.g., AI prompts, scripts, configurations), MUST be handled in a sandboxed or controlled manner.
- **No Confidentiality:** This protocol does not encrypt the payload. Sensitive data should not be transmitted unless an additional encryption layer is applied (outside the scope of this version).
- **Replay Attacks:** The optional exp and nbf fields offer basic time-windowing. Applications requiring stronger replay protection must implement additional mechanisms.
- **MIME Type Handling:** Incorrect or malicious type or comp values could lead to vulnerabilities if the receiver's parsers/decompressors are flawed. Receivers should use robust, well-tested libraries.
- **User Confirmation:** User confirmation before action is a critical defense layer, even for verified links.

## 5. Interoperability Considerations

- **JWS Libraries:** Use of JWS allows leveraging standard cryptographic libraries for signature generation and verification.
- **MIME Types:** Adherence to standard MIME types for the type field promotes interoperability.
- **Decentralized Identifiers (DIDs):** Relying on W3C DIDs leverages a growing, standardized ecosystem for identity, supporting various underlying methods (e.g., did:web, did:key, did:ion, did:plc) suitable for both organizations and individuals.

## 6. Future Directions

- **Optional Encryption (JWE):** A future version could define a mechanism to optionally encrypt the payload, potentially using JWE (JSON Web Encryption).
- **Rich Sender Profile Discovery:** While DIDs can link to service endpoints and other profile data, further conventions could enhance how rich, verifiable profile information is discovered and presented to users.
- **Standardized DID Document Content:** For SDLPs, defining specific service endpoint types or verification method properties within DID Documents could further streamline integration.
- **Formal Registration:** Consideration for IANA registration of the SDLP scheme if it gains broad adoption, or guidance for application-specific scheme usage.

This Secure Deep Link Protocol provides a robust framework for sharing data with verifiable authenticity and integrity, addressing a clear need in modern application ecosystems, particularly for emerging use cases like secure AI prompt sharing, by leveraging the power and flexibility of Decentralized Identifiers.
