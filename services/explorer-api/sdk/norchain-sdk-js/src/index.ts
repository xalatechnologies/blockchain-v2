/**
 * Nor Chain SDK - Official JavaScript/TypeScript SDK
 * 
 * Easy-to-use SDK for interacting with Nor Chain Explorer API
 * Compatible with Etherscan/BSCScan patterns
 */

import axios, { AxiosInstance } from 'axios';

export interface NorChainConfig {
  apiKey?: string;
  baseURL?: string;
  chainId?: number;
  timeout?: number;
}

export interface BalanceResponse {
  status: string;
  message: string;
  result: string;
}

export interface TokenInfoResponse {
  status: string;
  message: string;
  result: {
    contractAddress: string;
    tokenName: string;
    symbol: string;
    divisor: string;
    tokenType: string;
    totalSupply: string;
  };
}

export interface TransactionResponse {
  status: string;
  message: string;
  result: {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    isError: string;
  };
}

export class NorChainAPI {
  private client: AxiosInstance;
  private config: NorChainConfig;

  constructor(config: NorChainConfig = {}) {
    this.config = {
      baseURL: config.baseURL || 'https://api.norchain.org/api',
      chainId: config.chainId || 65001,
      timeout: config.timeout || 30000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey })
      }
    });
  }

  /**
   * Account API methods
   */
  account = {
    /**
     * Get account balance
     */
    getBalance: async (address: string, tag: string = 'latest'): Promise<string> => {
      const response = await this.client.get<BalanceResponse>('/account/balance', {
        params: { address, tag, ...(this.config.apiKey && { apikey: this.config.apiKey }) }
      });
      
      if (response.data.status !== '1') {
        throw new Error(response.data.message || 'Failed to get balance');
      }
      
      return response.data.result;
    },

    /**
     * Get transaction list for an address
     */
    getTransactions: async (
      address: string,
      options: {
        startblock?: number;
        endblock?: string | number;
        page?: number;
        offset?: number;
        sort?: 'asc' | 'desc';
      } = {}
    ) => {
      const response = await this.client.get('/account/txlist', {
        params: {
          address,
          startblock: options.startblock || 0,
          endblock: options.endblock || 'latest',
          page: options.page || 1,
          offset: options.offset || 10,
          sort: options.sort || 'desc',
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      return response.data;
    },

    /**
     * Get token transfers for an address
     */
    getTokenTransfers: async (
      address: string,
      options: {
        contractaddress?: string;
        startblock?: number;
        endblock?: string | number;
        page?: number;
        offset?: number;
        sort?: 'asc' | 'desc';
      } = {}
    ) => {
      const response = await this.client.get('/account/tokentx', {
        params: {
          address,
          ...options,
          endblock: options.endblock || 'latest',
          page: options.page || 1,
          offset: options.offset || 10,
          sort: options.sort || 'desc',
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      return response.data;
    },

    /**
     * Get multiple account balances
     */
    getBalances: async (addresses: string[], tag: string = 'latest') => {
      if (addresses.length > 20) {
        throw new Error('Maximum 20 addresses per request');
      }
      
      const response = await this.client.get('/account/balancemulti', {
        params: {
          address: addresses.join(','),
          tag,
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      return response.data;
    }
  };

  /**
   * Token API methods
   */
  token = {
    /**
     * Get token information
     */
    getInfo: async (contractAddress: string): Promise<TokenInfoResponse['result']> => {
      const response = await this.client.get<TokenInfoResponse>('/token/tokeninfo', {
        params: {
          contractaddress: contractAddress,
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      if (response.data.status !== '1') {
        throw new Error(response.data.message || 'Failed to get token info');
      }
      
      return response.data.result;
    },

    /**
     * Get token supply
     */
    getSupply: async (contractAddress: string): Promise<string> => {
      const response = await this.client.get('/token/tokensupply', {
        params: {
          contractaddress: contractAddress,
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      if (response.data.status !== '1') {
        throw new Error(response.data.message || 'Failed to get token supply');
      }
      
      return response.data.result;
    },

    /**
     * Get token balance for an address
     */
    getBalance: async (contractAddress: string, address: string): Promise<string> => {
      const response = await this.client.get('/token/tokenbalance', {
        params: {
          contractaddress: contractAddress,
          address,
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      if (response.data.status !== '1') {
        throw new Error(response.data.message || 'Failed to get token balance');
      }
      
      return response.data.result;
    }
  };

  /**
   * Transaction API methods
   */
  transaction = {
    /**
     * Get transaction info
     */
    getInfo: async (txHash: string): Promise<TransactionResponse['result']> => {
      const response = await this.client.get<TransactionResponse>('/transaction/gettxinfo', {
        params: {
          txhash: txHash,
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      if (response.data.status !== '1') {
        throw new Error(response.data.message || 'Failed to get transaction');
      }
      
      return response.data.result;
    },

    /**
     * Get transaction receipt
     */
    getReceipt: async (txHash: string) => {
      const response = await this.client.get('/transaction/gettxreceipt', {
        params: {
          txhash: txHash,
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      return response.data;
    },

    /**
     * Get transaction status
     */
    getStatus: async (txHash: string) => {
      const response = await this.client.get('/transaction/getstatus', {
        params: {
          txhash: txHash,
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      return response.data;
    }
  };

  /**
   * Stats API methods
   */
  stats = {
    /**
     * Get network statistics
     */
    getNetworkStats: async () => {
      const response = await this.client.get('/stats/networkstats', {
        params: {
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      return response.data;
    },

    /**
     * Get gas oracle
     */
    getGasOracle: async () => {
      const response = await this.client.get('/stats/gasoracle', {
        params: {
          ...(this.config.apiKey && { apikey: this.config.apiKey })
        }
      });
      
      return response.data;
    }
  };

  /**
   * GraphQL query method
   */
  graphql = async (query: string, variables?: Record<string, any>) => {
    const response = await this.client.post('/graphql', {
      query,
      variables
    });
    
    return response.data;
  };
}

// Export default instance
export default NorChainAPI;

// Example usage:
/*
import { NorChainAPI } from '@norchain/sdk';

const api = new NorChainAPI({
  apiKey: 'YOUR_API_KEY', // Optional
  chainId: 65001
});

// Get balance
const balance = await api.account.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
console.log('Balance:', balance);

// Get token info
const tokenInfo = await api.token.getInfo('0x26c0eaF731885b14c031cc50dB79b36458E0b355');
console.log('Token:', tokenInfo);
*/

