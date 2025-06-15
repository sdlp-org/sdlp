/**
 * Cross-platform Brotli compression utilities
 * Uses Node.js built-in zlib for Node.js environments and brotli-wasm for browsers
 */

import { promisify } from "node:util";

// Detect environment
const isNode = typeof process !== "undefined" && process.versions?.node;

/**
 * Compress data using Brotli compression
 */
export async function compressBrotli(data: Uint8Array): Promise<Uint8Array> {
    if (isNode) {
        // Use Node.js built-in Brotli compression
        const zlib = await import("node:zlib");
        const brotliCompress = promisify(zlib.brotliCompress);
        const compressed = await brotliCompress(Buffer.from(data));
        return new Uint8Array(compressed);
    } else {
        // Use brotli-wasm for browser environments
        const brotliPromise = await import("brotli-wasm");
        const brotli = await brotliPromise.default;
        return brotli.compress(data);
    }
}

/**
 * Decompress Brotli-compressed data
 */
export async function decompressBrotli(compressedData: Uint8Array): Promise<Uint8Array> {
    if (isNode) {
        // Use Node.js built-in Brotli decompression
        const zlib = await import("node:zlib");
        const brotliDecompress = promisify(zlib.brotliDecompress);
        const decompressed = await brotliDecompress(Buffer.from(compressedData));
        return new Uint8Array(decompressed);
    } else {
        // Use brotli-wasm for browser environments
        const brotliPromise = await import("brotli-wasm");
        const brotli = await brotliPromise.default;
        return brotli.decompress(compressedData);
    }
} 
