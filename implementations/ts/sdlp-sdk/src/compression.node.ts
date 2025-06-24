/**
 * Node.js-specific Brotli compression utilities
 * Uses Node.js built-in zlib module
 */

import { promisify } from 'node:util';
import { brotliCompress, brotliDecompress } from 'node:zlib';

const compress = promisify(brotliCompress);
const decompress = promisify(brotliDecompress);

/**
 * Compress data using Brotli compression (Node.js implementation)
 */
export async function compressBrotli(data: Uint8Array): Promise<Uint8Array> {
  const compressed = await compress(Buffer.from(data));
  return new Uint8Array(compressed);
}

/**
 * Decompress Brotli-compressed data (Node.js implementation)
 */
export async function decompressBrotli(
  compressedData: Uint8Array
): Promise<Uint8Array> {
  const decompressed = await decompress(Buffer.from(compressedData));
  return new Uint8Array(decompressed);
}
