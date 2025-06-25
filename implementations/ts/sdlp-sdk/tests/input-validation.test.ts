/**
 * Tests for input validation and security hardening in SDLP SDK
 */

import { describe, it, expect } from 'vitest';
import {
  verifyLink,
  InvalidLinkFormatError,
  InvalidJWSFormatError,
} from '../src/index.js';

describe('Input Validation and Security', () => {
  describe('verifyLink input validation', () => {
    it('should reject non-string link input', async () => {
      const result = await verifyLink(123 as any);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Link must be a string'
        );
      }
    });

    it('should reject empty string link', async () => {
      const result = await verifyLink('');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Link cannot be empty'
        );
      }
    });

    it('should reject excessively long links', async () => {
      const longLink = `sdlp://${'a'.repeat(100000)}`;
      const result = await verifyLink(longLink);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Link exceeds maximum allowed length'
        );
      }
    });

    it('should reject null options', async () => {
      const result = await verifyLink('sdlp://test.test', null as any);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Options must be an object'
        );
      }
    });

    it('should reject invalid allowedAlgorithms option', async () => {
      const result = await verifyLink('sdlp://test.test', {
        allowedAlgorithms: 'invalid' as any,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: allowedAlgorithms must be a non-empty array'
        );
      }
    });

    it('should reject empty allowedAlgorithms array', async () => {
      const result = await verifyLink('sdlp://test.test', {
        allowedAlgorithms: [],
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: allowedAlgorithms must be a non-empty array'
        );
      }
    });

    it('should reject invalid maxPayloadSize option', async () => {
      const result = await verifyLink('sdlp://test.test', {
        maxPayloadSize: -1,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: maxPayloadSize must be a positive number not exceeding 100MB'
        );
      }
    });

    it('should reject excessively large maxPayloadSize', async () => {
      const result = await verifyLink('sdlp://test.test', {
        maxPayloadSize: 200 * 1024 * 1024, // 200MB
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: maxPayloadSize must be a positive number not exceeding 100MB'
        );
      }
    });

    it('should reject string maxPayloadSize', async () => {
      const result = await verifyLink('sdlp://test.test', {
        maxPayloadSize: '1000' as any,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: maxPayloadSize must be a positive number not exceeding 100MB'
        );
      }
    });
  });

  describe('Link format security', () => {
    it('should reject links with more than 2 parts', async () => {
      const result = await verifyLink('sdlp://part1.part2.part3');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Invalid SDLP link format - missing scheme or dot separator'
        );
      }
    });

    it('should reject links with invalid Base64URL characters in payload', async () => {
      const result = await verifyLink('sdlp://validpart.invalid!!!chars');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Invalid SDLP link format - missing scheme or dot separator'
        );
      }
    });

    it('should reject links without dot separator', async () => {
      const result = await verifyLink('sdlp://nodothere');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Invalid SDLP link format - missing scheme or dot separator'
        );
      }
    });

    it('should reject links with empty parts', async () => {
      const result = await verifyLink('sdlp://.');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Invalid SDLP link format - missing scheme or dot separator'
        );
      }
    });

    it('should reject links with only one empty part', async () => {
      const result = await verifyLink('sdlp://.payload');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Invalid SDLP link format - missing scheme or dot separator'
        );
      }
    });
  });

  describe('Base64URL validation', () => {
    it('should handle malformed Base64URL in JWS token', async () => {
      const result = await verifyLink('sdlp://invalid!!!base64.dGVzdA');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidJWSFormatError);
        expect(result.error.code).toBe('INVALID_JWS_FORMAT');
      }
    });

    it('should handle malformed Base64URL in payload', async () => {
      // This should be caught by the parseSDLPLink function first
      const result = await verifyLink('sdlp://dGVzdA.invalid!!!base64');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.message).toBe(
          'Invalid link format: Invalid SDLP link format - missing scheme or dot separator'
        );
      }
    });
  });

  describe('Error handling robustness', () => {
    it('should handle undefined error messages gracefully', async () => {
      // Test with a link that will cause JSON parsing to fail
      const result = await verifyLink('sdlp://bm90anNvbg.dGVzdA'); // "notjson" base64url encoded

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toContain('Failed to parse JWS');
        expect(typeof result.error.message).toBe('string');
        expect(result.error.message.length).toBeGreaterThan(0);
      }
    });

    it('should maintain error type hierarchy', async () => {
      const result = await verifyLink('');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error).toBeInstanceOf(InvalidLinkFormatError);
        expect(result.error.name).toBe('InvalidLinkFormatError');
        expect(result.error.code).toBe('INVALID_LINK_FORMAT');
      }
    });
  });
});
