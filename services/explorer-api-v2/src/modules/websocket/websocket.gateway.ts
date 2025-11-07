import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * WebSocket Gateway
 * 
 * Handles real-time WebSocket connections for blockchain events.
 * Supports subscriptions to blocks, transactions, and account updates.
 * 
 * @class WebSocketGateway
 * @example
 * ```typescript
 * // Client connection
 * const socket = io('http://localhost:3000');
 * socket.emit('subscribe', { type: 'blocks' });
 * socket.on('block', (data) => console.log('New block:', data));
 * ```
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class WebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly subscriptions = new Map<string, Set<string>>(); // room -> Set<socketId>

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Handles new WebSocket connections.
   * 
   * @param {Socket} client - Socket client
   */
  async handleConnection(client: Socket) {
    try {
      // Optional: Authenticate via JWT token
      const token = client.handshake.auth?.token;
      if (token) {
        const payload = this.jwtService.verify(token);
        client.data.userId = payload.sub;
        this.logger.log(`Authenticated client: ${client.id} (user: ${payload.sub})`);
      }

      this.logger.log(`Client connected: ${client.id}`);
      client.emit('connected', { message: 'Connected to Nor Chain WebSocket' });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handles WebSocket disconnections.
   * 
   * @param {Socket} client - Socket client
   */
  handleDisconnect(client: Socket) {
    // Clean up subscriptions
    this.subscriptions.forEach((sockets, room) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.subscriptions.delete(room);
      }
    });

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe to blockchain events.
   * 
   * @param {Socket} client - Socket client
   * @param {any} data - Subscription data
   * @example
   * ```typescript
   * socket.emit('subscribe', { type: 'blocks' });
   * socket.emit('subscribe', { type: 'transactions', address: '0x...' });
   * ```
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { type: string; address?: string; tokenAddress?: string },
  ) {
    const { type, address, tokenAddress } = data;

    let room: string;
    switch (type) {
      case 'blocks':
        room = 'blocks';
        break;
      case 'transactions':
        if (!address) {
          client.emit('error', { message: 'Address required for transaction subscription' });
          return;
        }
        room = `transactions:${address.toLowerCase()}`;
        break;
      case 'token-transfers':
        if (!address) {
          client.emit('error', { message: 'Address required for token transfer subscription' });
          return;
        }
        room = `token-transfers:${address.toLowerCase()}`;
        break;
      case 'token':
        if (!tokenAddress) {
          client.emit('error', { message: 'Token address required' });
          return;
        }
        room = `token:${tokenAddress.toLowerCase()}`;
        break;
      default:
        client.emit('error', { message: `Unknown subscription type: ${type}` });
        return;
    }

    client.join(room);
    
    if (!this.subscriptions.has(room)) {
      this.subscriptions.set(room, new Set());
    }
    this.subscriptions.get(room)!.add(client.id);

    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    client.emit('subscribed', { type, room });
  }

  /**
   * Unsubscribe from blockchain events.
   * 
   * @param {Socket} client - Socket client
   * @param {any} data - Unsubscription data
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { type: string; address?: string },
  ) {
    const { type, address } = data;
    const room = address 
      ? `${type}:${address.toLowerCase()}`
      : type;

    client.leave(room);
    
    const sockets = this.subscriptions.get(room);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.subscriptions.delete(room);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
    client.emit('unsubscribed', { type, room });
  }

  /**
   * Broadcast new block to subscribers.
   * 
   * @param {any} blockData - Block data
   */
  broadcastBlock(blockData: any) {
    this.server.to('blocks').emit('block', blockData);
    this.logger.debug(`Broadcasted block ${blockData.number} to ${this.getRoomSize('blocks')} clients`);
  }

  /**
   * Broadcast new transaction to subscribers.
   * 
   * @param {string} address - Address to notify
   * @param {any} transactionData - Transaction data
   */
  broadcastTransaction(address: string, transactionData: any) {
    const room = `transactions:${address.toLowerCase()}`;
    this.server.to(room).emit('transaction', transactionData);
    this.logger.debug(`Broadcasted transaction to ${address} (${this.getRoomSize(room)} clients)`);
  }

  /**
   * Broadcast token transfer to subscribers.
   * 
   * @param {string} address - Address to notify
   * @param {any} transferData - Transfer data
   */
  broadcastTokenTransfer(address: string, transferData: any) {
    const room = `token-transfers:${address.toLowerCase()}`;
    this.server.to(room).emit('token-transfer', transferData);
    this.logger.debug(`Broadcasted token transfer to ${address} (${this.getRoomSize(room)} clients)`);
  }

  /**
   * Broadcast token update to subscribers.
   * 
   * @param {string} tokenAddress - Token address
   * @param {any} tokenData - Token data
   */
  broadcastTokenUpdate(tokenAddress: string, tokenData: any) {
    const room = `token:${tokenAddress.toLowerCase()}`;
    this.server.to(room).emit('token-update', tokenData);
    this.logger.debug(`Broadcasted token update to ${tokenAddress} (${this.getRoomSize(room)} clients)`);
  }

  /**
   * Get number of clients in a room.
   * 
   * @param {string} room - Room name
   * @returns {number} Number of clients
   */
  private getRoomSize(room: string): number {
    return this.subscriptions.get(room)?.size || 0;
  }

  /**
   * Get connection statistics.
   * 
   * @returns {object} Connection stats
   */
  getStats() {
    return {
      totalConnections: this.server.sockets.sockets.size,
      subscriptions: Object.fromEntries(
        Array.from(this.subscriptions.entries()).map(([room, sockets]) => [
          room,
          sockets.size,
        ]),
      ),
    };
  }
}

