import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Supabase Database Configuration
 * 
 * Configures TypeORM to work with Supabase PostgreSQL.
 * Supabase uses standard PostgreSQL, so TypeORM works seamlessly.
 * 
 * @param {ConfigService} configService - Configuration service
 * @returns {TypeOrmModuleOptions} TypeORM configuration
 */
export const supabaseDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const useSupabase = configService.get('USE_SUPABASE') === 'true';
  
  if (!useSupabase) {
    return null; // Use regular database config
  }

  // Supabase provides connection string
  const connectionString = configService.get('SUPABASE_DB_URL');
  
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL is required when USE_SUPABASE=true');
  }

  return {
    type: 'postgres',
    url: connectionString,
    synchronize: configService.get('NODE_ENV') === 'development',
    logging: configService.get('NODE_ENV') === 'development',
    ssl: {
      rejectUnauthorized: false,
    },
    // Entities are imported from database.config.ts
  };
};

