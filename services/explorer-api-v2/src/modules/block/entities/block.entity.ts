import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Transaction } from '@/modules/transaction/entities/transaction.entity';

@Entity('blocks')
export class Block {
  @PrimaryColumn('bigint')
  number: number;

  @Column({ length: 66, unique: true })
  hash: string;

  @Column({ length: 66 })
  parentHash: string;

  @Column('bigint')
  timestamp: number;

  @Column('bigint')
  gasLimit: string;

  @Column('bigint')
  gasUsed: string;

  @Column({ length: 42, nullable: true })
  miner: string;

  @Column('text', { nullable: true })
  difficulty: string;

  @Column('text', { nullable: true })
  extraData: string;

  @Column('int', { default: 0 })
  transactionsCount: number;

  @OneToMany(() => Transaction, (tx) => tx.block)
  transactions: Transaction[];

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

