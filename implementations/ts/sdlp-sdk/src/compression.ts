/**
 * Cross-platform Brotli compression utilities
 * Uses environment detection to load the appropriate implementation
 */

// Detect environment
const isNode =
  typeof process !== 'undefined' && process.versions?.node !== undefined;

/**
 * Compress data using Brotli compression
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
 * Decompress Brotli-compressed data
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
