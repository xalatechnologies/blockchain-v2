import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('api_usage')
@Index(['apiKey'])
@Index(['ipAddress'])
@Index(['endpoint'])
@Index(['createdAt'])
export class ApiUsage {
  @PrimaryGeneratedColumn('bigint')
  id: number;

  @Column({ length: 255, nullable: true })
  apiKey: string;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 255 })
  endpoint: string;

  @Column({ length: 10 })
  method: string;

  @Column('int', { nullable: true })
  statusCode: number;

  @Column('int', { nullable: true })
  responseTimeMs: number;

  @CreateDateColumn()
  createdAt: Date;
}

