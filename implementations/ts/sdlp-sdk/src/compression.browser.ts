/**
 * Browser-specific Brotli compression utilities
 * Uses brotli-wasm library
 */

import brotliPromise from 'brotli-wasm';

interface BrotliWasm {
  // eslint-disable-next-line no-unused-vars
  compress: (data: Uint8Array) => Uint8Array;
  // eslint-disable-next-line no-unused-vars
  decompress: (data: Uint8Array) => Uint8Array;
}

let brotliInstance: BrotliWasm | null = null;

async function getBrotli(): Promise<BrotliWasm> {
  // eslint-disable-next-line require-atomic-updates
  brotliInstance ??= await brotliPromise;
  return brotliInstance;
}

/**
 * Compress data using Brotli compression (Browser implementation)
 */
export async function compressBrotli(data: Uint8Array): Promise<Uint8Array> {
  const brotli = await getBrotli();
  return brotli.compress(data);
}

/**
 * Decompress Brotli-compressed data (Browser implementation)
 */
export async function decompressBrotli(
  compressedData: Uint8Array
): Promise<Uint8Array> {
  const brotli = await getBrotli();
  return brotli.decompress(compressedData);
}
