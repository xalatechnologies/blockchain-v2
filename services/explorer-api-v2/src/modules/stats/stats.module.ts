import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiUsage } from './entities/api-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiUsage])],
  exports: [TypeOrmModule],
})
export class StatsModule {}

