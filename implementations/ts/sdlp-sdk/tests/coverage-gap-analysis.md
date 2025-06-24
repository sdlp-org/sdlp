# Test Coverage Gap Analysis for SDLP v1.0

This document maps all normative requirements (MUST/SHOULD) from `specs/sdlp-v0.1-draft.md` to existing test cases and identifies coverage gaps.

## Normative Requirements Analysis

### 3.2 Deep Link Format

- **REQUIREMENT**: Deep link MUST follow format `<custom_scheme>://<base64url_encoded_jws_metadata_object>.<base64url_encoded_compressed_payload>`
- **CURRENT COVERAGE**: ✅ Covered in `sdlp.test.ts` - "should handle missing dot separator", "should fail verification for a link with trailing data"
- **GAP**: Need test for wrong scheme format

### 3.3.1 JWS Protected Header

- **REQUIREMENT**: Protected header MUST be Base64URL encoded
- **CURRENT COVERAGE**: ✅ Covered in existing test vectors
- **REQUIREMENT**: `kid` MUST be a complete DID URL with fragment identifier
- **CURRENT COVERAGE**: ✅ Covered in `sdlp.test.ts` - "should reject invalid kid format"
- **GAP**: Need test for kid without fragment identifier

### 3.3.2 JWS Payload (Core Metadata)

- **REQUIREMENT**: Core metadata MUST be Base64URL encoded
- **CURRENT COVERAGE**: ✅ Covered in existing test vectors
- **REQUIREMENT**: `v` field identifies protocol version
- **CURRENT COVERAGE**: ✅ Covered in test vectors
- **GAP**: Need test for unsupported protocol version
- **REQUIREMENT**: `sid` MUST be a valid DID
- **CURRENT COVERAGE**: ✅ Covered in test vectors
- **GAP**: Need test for malformed DID format
- **REQUIREMENT**: `comp` - receivers MUST support "none", SHOULD support "br"
- **CURRENT COVERAGE**: ✅ Covered in `sdlp.test.ts` - brotli compression tests
- **GAP**: Need test for unsupported compression algorithm
- **REQUIREMENT**: `exp`/`nbf` - link MUST NOT be processed outside time bounds
- **CURRENT COVERAGE**: ✅ Covered in `sdlp.test.ts` - "should handle expired links"
- **GAP**: Need test for `nbf` (not before) validation

### 3.8 Receiver Workflow

- **REQUIREMENT**: Split content by `.` delimiter MUST result in exactly two non-empty strings
- **CURRENT COVERAGE**: ✅ Covered in input validation tests
- **REQUIREMENT**: If link doesn't conform to structure, ABORT
- **CURRENT COVERAGE**: ✅ Covered in input validation tests
- **REQUIREMENT**: `kid`'s base DID MUST be identical to `sid` DID
- **CURRENT COVERAGE**: ✅ Covered in test vectors - "kid/sid DID mismatch"
- **GAP**: Need more comprehensive DID mismatch scenarios
- **REQUIREMENT**: If DID resolution fails, link is invalid; ABORT
- **CURRENT COVERAGE**: ✅ Covered in `sdlp.test.ts` - "should handle DID resolution failures"
- **REQUIREMENT**: If JWS verification fails, link is invalid; ABORT
- **CURRENT COVERAGE**: ✅ Covered in test vectors - "Invalid signature"
- **REQUIREMENT**: If time-bound checks fail, link is not valid; ABORT
- **CURRENT COVERAGE**: ✅ Covered in `sdlp.test.ts` - expired links
- **GAP**: Need comprehensive time-bound edge cases
- **REQUIREMENT**: Calculate SHA-256 hash of decompressed payload and compare with `chk`
- **CURRENT COVERAGE**: ✅ Covered in test vectors - "Payload checksum mismatch"
- **GAP**: Need test for hash calculation with different payload sizes

## Identified Test Gaps

### High Priority Gaps

1. **Unsupported Protocol Version**: Test `v` field with unsupported version
2. **Malformed DID Format**: Test `sid` with invalid DID syntax
3. **Unsupported Compression Algorithm**: Test `comp` with unknown algorithm
4. **Not Before Time Validation**: Test `nbf` field validation
5. **Kid Without Fragment**: Test `kid` without `#fragment`
6. **Wrong Scheme Format**: Test non-sdlp schemes
7. **Comprehensive DID Mismatch**: More scenarios for `kid`/`sid` mismatch
8. **Time-bound Edge Cases**: Clock skew, boundary conditions
9. **Large Payload Hash Validation**: Test checksum with various payload sizes

### Medium Priority Gaps

1. **Algorithm Agility Edge Cases**: Test with various JWS algorithms
2. **Compression Edge Cases**: Test compression with empty payloads
3. **Base64URL Edge Cases**: Test padding and character set validation
4. **Error Message Consistency**: Ensure all error types have proper messages

### Low Priority Gaps

1. **Performance Edge Cases**: Very large payloads within limits
2. **Unicode Handling**: Test with various character encodings
3. **Metadata Field Validation**: Test optional field edge cases
