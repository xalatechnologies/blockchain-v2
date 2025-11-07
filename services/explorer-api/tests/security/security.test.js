import { describe, test, expect } from '@jest/globals';
import {
  validateEthereumAddress,
  validateTxHash,
  validateBlockNumber
} from '../../src/middleware/security.js';

describe('Security Validation', () => {
  describe('validateEthereumAddress', () => {
    test('should validate correct addresses', () => {
      expect(validateEthereumAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true);
      expect(validateEthereumAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    test('should reject invalid addresses', () => {
      expect(validateEthereumAddress('invalid')).toBe(false);
      expect(validateEthereumAddress('0x123')).toBe(false);
      expect(validateEthereumAddress('')).toBe(false);
      expect(validateEthereumAddress(null)).toBe(false);
    });
  });

  describe('validateTxHash', () => {
    test('should validate correct transaction hashes', () => {
      const validHash = '0x' + 'a'.repeat(64);
      expect(validateTxHash(validHash)).toBe(true);
    });

    test('should reject invalid hashes', () => {
      expect(validateTxHash('invalid')).toBe(false);
      expect(validateTxHash('0x123')).toBe(false);
      expect(validateTxHash('')).toBe(false);
    });
  });

  describe('validateBlockNumber', () => {
    test('should validate numeric block numbers', () => {
      expect(validateBlockNumber('12345')).toBe(true);
      expect(validateBlockNumber('0')).toBe(true);
    });

    test('should validate special tags', () => {
      expect(validateBlockNumber('latest')).toBe(true);
      expect(validateBlockNumber('earliest')).toBe(true);
      expect(validateBlockNumber('pending')).toBe(true);
    });

    test('should reject invalid block numbers', () => {
      expect(validateBlockNumber('-1')).toBe(false);
      expect(validateBlockNumber('abc')).toBe(false);
    });
  });
});

