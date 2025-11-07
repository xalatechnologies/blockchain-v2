import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

/**
 * Notifications Service
 * 
 * Manages user notifications and real-time delivery via WebSocket.
 * Supports push notifications, email notifications, and in-app notifications.
 * 
 * @class NotificationsService
 * @example
 * ```typescript
 * // Create and send notification
 * await notificationsService.create({
 *   userId: 'user-id',
 *   type: 'transaction',
 *   title: 'New Transaction',
 *   message: 'You received 1 ETH',
 *   data: { txHash: '0x...' }
 * });
 * ```
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private websocketGateway: WebSocketGateway,
  ) {}

  /**
   * Creates a new notification.
   * 
   * @param {CreateNotificationDto} dto - Notification data
   * @returns {Promise<Notification>} Created notification
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    const saved = await this.notificationRepository.save(notification);

    // Send via WebSocket if user is connected
    this.websocketGateway.server
      .to(`user:${dto.userId}`)
      .emit('notification', saved);

    this.logger.log(`Notification created: ${saved.id} for user ${dto.userId}`);
    return saved;
  }

  /**
   * Gets notifications for a user.
   * 
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<Notification[]>} Array of notifications
   */
  async getUserNotifications(
    userId: string,
    options: { limit?: number; unreadOnly?: boolean } = {},
  ): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (options.unreadOnly) {
      query.andWhere('notification.read = false');
    }

    if (options.limit) {
      query.limit(options.limit);
    }

    return query.getMany();
  }

  /**
   * Marks a notification as read.
   * 
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Notification>} Updated notification
   */
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  /**
   * Marks all notifications as read for a user.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );
  }

  /**
   * Deletes a notification.
   * 
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<void>}
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId, userId });
  }

  /**
   * Gets unread notification count for a user.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  /**
   * Sends a real-time notification to a user.
   * 
   * @param {string} userId - User ID
   * @param {any} data - Notification data
   */
  sendRealtimeNotification(userId: string, data: any) {
    this.websocketGateway.server
      .to(`user:${userId}`)
      .emit('notification', data);
  }
}

