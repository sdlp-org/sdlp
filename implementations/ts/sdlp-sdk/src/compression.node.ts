/**
 * Brotli compression utilities for Node.js
 */

import { promisify } from 'node:util';
import { brotliCompress, brotliDecompress } from 'node:zlib';

const brotliCompressAsync = promisify(brotliCompress);
const brotliDecompressAsync = promisify(brotliDecompress);

/**
 * Compress data using Brotli compression
 */
export async function compressBrotli(data: Uint8Array): Promise<Uint8Array> {
  const compressed = await brotliCompressAsync(Buffer.from(data));
  return new Uint8Array(compressed);
}

/**
 * Decompress Brotli-compressed data
 */
export async function decompressBrotli(
  compressedData: Uint8Array
): Promise<Uint8Array> {
  const decompressed = await brotliDecompressAsync(Buffer.from(compressedData));
  return new Uint8Array(decompressed);
}
