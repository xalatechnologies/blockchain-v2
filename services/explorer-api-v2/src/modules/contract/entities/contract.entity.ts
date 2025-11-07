import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contracts')
export class Contract {
  @PrimaryColumn({ length: 42 })
  address: string;

  @Column({ length: 66, nullable: true })
  creationTransactionHash: string;

  @Column('bigint', { nullable: true })
  creationBlockNumber: number;

  @Column('text', { nullable: true })
  bytecode: string;

  @Column('boolean', { default: false })
  isVerified: boolean;

  @Column('text', { nullable: true })
  sourceCode: string;

  @Column('jsonb', { nullable: true })
  abi: any;

  @Column({ length: 50, nullable: true })
  compilerVersion: string;

  @Column({ length: 255, nullable: true })
  contractName: string;

  @Column('boolean', { default: false })
  optimizationUsed: boolean;

  @Column('int', { nullable: true })
  runs: number;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

