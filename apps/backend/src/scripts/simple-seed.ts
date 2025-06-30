#!/usr/bin/env tsx
/**
 * Simple Database Seeding Script
 * Seeds the fresh database with initial data using direct SQL
 */

import postgres from 'postgres';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting database seeding...');

  // Connect to database using environment variable
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.nlkwrlsppezqtzlcwdcw:hZicXrEYElofMKuP@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';
  const sql = postgres(DATABASE_URL);

  try {
    // Hash passwords
    console.log('🔐 Hashing passwords...');
    const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
    const userPasswordHash = await bcrypt.hash('User123!', 12);

    console.log('👤 Seeding users...');

    // Insert admin user
    await sql`
      INSERT INTO users (
        email, username, password_hash, first_name, last_name, 
        roles, status, email_verified
      ) VALUES (
        'admin@smmguru.com',
        'admin',
        ${adminPasswordHash},
        'System',
        'Administrator',
        ARRAY['admin']::user_role[],
        'active'::user_status,
        true
      ) ON CONFLICT (email) DO NOTHING
    `;

    // Insert test user
    await sql`
      INSERT INTO users (
        email, username, password_hash, first_name, last_name,
        roles, status, email_verified
      ) VALUES (
        'user@smmguru.com',
        'testuser',
        ${userPasswordHash},
        'Test',
        'User',
        ARRAY['user']::user_role[],
        'active'::user_status,
        true
      ) ON CONFLICT (email) DO NOTHING
    `;

    console.log('✅ Users seeded');

    console.log('🏢 Seeding providers...');

    // Insert provider
    await sql`
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
    `;

    console.log('✅ Providers seeded');

    console.log('🛠️ Seeding services...');

    // Get provider ID
    const provider = await sql`
      SELECT id FROM providers WHERE name = 'Test Provider' LIMIT 1
    `;

    if (provider.length === 0) {
      console.error('Provider not found for seeding services');
      return;
    }

    const providerId = provider[0].id;

    // Insert services
    await sql`
      INSERT INTO services (
        id, name, description, category, type, rate, min, max,
        provider_id, provider_service_id, average_time,
        drip_feed, refill, cancel
      ) VALUES 
      (1, 'Instagram Followers - High Quality', 'High quality Instagram followers with profile pictures', 'instagram'::service_category, 'followers'::service_type, 1.50, 100, 10000, ${providerId}, 'ig_followers_hq', '0-1 hours', true, true, true),
      (2, 'Instagram Likes - Real', 'Real Instagram likes from active users', 'instagram'::service_category, 'likes'::service_type, 0.80, 50, 5000, ${providerId}, 'ig_likes_real', '0-30 minutes', false, false, true),
      (3, 'YouTube Views - Worldwide', 'Worldwide YouTube views with high retention', 'youtube'::service_category, 'views'::service_type, 2.00, 1000, 100000, ${providerId}, 'yt_views_worldwide', '0-6 hours', true, false, true),
      (4, 'Facebook Page Likes', 'Facebook page likes from real profiles', 'facebook'::service_category, 'likes'::service_type, 3.00, 100, 5000, ${providerId}, 'fb_page_likes', '0-2 hours', false, true, true),
      (5, 'Twitter Followers - Active', 'Active Twitter followers with engagement', 'twitter'::service_category, 'followers'::service_type, 2.50, 50, 10000, ${providerId}, 'tw_followers_active', '0-4 hours', true, true, true)
      ON CONFLICT (id) DO NOTHING
    `;

    console.log('✅ Services seeded');

    console.log('💰 Seeding wallets...');

    // Create wallets
    await sql`
      INSERT INTO wallets (user_id, balance, status)
      SELECT id, 1000.00, 'active'::wallet_status
      FROM users WHERE email = 'admin@smmguru.com'
      ON CONFLICT (user_id) DO NOTHING
    `;

    await sql`
      INSERT INTO wallets (user_id, balance, status)
      SELECT id, 100.00, 'active'::wallet_status
      FROM users WHERE email = 'user@smmguru.com'
      ON CONFLICT (user_id) DO NOTHING
    `;

    console.log('✅ Wallets seeded');

    console.log('🔑 Seeding API keys...');

    // Create API keys
    await sql`
      INSERT INTO api_keys (user_id, key, name, permissions, is_active)
      SELECT 
        id, 
        'admin_api_key_12345678901234567890',
        'Admin API Key',
        ARRAY['admin', 'read', 'write', 'delete'],
        true
      FROM users WHERE email = 'admin@smmguru.com'
      ON CONFLICT (key) DO NOTHING
    `;

    await sql`
      INSERT INTO api_keys (user_id, key, name, permissions, is_active)
      SELECT 
        id,
        'user_api_key_09876543210987654321',
        'Test User API Key',
        ARRAY['read', 'write'],
        true
      FROM users WHERE email = 'user@smmguru.com'
      ON CONFLICT (key) DO NOTHING
    `;

    console.log('✅ API keys seeded');

    console.log('📊 Inserting sample transactions...');

    // Insert sample transactions for admin user
    await sql`
      INSERT INTO transactions (wallet_id, type, amount, status, description)
      SELECT w.id, 'deposit'::transaction_type, 1000.00, 'completed'::transaction_status, 'Initial admin balance'
      FROM wallets w 
      JOIN users u ON w.user_id = u.id 
      WHERE u.email = 'admin@smmguru.com'
      ON CONFLICT DO NOTHING
    `;

    // Insert sample transactions for test user
    await sql`
      INSERT INTO transactions (wallet_id, type, amount, status, description)
      SELECT w.id, 'deposit'::transaction_type, 100.00, 'completed'::transaction_status, 'Initial test user balance'
      FROM wallets w 
      JOIN users u ON w.user_id = u.id 
      WHERE u.email = 'user@smmguru.com'
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ Sample transactions seeded');

    console.log('📋 Inserting sample order...');

    // Insert sample order for test user
    await sql`
      INSERT INTO orders (user_id, service, provider_id, link, quantity, start_count, remains, price, status, priority)
      SELECT 
        u.id,
        1,
        1,
        'https://instagram.com/testaccount',
        1000,
        500,
        200,
        1.50,
        'in_progress'::order_status,
        'medium'::order_priority
      FROM users u 
      WHERE u.email = 'user@smmguru.com'
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ Sample order seeded');

    console.log('🎉 Database seeding completed successfully!');

    // Verify seeded data
    console.log('\n📊 Verification Summary:');
    
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`👤 Users: ${userCount[0].count}`);
    
    const providerCount = await sql`SELECT COUNT(*) as count FROM providers`;
    console.log(`🏢 Providers: ${providerCount[0].count}`);
    
    const serviceCount = await sql`SELECT COUNT(*) as count FROM services`;
    console.log(`🛠️ Services: ${serviceCount[0].count}`);
    
    const walletCount = await sql`SELECT COUNT(*) as count FROM wallets`;
    console.log(`💰 Wallets: ${walletCount[0].count}`);
    
    const apiKeyCount = await sql`SELECT COUNT(*) as count FROM api_keys`;
    console.log(`🔑 API Keys: ${apiKeyCount[0].count}`);
    
    const transactionCount = await sql`SELECT COUNT(*) as count FROM transactions`;
    console.log(`💳 Transactions: ${transactionCount[0].count}`);
    
    const orderCount = await sql`SELECT COUNT(*) as count FROM orders`;
    console.log(`📋 Orders: ${orderCount[0].count}`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
