import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

/**
 * RPC Service
 * 
 * Provides blockchain RPC interaction using ethers.js.
 * Handles all direct blockchain queries and operations.
 * 
 * @class RpcService
 * @example
 * ```typescript
 * const balance = await rpcService.getBalance(address);
 * const block = await rpcService.getBlock(blockNumber);
 * ```
 */
@Injectable()
export class RpcService {
  private readonly logger = new Logger(RpcService.name);
  private provider: ethers.JsonRpcProvider;

  /**
   * Creates an instance of RpcService.
   * 
   * @param {ConfigService} configService - Configuration service
   * @throws {Error} If RPC_URL is not configured
   */
  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    if (!rpcUrl) {
      throw new Error('RPC_URL is not configured');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.logger.log(`Connected to RPC: ${rpcUrl}`);
  }

  /**
   * Gets the ethers.js provider instance.
   * 
   * @returns {ethers.JsonRpcProvider} The provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Gets the current block number.
   * 
   * @returns {Promise<number>} The current block number
   * @example
   * ```typescript
   * const blockNumber = await rpcService.getBlockNumber();
   * ```
   */
  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  /**
   * Gets block information by block number or tag.
   * 
   * @param {number | string} blockNumber - Block number or tag ('latest', 'pending')
   * @returns {Promise<ethers.Block | null>} Block information or null if not found
   * @example
   * ```typescript
   * const block = await rpcService.getBlock(12345);
   * const latestBlock = await rpcService.getBlock('latest');
   * ```
   */
  async getBlock(blockNumber: number | string): Promise<ethers.Block | null> {
    return this.provider.getBlock(blockNumber, true);
  }

  /**
   * Gets transaction information by hash.
   * 
   * @param {string} txHash - Transaction hash
   * @returns {Promise<ethers.TransactionResponse | null>} Transaction information or null
   * @example
   * ```typescript
   * const tx = await rpcService.getTransaction('0x...');
   * ```
   */
  async getTransaction(
    txHash: string,
  ): Promise<ethers.TransactionResponse | null> {
    return this.provider.getTransaction(txHash);
  }

  /**
   * Gets transaction receipt by hash.
   * 
   * @param {string} txHash - Transaction hash
   * @returns {Promise<ethers.TransactionReceipt | null>} Transaction receipt or null
   * @example
   * ```typescript
   * const receipt = await rpcService.getTransactionReceipt('0x...');
   * ```
   */
  async getTransactionReceipt(
    txHash: string,
  ): Promise<ethers.TransactionReceipt | null> {
    return this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Gets the balance of an address.
   * 
   * @param {string} address - Ethereum address
   * @returns {Promise<bigint>} Balance in wei
   * @example
   * ```typescript
   * const balance = await rpcService.getBalance('0x...');
   * ```
   */
  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  /**
   * Gets the bytecode of a contract.
   * 
   * @param {string} address - Contract address
   * @returns {Promise<string>} Contract bytecode
   * @example
   * ```typescript
   * const bytecode = await rpcService.getCode('0x...');
   * ```
   */
  async getCode(address: string): Promise<string> {
    return this.provider.getCode(address);
  }

  /**
   * Calls a contract method without creating a transaction.
   * 
   * @param {ethers.TransactionRequest} transaction - Transaction request
   * @param {string | number} [blockTag] - Block tag (optional)
   * @returns {Promise<string>} Call result
   * @example
   * ```typescript
   * const result = await rpcService.call({
   *   to: contractAddress,
   *   data: encodedData
   * });
   * ```
   */
  async call(
    transaction: ethers.TransactionRequest,
    blockTag?: string | number,
  ): Promise<string> {
    return this.provider.call(transaction, blockTag);
  }

  /**
   * Gets event logs matching a filter.
   * 
   * @param {ethers.Filter} filter - Event filter
   * @returns {Promise<ethers.Log[]>} Array of matching logs
   * @example
   * ```typescript
   * const logs = await rpcService.getLogs({
   *   address: contractAddress,
   *   topics: [eventSignature]
   * });
   * ```
   */
  async getLogs(filter: ethers.Filter): Promise<ethers.Log[]> {
    return this.provider.getLogs(filter);
  }

  /**
   * Estimates gas for a transaction.
   * 
   * @param {ethers.TransactionRequest} transaction - Transaction request
   * @returns {Promise<bigint>} Estimated gas
   * @example
   * ```typescript
   * const gasEstimate = await rpcService.estimateGas({
   *   to: address,
   *   value: ethers.parseEther('1.0')
   * });
   * ```
   */
  async estimateGas(
    transaction: ethers.TransactionRequest,
  ): Promise<bigint> {
    return this.provider.estimateGas(transaction);
  }

  /**
   * Gets current fee data (gas prices).
   * 
   * @returns {Promise<ethers.FeeData>} Fee data including gas prices
   * @example
   * ```typescript
   * const feeData = await rpcService.getFeeData();
   * console.log(feeData.gasPrice);
   * ```
   */
  async getFeeData(): Promise<ethers.FeeData> {
    return this.provider.getFeeData();
  }

  /**
   * Validates an Ethereum address.
   * 
   * @param {string} address - Address to validate
   * @returns {boolean} True if valid, false otherwise
   * @example
   * ```typescript
   * if (rpcService.validateAddress(address)) {
   *   // Address is valid
   * }
   * ```
   */
  validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Formats an address to checksum format.
   * 
   * @param {string} address - Address to format
   * @returns {string} Checksummed address
   * @example
   * ```typescript
   * const formatted = rpcService.formatAddress('0x...');
   * ```
   */
  formatAddress(address: string): string {
    return ethers.getAddress(address);
  }
}
