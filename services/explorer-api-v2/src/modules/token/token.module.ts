import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenTransfer } from './entities/token-transfer.entity';
import { NftTransfer } from './entities/nft-transfer.entity';
import { TokenHolder } from './entities/token-holder.entity';
import { TokenMetadata } from './entities/token-metadata.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenTransfer,
      NftTransfer,
      TokenHolder,
      TokenMetadata,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class TokenModule {}

