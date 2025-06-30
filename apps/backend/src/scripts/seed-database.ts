#!/usr/bin/env tsx
/**
 * Database Seeding Script
 * Seeds the fresh database with initial data
 */

import bcrypt from 'bcrypt';
import { getDatabaseConnection } from '../infrastructure/database/connection.js';
import { getLogger } from '../infrastructure/monitoring/logger.js';
import { getEnvironmentConfig } from '../config/environment.config.js';

async function main() {
  const logger = getLogger();
  
  try {
    logger.info('🌱 Starting database seeding...');

    // Validate environment configuration
    const envConfig = getEnvironmentConfig();
    if (!envConfig.isValid()) {
      logger.error('Invalid environment configuration');
      process.exit(1);
    }

    // Initialize database connection
    const dbConnection = getDatabaseConnection();
    await dbConnection.initialize();

    logger.info('✅ Database connection established');

    // Seed data
    await seedUsers(dbConnection, logger);
    await seedProviders(dbConnection, logger);
    await seedServices(dbConnection, logger);
    await seedWallets(dbConnection, logger);
    await seedApiKeys(dbConnection, logger);

    logger.info('🎉 Database seeding completed successfully!');

    // Close connection
    await dbConnection.close();

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

async function seedUsers(db: any, logger: any) {
  logger.info('👤 Seeding users...');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const userPasswordHash = await bcrypt.hash('User123!', 12);

  // Insert admin user
  await db.executeRaw(`
    INSERT INTO users (
      email, username, password_hash, first_name, last_name, 
      roles, status, email_verified
    ) VALUES (
      'admin@smmguru.com',
      'admin',
      $1,
      'System',
      'Administrator',
      ARRAY['admin']::user_role[],
      'active'::user_status,
      true
    ) ON CONFLICT (email) DO NOTHING
  `, [adminPasswordHash]);

  // Insert test user
  await db.executeRaw(`
    INSERT INTO users (
      email, username, password_hash, first_name, last_name,
      roles, status, email_verified
    ) VALUES (
      'user@smmguru.com',
      'testuser',
      $1,
      'Test',
      'User',
      ARRAY['user']::user_role[],
      'active'::user_status,
      true
    ) ON CONFLICT (email) DO NOTHING
  `, [userPasswordHash]);

  logger.info('✅ Users seeded');
}

async function seedProviders(db: any, logger: any) {
  logger.info('🏢 Seeding providers...');

  await db.executeRaw(`
    INSERT INTO providers (
      name, description, type, status, api_url, api_key,
      features, statistics, health_check
    ) VALUES (
      'Test Provider',
      'Default test provider for development',
      'api'::provider_type,
      'active'::provider_status,
      'https://api.testprovider.com',
      'test-api-key-12345',
      '{"supportsStatus": true, "supportsCancel": true, "supportsRefill": false, "supportsDripFeed": false, "supportsMultipleOrders": true}',
      '{"totalOrders": 0, "successfulOrders": 0, "failedOrders": 0, "averageResponseTime": 0}',
      '{"isHealthy": true, "consecutiveFailures": 0}'
    ) ON CONFLICT DO NOTHING
  `);

  logger.info('✅ Providers seeded');
}

async function seedServices(db: any, logger: any) {
  logger.info('🛠️ Seeding services...');

  // Get provider ID
  const provider = await db.executeRaw(`
    SELECT id FROM providers WHERE name = 'Test Provider' LIMIT 1
  `);

  if (provider.length === 0) {
    logger.error('Provider not found for seeding services');
    return;
  }

  const providerId = provider[0].id;

  const services = [
    {
      id: 1,
      name: 'Instagram Followers - High Quality',
      description: 'High quality Instagram followers with profile pictures',
      category: 'instagram',
      type: 'followers',
      rate: 1.50,
      min: 100,
      max: 10000,
      provider_service_id: 'ig_followers_hq',
      average_time: '0-1 hours',
      drip_feed: true,
      refill: true,
      cancel: true
    },
    {
      id: 2,
      name: 'Instagram Likes - Real',
      description: 'Real Instagram likes from active users',
      category: 'instagram',
      type: 'likes',
      rate: 0.80,
      min: 50,
      max: 5000,
      provider_service_id: 'ig_likes_real',
      average_time: '0-30 minutes',
      drip_feed: false,
      refill: false,
      cancel: true
    },
    {
      id: 3,
      name: 'YouTube Views - Worldwide',
      description: 'Worldwide YouTube views with high retention',
      category: 'youtube',
      type: 'views',
      rate: 2.00,
      min: 1000,
      max: 100000,
      provider_service_id: 'yt_views_worldwide',
      average_time: '0-6 hours',
      drip_feed: true,
      refill: false,
      cancel: true
    }
  ];

  for (const service of services) {
    await db.executeRaw(`
      INSERT INTO services (
        id, name, description, category, type, rate, min, max,
        provider_id, provider_service_id, average_time,
        drip_feed, refill, cancel
      ) VALUES (
        $1, $2, $3, $4::service_category, $5::service_type, $6, $7, $8,
        $9, $10, $11, $12, $13, $14
      ) ON CONFLICT (id) DO NOTHING
    `, [
      service.id, service.name, service.description, service.category,
      service.type, service.rate, service.min, service.max,
      providerId, service.provider_service_id, service.average_time,
      service.drip_feed, service.refill, service.cancel
    ]);
  }

  logger.info('✅ Services seeded');
}

async function seedWallets(db: any, logger: any) {
  logger.info('💰 Seeding wallets...');

  // Create wallet for admin user
  await db.executeRaw(`
    INSERT INTO wallets (user_id, balance, status)
    SELECT id, 1000.00, 'active'::wallet_status
    FROM users WHERE email = 'admin@smmguru.com'
    ON CONFLICT (user_id) DO NOTHING
  `);

  // Create wallet for test user
  await db.executeRaw(`
    INSERT INTO wallets (user_id, balance, status)
    SELECT id, 100.00, 'active'::wallet_status
    FROM users WHERE email = 'user@smmguru.com'
    ON CONFLICT (user_id) DO NOTHING
  `);

  logger.info('✅ Wallets seeded');
}

async function seedApiKeys(db: any, logger: any) {
  logger.info('🔑 Seeding API keys...');

  // Create API key for admin user
  await db.executeRaw(`
    INSERT INTO api_keys (user_id, key, name, permissions, is_active)
    SELECT 
      id, 
      'admin_api_key_12345678901234567890',
      'Admin API Key',
      ARRAY['admin', 'read', 'write', 'delete'],
      true
    FROM users WHERE email = 'admin@smmguru.com'
    ON CONFLICT (key) DO NOTHING
  `);

  // Create API key for test user
  await db.executeRaw(`
    INSERT INTO api_keys (user_id, key, name, permissions, is_active)
    SELECT 
      id,
      'user_api_key_09876543210987654321',
      'Test User API Key',
      ARRAY['read', 'write'],
      true
    FROM users WHERE email = 'user@smmguru.com'
    ON CONFLICT (key) DO NOTHING
  `);

  logger.info('✅ API keys seeded');
}

// Handle CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Seeding script failed:', error);
    process.exit(1);
  });
}
