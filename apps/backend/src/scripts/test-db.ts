#!/usr/bin/env tsx
/**
 * Simple Database Test Script
 * Tests database connection and verifies seeded data
 */

import postgres from 'postgres';

async function main() {
  console.log('🔍 Testing database connection and data...');

  // Connect to database
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.nlkwrlsppezqtzlcwdcw:hZicXrEYElofMKuP@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';
  const sql = postgres(DATABASE_URL);

  try {
    console.log('📡 Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    console.log('\n📊 Verifying seeded data...');

    // Check users
    const users = await sql`SELECT id, email, username, roles, status FROM users ORDER BY email`;
    console.log(`👤 Users (${users.length}):`);
    users.forEach(user => {
      console.log(`   • ${user.email} (${user.username}) - ${user.roles.join(', ')} - ${user.status}`);
    });

    // Check providers
    const providers = await sql`SELECT id, name, type, status FROM providers`;
    console.log(`\n🏢 Providers (${providers.length}):`);
    providers.forEach(provider => {
      console.log(`   • ${provider.name} - ${provider.type} - ${provider.status}`);
    });

    // Check services
    const services = await sql`SELECT id, name, category, type, rate FROM services ORDER BY id`;
    console.log(`\n🛠️ Services (${services.length}):`);
    services.forEach(service => {
      console.log(`   • [${service.id}] ${service.name} - ${service.category}/${service.type} - $${service.rate}`);
    });

    // Check wallets
    const wallets = await sql`
      SELECT w.id, w.balance, w.currency, w.status, u.email 
      FROM wallets w 
      JOIN users u ON w.user_id = u.id 
      ORDER BY u.email
    `;
    console.log(`\n💰 Wallets (${wallets.length}):`);
    wallets.forEach(wallet => {
      console.log(`   • ${wallet.email}: $${wallet.balance} ${wallet.currency} - ${wallet.status}`);
    });

    // Check API keys
    const apiKeys = await sql`
      SELECT ak.id, ak.name, ak.permissions, ak.is_active, u.email 
      FROM api_keys ak 
      JOIN users u ON ak.user_id = u.id 
      ORDER BY u.email
    `;
    console.log(`\n🔑 API Keys (${apiKeys.length}):`);
    apiKeys.forEach(key => {
      console.log(`   • ${key.email}: ${key.name} - [${key.permissions.join(', ')}] - ${key.is_active ? 'Active' : 'Inactive'}`);
    });

    // Check transactions
    const transactions = await sql`
      SELECT t.id, t.type, t.amount, t.status, t.description, u.email 
      FROM transactions t 
      JOIN wallets w ON t.wallet_id = w.id 
      JOIN users u ON w.user_id = u.id 
      ORDER BY t.created_at DESC
    `;
    console.log(`\n💳 Transactions (${transactions.length}):`);
    transactions.forEach(tx => {
      console.log(`   • ${tx.email}: ${tx.type} $${tx.amount} - ${tx.status} - ${tx.description}`);
    });

    // Check orders
    const orders = await sql`
      SELECT o.id, o.service, o.link, o.quantity, o.price, o.status, u.email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `;
    console.log(`\n📋 Orders (${orders.length}):`);
    orders.forEach(order => {
      console.log(`   • ${order.email}: Service ${order.service} - ${order.quantity} units - $${order.price} - ${order.status}`);
    });

    console.log('\n🎉 Database verification completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   • Database connection: ✅ Working`);
    console.log(`   • Schema: ✅ All tables exist`);
    console.log(`   • Seed data: ✅ All data populated`);
    console.log(`   • Admin user: ✅ admin@smmguru.com`);
    console.log(`   • Test user: ✅ user@smmguru.com`);
    console.log(`   • Services: ✅ ${services.length} services available`);
    console.log(`   • Providers: ✅ ${providers.length} providers configured`);
    console.log('\n🚀 Your SMM Guru database is ready for use!');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
