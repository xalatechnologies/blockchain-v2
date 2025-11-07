import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { Block } from '@/modules/block/entities/block.entity';

@Entity('transaction_logs')
@Index(['transactionHash', 'logIndex'], { unique: true })
@Index(['blockNumber'])
@Index(['address'])
@Index(['topic0'])
@Index(['address', 'topic0'])
export class TransactionLog {
  @PrimaryGeneratedColumn('bigint')
  id: number;

  @Column({ length: 66 })
  transactionHash: string;

  @Column('bigint')
  blockNumber: number;

  @Column('int')
  logIndex: number;

  @Column({ length: 42 })
  address: string;

  @Column({ length: 66, nullable: true })
  topic0: string;

  @Column({ length: 66, nullable: true })
  topic1: string;

  @Column({ length: 66, nullable: true })
  topic2: string;

  @Column({ length: 66, nullable: true })
  topic3: string;

  @Column('text', { nullable: true })
  data: string;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionHash', referencedColumnName: 'hash' })
  transaction: Transaction;

  @ManyToOne(() => Block, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockNumber', referencedColumnName: 'number' })
  block: Block;

  @CreateDateColumn()
  createdAt: Date;
}

