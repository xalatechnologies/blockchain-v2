import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateAddress, validateBlockNumber, formatResponse } from '../../src/utils/provider.js';

describe('Provider Utils', () => {
  describe('validateAddress', () => {
    test('should validate correct Ethereum address', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      expect(validateAddress(validAddress)).toBe(validAddress);
    });

    test('should return null for invalid address', () => {
      expect(validateAddress('invalid')).toBeNull();
      expect(validateAddress('0x123')).toBeNull();
      expect(validateAddress('')).toBeNull();
    });

    test('should handle checksum addresses', () => {
      const checksumAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      expect(validateAddress(checksumAddress.toLowerCase())).toBeTruthy();
    });
  });

  describe('validateBlockNumber', () => {
    test('should validate numeric block numbers', () => {
      expect(validateBlockNumber('12345')).toBe(12345);
      expect(validateBlockNumber('0')).toBe(0);
    });

    test('should validate special block tags', () => {
      expect(validateBlockNumber('latest')).toBe('latest');
      expect(validateBlockNumber('earliest')).toBe('earliest');
      expect(validateBlockNumber('pending')).toBe('pending');
    });

    test('should return null for invalid block numbers', () => {
      expect(validateBlockNumber('-1')).toBeNull();
      expect(validateBlockNumber('abc')).toBeNull();
      expect(validateBlockNumber('')).toBeNull();
    });
  });

  describe('formatResponse', () => {
    test('should format success response', () => {
      const result = formatResponse('1', { data: 'test' });
      expect(result.status).toBe('1');
      expect(result.message).toBe('OK');
      expect(result.result).toEqual({ data: 'test' });
    });

    test('should format error response', () => {
      const result = formatResponse('0', null, 'Error message');
      expect(result.status).toBe('0');
      expect(result.message).toBe('Error message');
      expect(result.result).toBeNull();
    });
  });
});

