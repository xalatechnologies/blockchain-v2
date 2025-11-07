import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Block } from '../modules/block/entities/block.entity';
import { Transaction } from '../modules/transaction/entities/transaction.entity';
import { TransactionLog } from '../modules/transaction/entities/transaction-log.entity';
import { TokenTransfer } from '../modules/token/entities/token-transfer.entity';
import { NftTransfer } from '../modules/token/entities/nft-transfer.entity';
import { TokenHolder } from '../modules/token/entities/token-holder.entity';
import { Contract } from '../modules/contract/entities/contract.entity';
import { TokenMetadata } from '../modules/token/entities/token-metadata.entity';
import { ApiUsage } from '../modules/stats/entities/api-usage.entity';
import { User } from '../modules/auth/entities/user.entity';
import { ApiKey } from '../modules/auth/entities/api-key.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USER'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [
    Block,
    Transaction,
    TransactionLog,
    TokenTransfer,
    NftTransfer,
    TokenHolder,
    Contract,
    TokenMetadata,
    ApiUsage,
    User,
    ApiKey,
    Notification,
  ],
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('DB_SSL') ? { rejectUnauthorized: false } : false,
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
  cache: {
    type: 'redis',
    options: {
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      password: configService.get('REDIS_PASSWORD'),
      db: configService.get('REDIS_DB'),
    },
    duration: 30000, // 30 seconds
  },
});

