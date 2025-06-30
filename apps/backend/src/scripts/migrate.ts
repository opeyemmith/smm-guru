#!/usr/bin/env tsx
/**
 * Database Verification CLI Script
 * Verifies database connection and schema for fresh database setup
 */

import { getEnvironmentConfig } from '../config/environment.config.js';
import { getDatabaseConnection } from '../infrastructure/database/connection.js';
import { getLogger } from '../infrastructure/monitoring/logger.js';

async function main() {
  const logger = getLogger();
  const args = process.argv.slice(2);
  const command = args[0] || 'verify';

  try {
    // Validate environment configuration
    const envConfig = getEnvironmentConfig();
    if (!envConfig.isValid()) {
      logger.error('Invalid environment configuration');
      const errors = envConfig.getValidationErrors();
      if (errors) {
        errors.errors.forEach(error => {
          logger.error(`${error.path.join('.')}: ${error.message}`);
        });
      }
      process.exit(1);
    }

    logger.info('🔍 Starting database verification...');
    logger.info(`Environment: ${envConfig.get('NODE_ENV')}`);
    logger.info(`Database: ${envConfig.getDatabaseConfig().url.replace(/\/\/.*@/, '//***:***@')}`);

    // Initialize database connection
    const dbConnection = getDatabaseConnection();
    await dbConnection.initialize();

    // Verify database connectivity
    try {
      const sql = dbConnection.getSql();
      await sql`SELECT 1`;
      logger.info('✅ Database connection verified');
    } catch (error) {
      logger.error('❌ Database connection failed', { error });
      process.exit(1);
    }

    switch (command) {
      case 'verify':
        await verifyDatabase(dbConnection);
        break;

      default:
        showHelp();
        process.exit(1);
    }

    // Close database connection
    await dbConnection.close();
    logger.info('✅ Database connection closed');

  } catch (error) {
    logger.error('❌ Database verification failed', { error });
    process.exit(1);
  }
}

async function verifyDatabase(dbConnection: any) {
  const logger = getLogger();

  logger.info('🔍 Verifying database schema...');

  const sql = dbConnection.getSql();

  const tables = [
    'users',
    'sessions',
    'providers',
    'services',
    'wallets',
    'transactions',
    'orders',
    'api_keys'
  ];

  let allTablesExist = true;

  for (const table of tables) {
    try {
      await sql`SELECT 1 FROM ${sql(table)} LIMIT 1`;
      logger.info(`✅ Table '${table}' exists and is accessible`);
    } catch (error) {
      logger.error(`❌ Table '${table}' is missing or inaccessible`);
      allTablesExist = false;
    }
  }

  if (allTablesExist) {
    logger.info('✅ All required tables exist and are accessible');

    // Check for sample data
    try {
      const adminUser = await sql`SELECT id FROM users WHERE email = 'admin@smmguru.com'`;
      if (adminUser.length > 0) {
        logger.info('✅ Default admin user exists');
      } else {
        logger.warn('⚠️  Default admin user not found - run seeding script');
      }

      const services = await sql`SELECT COUNT(*) as count FROM services`;
      logger.info(`✅ Services table contains ${services[0].count} services`);

      const providers = await sql`SELECT COUNT(*) as count FROM providers`;
      logger.info(`✅ Providers table contains ${providers[0].count} providers`);

    } catch (error) {
      logger.warn('⚠️  Could not verify sample data', { error });
    }
  } else {
    logger.error('❌ Database schema verification failed');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Database Verification CLI

Usage: npm run migrate [command]

Commands:
  verify         Verify database schema and connectivity (default)
  help           Show this help message

Examples:
  npm run migrate          # Verify database schema
  npm run migrate verify   # Verify database schema

Note: For fresh database setup, use:
  pnpm db:push             # Push schema to fresh database
  pnpm db:seed             # Seed database with initial data
`);
}

// Handle CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}
