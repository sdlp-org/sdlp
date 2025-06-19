# verifyLink Workflow Sequence Diagram

This diagram shows the complete workflow for verifying a Secure Deep Link, including the interaction between the SDLP SDK, DID resolver, and network components.

```mermaid
sequenceDiagram
    participant App as "Application"
    participant SDK as "SDLP SDK"
    participant Resolver as "DID Resolver"
    participant Network as "Network<br/>(DID Resolution)"

    Note over App,Network: verifyLink() Workflow

    App->>SDK: verifyLink(link, options)

    Note over SDK: 1. Parse Link Format
    SDK->>SDK: Split link by '.' separator
    SDK->>SDK: Decode JWS and payload parts

    Note over SDK: 2. Validate JWS Structure
    SDK->>SDK: Parse Flattened JWS JSON
    SDK->>SDK: Extract protected header & metadata
    SDK->>SDK: Validate algorithm in allow-list

    Note over SDK: 3. Time Bounds Validation
    SDK->>SDK: Check exp (expiration)
    SDK->>SDK: Check nbf (not-before)

    Note over SDK: 4. DID Resolution & Validation
    SDK->>SDK: Extract base DID from kid
    SDK->>SDK: Validate sid matches kid base DID
    SDK->>Resolver: resolve(sid)
    Resolver->>Network: Fetch DID Document
    Network-->>Resolver: DID Document
    Resolver-->>SDK: DIDResolutionResult
    SDK->>SDK: Find verification method by kid

    Note over SDK: 5. Cryptographic Verification
    SDK->>SDK: Extract public key from DID Document
    SDK->>SDK: Verify JWS signature

    Note over SDK: 6. Payload Processing
    SDK->>SDK: Decode payload from Base64URL
    SDK->>SDK: Decompress payload (if compressed)
    SDK->>SDK: Validate payload size limit
    SDK->>SDK: Verify payload checksum (chk)

    alt Verification Success
        SDK-->>App: VerificationSuccess<br/>{ valid: true, sender, payload, metadata }
    else Verification Failure
        SDK-->>App: VerificationFailure<br/>{ valid: false, error }
    end
```

## Workflow Steps

1. **Parse Link Format**: The SDK splits the SDLP link by the first '.' separator to extract the JWS and payload components, then decodes them from Base64URL.

2. **Validate JWS Structure**: The JWS component is parsed as Flattened JSON Serialization format, and the protected header and metadata are extracted and validated.

3. **Time Bounds Validation**: If present, the expiration (`exp`) and not-before (`nbf`) timestamps are checked against the current time.

4. **DID Resolution & Validation**: The sender's DID is resolved to obtain the DID Document, and the key specified in the `kid` field is located and validated.

5. **Cryptographic Verification**: The JWS signature is cryptographically verified using the sender's public key from the DID Document.

6. **Payload Processing**: The payload is decoded, decompressed (if necessary), size-validated, and its integrity is verified using the checksum.

The workflow returns either a `VerificationSuccess` result with the verified data or a `VerificationFailure` result with a structured error.
