import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('token_metadata')
export class TokenMetadata {
  @PrimaryColumn({ length: 42 })
  address: string;

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ length: 50, nullable: true })
  symbol: string;

  @Column('int', { default: 18 })
  decimals: number;

  @Column('numeric', { precision: 78, scale: 0, nullable: true })
  totalSupply: string;

  @Column({ length: 20, nullable: true })
  tokenType: string; // ERC20, ERC721, ERC1155

  @Index()
  @UpdateDateColumn()
  lastUpdated: Date;

  @CreateDateColumn()
  createdAt: Date;
}

