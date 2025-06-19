/**
 * Tests for SDLP error classes
 */

import { describe, it, expect } from 'vitest';
import {
  SdlpError,
  DIDMismatchError,
  InvalidJWSFormatError,
  InvalidSignatureError,
  PayloadChecksumMismatchError,
  LinkExpiredError,
  LinkNotYetValidError,
  UnsupportedCompressionError,
  DIDResolutionError,
  InvalidLinkFormatError,
} from '../src/types.js';

describe('SDLP Error Classes', () => {
  describe('DIDMismatchError', () => {
    it('should create error with correct message and code', () => {
      const sid = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
      const kid = 'did:web:example.com';

      const error = new DIDMismatchError(sid, kid);

      expect(error).toBeInstanceOf(SdlpError);
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('DID_MISMATCH');
      expect(error.message).toBe(
        `DID mismatch: sid='${sid}' does not match kid base DID='${kid}'`
      );
      expect(error.name).toBe('DIDMismatchError');
    });
  });

  describe('InvalidJWSFormatError', () => {
    it('should create error with correct message and code', () => {
      const reason = 'Missing required JWS fields';

      const error = new InvalidJWSFormatError(reason);

      expect(error).toBeInstanceOf(SdlpError);
      expect(error.code).toBe('INVALID_JWS_FORMAT');
      expect(error.message).toBe(`Invalid JWS format: ${reason}`);
      expect(error.name).toBe('InvalidJWSFormatError');
    });
  });

  describe('InvalidSignatureError', () => {
    it('should create error with default message', () => {
      const error = new InvalidSignatureError();

      expect(error).toBeInstanceOf(SdlpError);
      expect(error.code).toBe('INVALID_SIGNATURE');
      expect(error.message).toBe('Invalid signature');
      expect(error.name).toBe('InvalidSignatureError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Signature verification failed';

      const error = new InvalidSignatureError(customMessage);

      expect(error.code).toBe('INVALID_SIGNATURE');
      expect(error.message).toBe(customMessage);
    });
  });

  describe('PayloadChecksumMismatchError', () => {
    it('should create error with correct message and code', () => {
      const expected = 'abc123';
      const actual = 'def456';

      const error = new PayloadChecksumMismatchError(expected, actual);

      expect(error).toBeInstanceOf(SdlpError);
      expect(error.code).toBe('PAYLOAD_CHECKSUM_MISMATCH');
      expect(error.message).toBe(
        `Payload checksum mismatch: expected=${expected}, actual=${actual}`
      );
      expect(error.name).toBe('PayloadChecksumMismatchError');
    });
  });

  describe('LinkExpiredError', () => {
    it('should create error with correct message and code', () => {
      const expiration = 1640995200; // 2022-01-01 00:00:00 UTC

      const error = new LinkExpiredError(expiration);

      expect(error).toBeInstanceOf(SdlpError);
      expect(error.code).toBe('LINK_EXPIRED');
      expect(error.message).toBe(
        `Link expired at ${new Date(expiration * 1000).toISOString()}`
      );
      expect(error.name).toBe('LinkExpiredError');
    });
  });

  describe('LinkNotYetValidError', () => {
    it('should create error with correct message and code', () => {
      const notBefore = 1640995200; // 2022-01-01 00:00:00 UTC

      const error = new LinkNotYetValidError(notBefore);

      expect(error).toBeInstanceOf(SdlpError);
      expect(error.code).toBe('LINK_NOT_YET_VALID');
      expect(error.message).toBe(
        `Link not valid until ${new Date(notBefore * 1000).toISOString()}`
      );
      expect(error.name).toBe('LinkNotYetValidError');
    });
  });

  describe('UnsupportedCompressionError', () => {
    it('should create error with correct message and code', () => {
      const compression = 'gzip';

      const error = new UnsupportedCompressionError(compression);

      expect(error).toBeInstanceOf(SdlpError);
      expect(error.code).toBe('UNSUPPORTED_COMPRESSION');
      expect(error.message).toBe(
        `Unsupported compression algorithm: ${compression}`
      );
      expect(error.name).toBe('UnsupportedCompressionError');
    });
  });

  describe('DIDResolutionError', () => {
    it('should create error with correct message and code', () => {
      const didUrl = 'did:web:example.com';
      const reason = 'Network timeout';

      const error = new DIDResolutionError(didUrl, reason);

      expect(error).toBeInstanceOf(SdlpError);
      expect(error.code).toBe('DID_RESOLUTION_FAILED');
      expect(error.message).toBe(
        `Failed to resolve DID '${didUrl}': ${reason}`
      );
      expect(error.name).toBe('DIDResolutionError');
    });
  });

  describe('InvalidLinkFormatError', () => {
    it('should create error with correct message and code', () => {
      const reason = 'Missing dot separator';

      const error = new InvalidLinkFormatError(reason);

      expect(error).toBeInstanceOf(SdlpError);
      expect(error.code).toBe('INVALID_LINK_FORMAT');
      expect(error.message).toBe(`Invalid link format: ${reason}`);
      expect(error.name).toBe('InvalidLinkFormatError');
    });
  });

  describe('Error inheritance and properties', () => {
    it('should have correct prototype chain', () => {
      const error = new DIDMismatchError('did1', 'did2');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof SdlpError).toBe(true);
      expect(error instanceof DIDMismatchError).toBe(true);
    });

    it('should have correct constructor name', () => {
      const errors = [
        new DIDMismatchError('did1', 'did2'),
        new InvalidJWSFormatError('reason'),
        new InvalidSignatureError(),
        new PayloadChecksumMismatchError('exp', 'act'),
        new LinkExpiredError(123456),
        new LinkNotYetValidError(123456),
        new UnsupportedCompressionError('gzip'),
        new DIDResolutionError('did', 'reason'),
        new InvalidLinkFormatError('reason'),
      ];

      for (const error of errors) {
        expect(error.name).toBe(error.constructor.name);
      }
    });

    it('should be serializable', () => {
      const error = new DIDMismatchError('did1', 'did2');

      // Test that error can be converted to JSON (common requirement)
      const serialized = JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
      });

      expect(serialized).toContain('DIDMismatchError');
      expect(serialized).toContain('DID_MISMATCH');
    });
  });
});
