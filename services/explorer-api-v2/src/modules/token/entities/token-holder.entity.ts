import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('token_holders')
@Index(['tokenAddress', 'holderAddress'], { unique: true })
@Index(['tokenAddress'])
@Index(['holderAddress'])
@Index(['tokenAddress', 'balance'])
export class TokenHolder {
  @PrimaryGeneratedColumn('bigint')
  id: number;

  @Column({ length: 42 })
  tokenAddress: string;

  @Column({ length: 42 })
  holderAddress: string;

  @Column('numeric', { precision: 78, scale: 0, default: '0' })
  balance: string;

  @Column('bigint', { nullable: true })
  lastTransferBlock: number;

  @Column('bigint', { nullable: true })
  lastTransferTimestamp: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

