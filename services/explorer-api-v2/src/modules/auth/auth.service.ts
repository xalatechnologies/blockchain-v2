import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
// Generate unique API key
function generateApiKey(): string {
  return 'nk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
import { User } from './entities/user.entity';
import { ApiKey } from './entities/api-key.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

/**
 * Auth Service
 * 
 * Handles user authentication, registration, and API key management.
 * Provides JWT token generation and validation.
 * 
 * @class AuthService
 * @example
 * ```typescript
 * // Register a new user
 * const user = await authService.register({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * 
 * // Login and get JWT token
 * const { access_token } = await authService.login({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * ```
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    private jwtService: JwtService,
  ) {}

  /**
   * Registers a new user.
   * 
   * Creates a new user account with hashed password.
   * Throws ConflictException if user already exists.
   * 
   * @param {RegisterDto} registerDto - Registration data
   * @returns {Promise<User>} Created user (without password)
   * @throws {ConflictException} If user already exists
   * @example
   * ```typescript
   * const user = await authService.register({
   *   email: 'user@example.com',
   *   password: 'password123',
   *   name: 'John Doe'
   * });
   * ```
   */
  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      roles: ['user'],
    });

    return this.userRepository.save(user);
  }

  /**
   * Authenticates a user and returns JWT token.
   * 
   * Validates email and password, then generates a JWT token.
   * Throws UnauthorizedException if credentials are invalid.
   * 
   * @param {LoginDto} loginDto - Login credentials
   * @returns {Promise<{ access_token: string }>} JWT access token
   * @throws {UnauthorizedException} If credentials are invalid
   * @example
   * ```typescript
   * const { access_token } = await authService.login({
   *   email: 'user@example.com',
   *   password: 'password123'
   * });
   * ```
   */
  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Validates a user by ID.
   * 
   * Used by JWT strategy to validate token payload.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<User | null>} User if found and active, null otherwise
   * @example
   * ```typescript
   * const user = await authService.validateUserById('user-id');
   * ```
   */
  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
  }

  /**
   * Validates an API key.
   * 
   * Checks if API key exists, is active, and not expired.
   * Updates lastUsedAt timestamp on successful validation.
   * 
   * @param {string} apiKey - API key string
   * @returns {Promise<ApiKey | null>} API key entity if valid, null otherwise
   * @example
   * ```typescript
   * const key = await authService.validateApiKey('nk_abc123...');
   * if (key) {
   *   // API key is valid
   * }
   * ```
   */
  async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    const key = await this.apiKeyRepository.findOne({
      where: { key: apiKey, isActive: true },
      relations: ['user'],
    });

    if (!key) {
      return null;
    }

    // Check expiration
    if (key.expiresAt && key.expiresAt < new Date()) {
      return null;
    }

    // Update last used
    key.lastUsedAt = new Date();
    await this.apiKeyRepository.save(key);

    return key;
  }

  /**
   * Creates a new API key for a user.
   * 
   * Generates a unique API key and associates it with the user.
   * 
   * @param {string} userId - User ID
   * @param {CreateApiKeyDto} createApiKeyDto - API key creation data
   * @returns {Promise<ApiKey>} Created API key
   * @throws {UnauthorizedException} If user not found
   * @example
   * ```typescript
   * const apiKey = await authService.createApiKey('user-id', {
   *   name: 'My API Key',
   *   scopes: ['read', 'write'],
   *   expiresAt: '2025-12-31T23:59:59.000Z'
   * });
   * ```
   */
  async createApiKey(
    userId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKey> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const apiKey = this.apiKeyRepository.create({
      key: generateApiKey(),
      name: createApiKeyDto.name,
      description: createApiKeyDto.description,
      scopes: createApiKeyDto.scopes || ['read'],
      expiresAt: createApiKeyDto.expiresAt
        ? new Date(createApiKeyDto.expiresAt)
        : null,
      user,
    });

    return this.apiKeyRepository.save(apiKey);
  }

  /**
   * Gets all API keys for a user.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<ApiKey[]>} Array of API keys
   * @example
   * ```typescript
   * const keys = await authService.getApiKeys('user-id');
   * ```
   */
  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Revokes an API key.
   * 
   * Sets the API key as inactive. Only the owner can revoke their keys.
   * 
   * @param {string} userId - User ID (owner)
   * @param {string} apiKeyId - API key ID to revoke
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} If API key not found or not owned by user
   * @example
   * ```typescript
   * await authService.revokeApiKey('user-id', 'api-key-id');
   * ```
   */
  async revokeApiKey(userId: string, apiKeyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId, userId },
    });

    if (!apiKey) {
      throw new UnauthorizedException('API key not found');
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
  }
}
