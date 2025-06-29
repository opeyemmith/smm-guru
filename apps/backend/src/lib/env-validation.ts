/**
 * Backend environment variable validation for security
 * Ensures all critical environment variables are present and valid
 */

interface RequiredEnvVars {
  DATABASE_URL: string;
  AES_SECRET_KEY: string;
  CLIENT_DOMAIN: string;
}

interface OptionalEnvVars {
  PORT?: number;
  REDIS_URL?: string;
  CRON_JOB_SEC_KEY?: string;
}

/**
 * Validates that all required environment variables are present
 * Throws an error if any required variables are missing
 */
export function validateEnvironmentVariables(): RequiredEnvVars & OptionalEnvVars {
  const errors: string[] = [];
  
  // Required environment variables
  const required: (keyof RequiredEnvVars)[] = [
    'DATABASE_URL',
    'AES_SECRET_KEY',
    'CLIENT_DOMAIN'
  ];

  // Check required variables
  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate specific formats
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (process.env.AES_SECRET_KEY && process.env.AES_SECRET_KEY.length < 32) {
    errors.push('AES_SECRET_KEY must be at least 32 characters long');
  }

  if (process.env.CLIENT_DOMAIN && !isValidUrl(process.env.CLIENT_DOMAIN)) {
    errors.push('CLIENT_DOMAIN must be a valid URL');
  }

  // Validate PORT if provided
  if (process.env.PORT) {
    const port = Number(process.env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid port number (1-65535)');
    }
  }

  // Throw error if any validation failed
  if (errors.length > 0) {
    const errorMessage = [
      '🚨 Backend Environment Variable Validation Failed:',
      ...errors.map(error => `  - ${error}`),
      '',
      'Please check your .env file and ensure all required variables are set.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  // Return validated environment variables
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    AES_SECRET_KEY: process.env.AES_SECRET_KEY!,
    CLIENT_DOMAIN: process.env.CLIENT_DOMAIN!,
    PORT: process.env.PORT ? Number(process.env.PORT) : 8080,
    REDIS_URL: process.env.REDIS_URL,
    CRON_JOB_SEC_KEY: process.env.CRON_JOB_SEC_KEY,
  };
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates environment variables on module load
 * Call this at the start of your application
 */
export function initializeEnvironment(): void {
  try {
    validateEnvironmentVariables();
    console.log('✅ Backend environment variables validated successfully');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

/**
 * Get validated environment variables
 * Use this instead of directly accessing process.env
 */
export const env = validateEnvironmentVariables();
