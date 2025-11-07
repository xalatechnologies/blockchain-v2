import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '@/modules/transaction/entities/transaction.entity';
import { TokenTransfer } from '@/modules/token/entities/token-transfer.entity';
import { BaseRepository } from '@/common/repositories/base.repository';
import { AccountSummary } from '../entities/account.entity';

@Injectable()
export class AccountRepository extends BaseRepository<Transaction> {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(TokenTransfer)
    private tokenTransferRepository: Repository<TokenTransfer>,
  ) {
    super(transactionRepository);
  }

  async getBalance(address: string): Promise<string> {
    // This would typically query the RPC or use indexed data
    // For now, return placeholder
    return '0';
  }

  async getTransactionCount(address: string): Promise<number> {
    const [sent, received] = await Promise.all([
      this.transactionRepository.count({ where: { fromAddress: address } }),
      this.transactionRepository.count({ where: { toAddress: address } }),
    ]);
    return sent + received;
  }

  async getTokenCount(address: string): Promise<number> {
    const result = await this.tokenTransferRepository
      .createQueryBuilder('transfer')
      .where('transfer.fromAddress = :address OR transfer.toAddress = :address', {
        address,
      })
      .select('COUNT(DISTINCT transfer.tokenAddress)', 'count')
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  async getAccountSummary(address: string): Promise<AccountSummary> {
    const [balance, txCount, tokenCount] = await Promise.all([
      this.getBalance(address),
      this.getTransactionCount(address),
      this.getTokenCount(address),
    ]);

    return {
      address,
      balance,
      transactionCount: txCount,
      tokenCount,
    };
  }

  async getTransactionsByAddress(
    address: string,
    startBlock?: number,
    endBlock?: number,
    page = 1,
    limit = 10,
  ) {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.fromAddress = :address OR tx.toAddress = :address', {
        address,
      })
      .orderBy('tx.blockNumber', 'DESC')
      .addOrderBy('tx.transactionIndex', 'DESC');

    if (startBlock !== undefined) {
      query.andWhere('tx.blockNumber >= :startBlock', { startBlock });
    }

    if (endBlock !== undefined) {
      query.andWhere('tx.blockNumber <= :endBlock', { endBlock });
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }
}

