import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Block } from '@/modules/block/entities/block.entity';
import { TransactionLog } from './transaction-log.entity';

@Entity('transactions')
@Index(['hash'], { unique: true })
@Index(['blockNumber'])
@Index(['fromAddress'])
@Index(['toAddress'])
@Index(['blockNumber', 'fromAddress'])
@Index(['blockNumber', 'toAddress'])
export class Transaction {
  @PrimaryGeneratedColumn('bigint')
  id: number;

  @Column({ length: 66, unique: true })
  hash: string;

  @Column('bigint')
  blockNumber: number;

  @Column({ length: 66 })
  blockHash: string;

  @Column('int')
  transactionIndex: number;

  @Column({ length: 42 })
  fromAddress: string;

  @Column({ length: 42, nullable: true })
  toAddress: string;

  @Column('numeric', { precision: 78, scale: 0, default: '0' })
  value: string;

  @Column('bigint')
  gas: string;

  @Column('numeric', { precision: 78, scale: 0, nullable: true })
  gasPrice: string;

  @Column('bigint', { nullable: true })
  gasUsed: string;

  @Column('bigint')
  nonce: number;

  @Column('text', { nullable: true })
  inputData: string;

  @Column('int', { nullable: true })
  status: number; // 1 = success, 0 = failed

  @Column({ length: 42, nullable: true })
  contractAddress: string; // If contract creation

  @ManyToOne(() => Block, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockNumber', referencedColumnName: 'number' })
  block: Block;

  @OneToMany(() => TransactionLog, (log) => log.transaction)
  logs: TransactionLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

