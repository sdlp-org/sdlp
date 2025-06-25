/**
 * Tests for edge case test vectors
 * This file validates the edge case test vectors and ensures they behave as expected
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { verifyLink } from '../src/index.js';

// Load edge case test vectors
const edgeCaseVectorsPath = '../../../specs/sdlp-edge-case-vectors-v1.json';
const edgeCaseVectors = JSON.parse(
  readFileSync(edgeCaseVectorsPath, 'utf-8')
) as {
  vectors: Array<{
    description: string;
    link: string;
    expects: 'success' | 'error';
    error_type?: string;
    notes: string;
  }>;
};

describe('Edge Case Test Vectors', () => {
  for (const vector of edgeCaseVectors.vectors) {
    it(`${vector.description}`, async () => {
      const result = await verifyLink(vector.link);

      if (vector.expects === 'success') {
        expect(
          result.valid,
          `Expected success but got error: ${result.valid ? '' : result.error?.message}`
        ).toBe(true);
      } else {
        expect(result.valid, `Expected error but got success`).toBe(false);
        if (!result.valid && vector.error_type) {
          expect(
            result.error.code,
            `Expected error code ${vector.error_type} but got ${result.error.code}`
          ).toBe(vector.error_type);
        }
      }
    });
  }

  it('should have comprehensive edge case coverage', () => {
    // Verify we have test cases for key edge case categories
    const descriptions = edgeCaseVectors.vectors.map(
      (v: { description: string }) => v.description.toLowerCase()
    );

    // Check for format validation edge cases
    expect(descriptions.some((d: string) => d.includes('base64'))).toBe(true);
    expect(descriptions.some((d: string) => d.includes('separator'))).toBe(
      true
    );
    expect(descriptions.some((d: string) => d.includes('scheme'))).toBe(true);

    // Ensure all vectors have required fields
    for (const vector of edgeCaseVectors.vectors) {
      expect(vector.description).toBeDefined();
      expect(vector.link).toBeDefined();
      expect(vector.expects).toMatch(/^(success|error)$/);
      expect(vector.notes).toBeDefined();

      if (vector.expects === 'error') {
        expect(vector.error_type).toBeDefined();
      }
    }
  });
});
