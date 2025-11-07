import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index.js';

describe('Account API Integration Tests', () => {
  const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

  describe('GET /api/account/balance', () => {
    test('should return balance for valid address', async () => {
      const response = await request(app)
        .get('/api/account/balance')
        .query({ address: testAddress });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('result');
    });

    test('should return error for missing address', async () => {
      const response = await request(app)
        .get('/api/account/balance');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('0');
    });

    test('should return error for invalid address', async () => {
      const response = await request(app)
        .get('/api/account/balance')
        .query({ address: 'invalid' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('0');
    });
  });

  describe('GET /api/account/balancemulti', () => {
    test('should return balances for multiple addresses', async () => {
      const addresses = [testAddress, '0x0000000000000000000000000000000000000001'];
      const response = await request(app)
        .get('/api/account/balancemulti')
        .query({ address: addresses.join(',') });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('1');
      expect(Array.isArray(response.body.result)).toBe(true);
    });

    test('should reject more than 20 addresses', async () => {
      const addresses = Array(21).fill(testAddress);
      const response = await request(app)
        .get('/api/account/balancemulti')
        .query({ address: addresses.join(',') });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('0');
    });
  });
});

