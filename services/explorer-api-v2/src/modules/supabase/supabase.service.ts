import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { WebSocketGateway } from '../websocket/websocket.gateway';

/**
 * Supabase Service
 * 
 * Provides Supabase integration for real-time database subscriptions.
 * Listens to database changes and broadcasts via WebSocket.
 * 
 * @class SupabaseService
 * @example
 * ```typescript
 * // Subscribe to new blocks
 * supabaseService.subscribeToBlocks();
 * ```
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(
    private configService: ConfigService,
    private websocketGateway: WebSocketGateway,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      this.logger.log('Supabase client initialized');
    } else {
      this.logger.warn('Supabase not configured, real-time features disabled');
    }
  }

  /**
   * Initializes Supabase subscriptions on module init.
   */
  async onModuleInit() {
    if (!this.supabase) {
      this.logger.warn('Supabase not configured, skipping real-time subscriptions');
      return;
    }

    try {
      await this.subscribeToBlocks();
      await this.subscribeToTransactions();
      await this.subscribeToTokenTransfers();
      this.logger.log('Supabase real-time subscriptions initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize Supabase subscriptions: ${error.message}`);
    }
  }

  /**
   * Gets the Supabase client instance.
   * 
   * @returns {SupabaseClient} Supabase client
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Subscribes to new blocks.
   * 
   * Listens for new blocks in the database and broadcasts via WebSocket.
   */
  async subscribeToBlocks() {
    if (!this.supabase) return;

    const channel = this.supabase
      .channel('blocks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blocks',
        },
        (payload) => {
          this.logger.log(`New block: ${payload.new.number}`);
          this.websocketGateway.broadcastBlock(payload.new);
        },
      )
      .subscribe();

    this.channels.set('blocks', channel);
    this.logger.log('Subscribed to blocks');
  }

  /**
   * Subscribes to new transactions.
   * 
   * Listens for new transactions and broadcasts to relevant addresses.
   */
  async subscribeToTransactions() {
    if (!this.supabase) return;

    const channel = this.supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          const tx = payload.new as any;
          
          // Broadcast to from address
          if (tx.fromAddress) {
            this.websocketGateway.broadcastTransaction(tx.fromAddress, tx);
          }
          
          // Broadcast to to address
          if (tx.toAddress) {
            this.websocketGateway.broadcastTransaction(tx.toAddress, tx);
          }
        },
      )
      .subscribe();

    this.channels.set('transactions', channel);
    this.logger.log('Subscribed to transactions');
  }

  /**
   * Subscribes to token transfers.
   * 
   * Listens for token transfers and broadcasts to relevant addresses.
   */
  async subscribeToTokenTransfers() {
    if (!this.supabase) return;

    const channel = this.supabase
      .channel('token-transfers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_transfers',
        },
        (payload) => {
          const transfer = payload.new as any;
          
          // Broadcast to from address
          if (transfer.fromAddress) {
            this.websocketGateway.broadcastTokenTransfer(
              transfer.fromAddress,
              transfer,
            );
          }
          
          // Broadcast to to address
          if (transfer.toAddress) {
            this.websocketGateway.broadcastTokenTransfer(
              transfer.toAddress,
              transfer,
            );
          }
        },
      )
      .subscribe();

    this.channels.set('token-transfers', channel);
    this.logger.log('Subscribed to token transfers');
  }

  /**
   * Subscribes to token holder updates.
   * 
   * @param {string} tokenAddress - Token address
   */
  async subscribeToTokenHolders(tokenAddress: string) {
    if (!this.supabase) return;

    const channelName = `token-holders:${tokenAddress}`;
    
    if (this.channels.has(channelName)) {
      return; // Already subscribed
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'token_holders',
          filter: `token_address=eq.${tokenAddress}`,
        },
        (payload) => {
          this.websocketGateway.broadcastTokenUpdate(tokenAddress, payload.new);
        },
      )
      .subscribe();

    this.channels.set(channelName, channel);
    this.logger.log(`Subscribed to token holders: ${tokenAddress}`);
  }

  /**
   * Unsubscribes from a channel.
   * 
   * @param {string} channelName - Channel name
   */
  async unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.logger.log(`Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Cleans up all subscriptions.
   */
  async onModuleDestroy() {
    if (!this.supabase) return;

    for (const [name, channel] of this.channels.entries()) {
      try {
        await this.supabase.removeChannel(channel);
        this.logger.log(`Unsubscribed from ${name}`);
      } catch (error) {
        this.logger.error(`Error unsubscribing from ${name}: ${error.message}`);
      }
    }
    this.channels.clear();
  }
}

