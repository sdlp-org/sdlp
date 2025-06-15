/**
 * Tests for DID resolution functionality
 */

import { describe, it, expect } from "vitest";
import { resolveDid, extractDidFromKid } from "../src/did-resolver.js";

describe("DID Resolver", () => {
    describe("resolveDid", () => {
        it("should resolve did:key identifiers", async () => {
            // Test with a valid did:key (Ed25519)
            const did = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
            const result = await resolveDid(did);

            expect(result).toBeDefined();
            expect(result).toMatchObject({
                kty: "OKP",
                crv: "Ed25519",
                x: expect.any(String),
            });
        });

        it("should handle invalid did:key format", async () => {
            const invalidDid = "did:key:invalid-format";
            const result = await resolveDid(invalidDid);

            expect(result).toBeNull();
        });

        it("should handle did:key without z prefix", async () => {
            const invalidDid = "did:key:MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
            const result = await resolveDid(invalidDid);

            expect(result).toBeNull();
        });

        it("should handle did:key with wrong multicodec", async () => {
            // Create a did:key with wrong multicodec prefix (not 0xed for Ed25519)
            const invalidDid = "did:key:z4MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
            const result = await resolveDid(invalidDid);

            expect(result).toBeNull();
        });

        it("should handle test domains gracefully", async () => {
            const testDids = [
                "did:web:acme.example",
                "did:web:test.example",
            ];

            for (const did of testDids) {
                const result = await resolveDid(did);
                expect(result).toBeNull();
            }
        });

        it("should handle unsupported DID methods", async () => {
            const unsupportedDid = "did:ethr:0x1234567890abcdef";
            const result = await resolveDid(unsupportedDid);

            expect(result).toBeNull();
        });

        it("should handle malformed DIDs", async () => {
            const malformedDids = [
                "not-a-did",
                "did:",
                "did:invalid",
                "",
            ];

            for (const did of malformedDids) {
                const result = await resolveDid(did);
                expect(result).toBeNull();
            }
        });
    });

    describe("extractDidFromKid", () => {
        it("should extract DID from valid kid", () => {
            const kid = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
            const result = extractDidFromKid(kid);

            expect(result).toBe("did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK");
        });

        it("should extract DID from did:web kid", () => {
            const kid = "did:web:example.com#key-1";
            const result = extractDidFromKid(kid);

            expect(result).toBe("did:web:example.com");
        });

        it("should throw error for kid without fragment", () => {
            const invalidKid = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";

            expect(() => extractDidFromKid(invalidKid)).toThrow("Invalid kid format");
        });

        it("should throw error for empty kid", () => {
            expect(() => extractDidFromKid("")).toThrow("Invalid kid format");
        });

        it("should handle kid with multiple hash symbols", () => {
            const kid = "did:web:example.com#key-1#extra";
            const result = extractDidFromKid(kid);

            expect(result).toBe("did:web:example.com");
        });
    });
}); 
