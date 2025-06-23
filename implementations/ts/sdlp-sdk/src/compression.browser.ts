/**
 * Cross-platform Brotli compression utilities for browsers
 */

/**
 * Compress data using Brotli compression
 */
export async function compressBrotli(data: Uint8Array): Promise<Uint8Array> {
  // Use brotli-wasm for browser environments
  const brotliPromise = await import('brotli-wasm');
  const brotli = await brotliPromise.default;
  return brotli.compress(data);
}

/**
 * Decompress Brotli-compressed data
 */
export async function decompressBrotli(
  compressedData: Uint8Array
): Promise<Uint8Array> {
  // Use brotli-wasm for browser environments
  const brotliPromise = await import('brotli-wasm');
  const brotli = await brotliPromise.default;
  return brotli.decompress(compressedData);
}
