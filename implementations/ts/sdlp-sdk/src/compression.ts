/**
 * Cross-platform Brotli compression utilities for SDLP payload compression.
 *
 * This module provides a unified interface for Brotli compression that works
 * across different JavaScript environments by automatically detecting the
 * runtime and loading the appropriate implementation:
 *
 * - Node.js: Uses the built-in `zlib` module for optimal performance
 * - Browser: Uses `brotli-wasm` for WebAssembly-based compression
 *
 * The compression functions are used internally by the SDLP SDK for payload
 * compression when the `compress: 'br'` option is specified in `createLink`.
 *
 * @module compression
 */

// Detect environment
const isNode =
  typeof process !== 'undefined' && process.versions?.node !== undefined;

/**
 * Compress data using Brotli compression algorithm.
 *
 * This function automatically selects the appropriate Brotli implementation
 * based on the runtime environment (Node.js vs browser) and compresses the
 * input data using optimal settings for SDLP payloads.
 *
 * @param data - The raw data to compress
 * @returns Promise resolving to the compressed data as Uint8Array
 *
 * @example
 * ```typescript
 * const payload = new TextEncoder().encode('{"message": "Hello, World!"}');
 * const compressed = await compressBrotli(payload);
 * console.log(`Original: ${payload.length} bytes, Compressed: ${compressed.length} bytes`);
 * ```
 */
export async function compressBrotli(data: Uint8Array): Promise<Uint8Array> {
  if (isNode) {
    // Use Node.js implementation
    const { compressBrotli: nodeCompress } = await import(
      './compression.node.js'
    );
    return nodeCompress(data);
  } else {
    // Use browser implementation
    const { compressBrotli: browserCompress } = await import(
      './compression.browser.js'
    );
    return browserCompress(data);
  }
}

/**
 * Decompress Brotli-compressed data back to its original form.
 *
 * This function automatically selects the appropriate Brotli implementation
 * based on the runtime environment and decompresses data that was previously
 * compressed using the `compressBrotli` function.
 *
 * @param compressedData - The Brotli-compressed data to decompress
 * @returns Promise resolving to the original uncompressed data as Uint8Array
 *
 * @throws {Error} When the compressed data is invalid or corrupted
 *
 * @example
 * ```typescript
 * const compressed = await compressBrotli(originalData);
 * const decompressed = await decompressBrotli(compressed);
 * // decompressed should be identical to originalData
 * ```
 */
export async function decompressBrotli(
  compressedData: Uint8Array
): Promise<Uint8Array> {
  if (isNode) {
    // Use Node.js implementation
    const { decompressBrotli: nodeDecompress } = await import(
      './compression.node.js'
    );
    return nodeDecompress(compressedData);
  } else {
    // Use browser implementation
    const { decompressBrotli: browserDecompress } = await import(
      './compression.browser.js'
    );
    return browserDecompress(compressedData);
  }
}
