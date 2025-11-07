import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [ConfigModule, WebSocketModule],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}

