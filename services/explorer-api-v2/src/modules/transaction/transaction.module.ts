import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionLog } from './entities/transaction-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, TransactionLog])],
  exports: [TypeOrmModule],
})
export class TransactionModule {}

