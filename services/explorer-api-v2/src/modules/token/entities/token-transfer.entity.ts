import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Transaction } from '@/modules/transaction/entities/transaction.entity';
import { Block } from '@/modules/block/entities/block.entity';

@Entity('token_transfers')
@Index(['tokenAddress'])
@Index(['fromAddress'])
@Index(['toAddress'])
@Index(['blockNumber'])
@Index(['tokenAddress', 'fromAddress'])
@Index(['tokenAddress', 'toAddress'])
export class TokenTransfer {
  @PrimaryGeneratedColumn('bigint')
  id: number;

  @Column({ length: 66 })
  transactionHash: string;

  @Column('int')
  logIndex: number;

  @Column('bigint')
  blockNumber: number;

  @Column('bigint')
  timestamp: number;

  @Column({ length: 42 })
  tokenAddress: string;

  @Column({ length: 42 })
  fromAddress: string;

  @Column({ length: 42 })
  toAddress: string;

  @Column('numeric', { precision: 78, scale: 0 })
  value: string;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionHash', referencedColumnName: 'hash' })
  transaction: Transaction;

  @ManyToOne(() => Block, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockNumber', referencedColumnName: 'number' })
  block: Block;

  @CreateDateColumn()
  createdAt: Date;
}

