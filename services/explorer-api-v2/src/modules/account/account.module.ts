import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountRepository } from './repositories/account.repository';
import { Transaction } from '@/modules/transaction/entities/transaction.entity';
import { TokenTransfer } from '@/modules/token/entities/token-transfer.entity';
import { RpcService } from '@/common/services/rpc.service';
import { CacheService } from '@/common/services/cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, TokenTransfer])],
  controllers: [AccountController],
  providers: [AccountService, AccountRepository, RpcService, CacheService],
  exports: [AccountService],
})
export class AccountModule {}

