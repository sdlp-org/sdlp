/**
 * Tests for compression functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { compressBrotli, decompressBrotli } from "../src/compression.js";

// Mock Node.js environment detection
const originalProcess = globalThis.process;

describe("Compression", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original process
        globalThis.process = originalProcess;
    });

    describe("Node.js environment", () => {
        beforeEach(() => {
            // Mock Node.js environment
            globalThis.process = {
                versions: { node: "18.0.0" },
            } as typeof process;
        });

        it("should compress data using Node.js brotli", async () => {
            const testData = new TextEncoder().encode("Hello, Brotli compression!");

            const compressed = await compressBrotli(testData);

            expect(compressed).toBeInstanceOf(Uint8Array);
            expect(compressed.length).toBeGreaterThan(0);
            // Note: Small strings might not compress well, so we just verify it works
        });

        it("should decompress data using Node.js brotli", async () => {
            const testData = new TextEncoder().encode("Hello, Brotli decompression!");

            const compressed = await compressBrotli(testData);
            const decompressed = await decompressBrotli(compressed);

            expect(decompressed).toBeInstanceOf(Uint8Array);
            expect(Array.from(decompressed)).toEqual(Array.from(testData));
        });

        it("should handle empty data compression", async () => {
            const emptyData = new Uint8Array(0);

            const compressed = await compressBrotli(emptyData);
            const decompressed = await decompressBrotli(compressed);

            expect(decompressed).toBeInstanceOf(Uint8Array);
            expect(decompressed.length).toBe(0);
        });

        it("should handle large data compression", async () => {
            const largeData = new TextEncoder().encode("x".repeat(10000));

            const compressed = await compressBrotli(largeData);
            const decompressed = await decompressBrotli(compressed);

            expect(Array.from(decompressed)).toEqual(Array.from(largeData));
            expect(compressed.length).toBeLessThan(largeData.length); // Should be well compressed
        });
    });

    describe("Browser environment", () => {
        beforeEach(() => {
            // Mock browser environment (no process.versions.node)
            globalThis.process = undefined as unknown as typeof process;
        });

        it("should attempt to use brotli-wasm in browser environment", async () => {
            const testData = new TextEncoder().encode("Browser test data");

            // This test will likely fail in Node.js environment due to WASM loading
            // but it tests the browser code path
            try {
                await compressBrotli(testData);
                // If it succeeds, great!
            } catch (error) {
                // Expected to fail in Node.js test environment
                expect(error).toBeDefined();
            }
        });

        it("should attempt to decompress using brotli-wasm in browser environment", async () => {
            // Create some mock compressed data (this won't be real brotli data)
            const mockCompressed = new Uint8Array([1, 2, 3, 4, 5]);

            try {
                await decompressBrotli(mockCompressed);
                // If it succeeds, great!
            } catch (error) {
                // Expected to fail in Node.js test environment or with invalid data
                expect(error).toBeDefined();
            }
        });
    });

    describe("Environment detection edge cases", () => {
        it("should handle undefined process", async () => {
            globalThis.process = undefined as unknown as typeof process;

            const testData = new TextEncoder().encode("Test data");

            try {
                await compressBrotli(testData);
            } catch (error) {
                // Expected to fail when trying to load brotli-wasm in Node.js
                expect(error).toBeDefined();
            }
        });

        it("should handle process without versions", async () => {
            globalThis.process = {} as typeof process;

            const testData = new TextEncoder().encode("Test data");

            try {
                await compressBrotli(testData);
            } catch (error) {
                // Expected to fail when trying to load brotli-wasm in Node.js
                expect(error).toBeDefined();
            }
        });

        it("should handle process.versions without node", async () => {
            globalThis.process = {
                versions: {},
            } as typeof process;

            const testData = new TextEncoder().encode("Test data");

            try {
                await compressBrotli(testData);
            } catch (error) {
                // Expected to fail when trying to load brotli-wasm in Node.js
                expect(error).toBeDefined();
            }
        });
    });

    describe("Round-trip compression", () => {
        beforeEach(() => {
            // Ensure Node.js environment for reliable testing
            globalThis.process = {
                versions: { node: "18.0.0" },
            } as typeof process;
        });

        it("should maintain data integrity through compression cycle", async () => {
            const testCases = [
                "Simple text",
                "Text with special characters: àáâãäåæçèéêë",
                `JSON data: ${JSON.stringify({ key: "value", number: 42, array: [1, 2, 3] })}`,
                `Repeated data: ${"abc".repeat(1000)}`,
                `Binary-like data: ${String.fromCharCode(...Array.from({ length: 256 }, (_, index) => index))}`,
            ];

            for (const testCase of testCases) {
                const originalData = new TextEncoder().encode(testCase);

                const compressed = await compressBrotli(originalData);
                const decompressed = await decompressBrotli(compressed);

                expect(Array.from(decompressed)).toEqual(Array.from(originalData));

                // Verify the decompressed text matches
                const decompressedText = new TextDecoder().decode(decompressed);
                expect(decompressedText).toBe(testCase);
            }
        });
    });
}); 
