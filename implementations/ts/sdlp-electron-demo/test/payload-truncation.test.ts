import { describe, it, expect } from 'vitest';

describe('Payload Truncation Feature', () => {
  // Helper function to simulate the truncatePayload function from main process
  function truncatePayload(payload: string, maxLength: number = 100): string {
    if (payload.length <= maxLength) {
      return payload;
    }

    // For payloads, show the beginning and end parts
    const prefixLength = Math.floor((maxLength - 3) / 2); // Account for '...'
    const suffixLength = Math.floor((maxLength - 3) / 2);

    return `${payload.substring(0, prefixLength)}...${payload.substring(payload.length - suffixLength)}`;
  }

  describe('truncatePayload function', () => {
    it('should not truncate short payloads', () => {
      const shortPayload = 'echo "Hello World"';
      const result = truncatePayload(shortPayload, 100);
      expect(result).toBe(shortPayload);
      expect(result).not.toContain('...');
    });

    it('should truncate long payloads correctly', () => {
      const longPayload = 'echo "This is a very long command that should be truncated because it exceeds the maximum length limit for display in dialogs"';
      const result = truncatePayload(longPayload, 50);
      
      expect(result).toContain('...');
      // For maxLength 50: (50-3)/2 = 23.5, floor = 23
      // So we get 23 + '...' + 23 = 49 chars total
      expect(result.length).toBe(49);
      expect(result.startsWith('echo "This is a very lo')).toBe(true);
      expect(result.endsWith('isplay in dialogs"')).toBe(true);
    });

    it('should handle edge case with exact max length', () => {
      const exactLengthPayload = 'a'.repeat(50);
      const result = truncatePayload(exactLengthPayload, 50);
      expect(result).toBe(exactLengthPayload);
      expect(result).not.toContain('...');
    });

    it('should handle edge case with one character over limit', () => {
      const slightlyLongPayload = 'a'.repeat(51);
      const result = truncatePayload(slightlyLongPayload, 50);
      
      expect(result).toContain('...');
      // For maxLength 50: (50-3)/2 = 23.5, floor = 23
      // So we get 23 + '...' + 23 = 49 chars total
      expect(result.length).toBe(49);
      expect(result.startsWith('a'.repeat(23))).toBe(true);
      expect(result.endsWith('a'.repeat(23))).toBe(true);
    });

    it('should handle very short max length', () => {
      const payload = 'echo "test"';
      const result = truncatePayload(payload, 10);
      
      expect(result).toContain('...');
      // For maxLength 10: (10-3)/2 = 3.5, floor = 3
      // So we get 3 + '...' + 3 = 9 chars total
      expect(result.length).toBe(9);
      expect(result.startsWith('ech')).toBe(true);
      expect(result.endsWith('st"')).toBe(true);
    });

    it('should handle empty payload', () => {
      const emptyPayload = '';
      const result = truncatePayload(emptyPayload, 100);
      expect(result).toBe('');
    });

    it('should handle single character payload', () => {
      const singleChar = 'a';
      const result = truncatePayload(singleChar, 100);
      expect(result).toBe('a');
    });

    it('should preserve command structure in truncation', () => {
      const commandPayload = 'curl -X POST https://api.example.com/very/long/endpoint/path/that/should/be/truncated -H "Authorization: Bearer very-long-token-here" -d "{"key":"value","another":"data"}"';
      const result = truncatePayload(commandPayload, 80);
      
      expect(result).toContain('...');
      // For maxLength 80: (80-3)/2 = 38.5, floor = 38
      // So we get 38 + '...' + 38 = 79 chars total
      expect(result.length).toBe(79);
      expect(result.startsWith('curl -X POST')).toBe(true);
      expect(result.endsWith('"data"}"')).toBe(true);
    });
  });

  describe('Dialog display integration', () => {
    it('should format payload display correctly for dialog', () => {
      const longPayload = 'echo "This is a very long message that would make the dialog unwieldy if not truncated properly"';
      const truncated = truncatePayload(longPayload, 60);
      const payloadDisplay = longPayload.length > 60 ? `${truncated} (truncated)` : truncated;
      
      expect(payloadDisplay).toContain('(truncated)');
      expect(payloadDisplay.length).toBeGreaterThan(60); // Because of " (truncated)" suffix
      expect(payloadDisplay.endsWith(' (truncated)')).toBe(true);
    });

    it('should not add truncated suffix for short payloads', () => {
      const shortPayload = 'echo "short"';
      const truncated = truncatePayload(shortPayload, 100);
      const payloadDisplay = shortPayload.length > 100 ? `${truncated} (truncated)` : truncated;
      
      expect(payloadDisplay).not.toContain('(truncated)');
      expect(payloadDisplay).toBe(shortPayload);
    });
  });

  describe('Security considerations', () => {
    it('should handle potentially malicious payloads safely', () => {
      const maliciousPayload = 'rm -rf / && echo "malicious command with very long path /usr/local/bin/some/deep/directory/structure"';
      const result = truncatePayload(maliciousPayload, 50);
      
      expect(result).toContain('...');
      // For maxLength 50: (50-3)/2 = 23.5, floor = 23
      // So we get 23 + '...' + 23 = 49 chars total
      expect(result.length).toBe(49);
      // Should still show the beginning (dangerous part) and end
      expect(result.startsWith('rm -rf / && echo "malic')).toBe(true);
    });

    it('should handle payloads with special characters', () => {
      const specialPayload = 'echo "Special chars: <>&\'"$`|;(){}[]"';
      const result = truncatePayload(specialPayload, 25);
      
      expect(result).toContain('...');
      expect(result.length).toBe(25);
      // Should preserve special characters in truncation
      expect(result).toContain('"');
    });
  });

  describe('Performance considerations', () => {
    it('should handle very long payloads efficiently', () => {
      const veryLongPayload = 'echo "' + 'a'.repeat(10000) + '"';
      const startTime = Date.now();
      const result = truncatePayload(veryLongPayload, 100);
      const endTime = Date.now();
      
      expect(result).toContain('...');
      // For maxLength 100: (100-3)/2 = 48.5, floor = 48
      // So we get 48 + '...' + 48 = 99 chars total
      expect(result.length).toBe(99);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });
  });
});
