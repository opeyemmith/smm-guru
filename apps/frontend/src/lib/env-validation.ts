/**
 * Environment variable validation for security
 * Ensures all critical environment variables are present and valid
 */

interface RequiredEnvVars {
  DATABASE_URL: string;
  AES_SECRET_KEY: string;
  PROJECT_NAME: string;
  AUTH_DELIVERY_EMAIL: string;
}

interface OptionalEnvVars {
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  UPSTASH_REDIS_URL?: string;
  CURRENCY_API_KEY?: string;
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
    'PROJECT_NAME',
    'AUTH_DELIVERY_EMAIL'
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

  if (process.env.AUTH_DELIVERY_EMAIL && !isValidEmail(process.env.AUTH_DELIVERY_EMAIL)) {
    errors.push('AUTH_DELIVERY_EMAIL must be a valid email address');
  }

  // Check OAuth configuration consistency
  const hasGitHubId = !!process.env.GITHUB_CLIENT_ID;
  const hasGitHubSecret = !!process.env.GITHUB_CLIENT_SECRET;
  
  if (hasGitHubId !== hasGitHubSecret) {
    errors.push('Both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be provided together');
  }

  // Throw error if any validation failed
  if (errors.length > 0) {
    const errorMessage = [
      '🚨 Environment Variable Validation Failed:',
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
    PROJECT_NAME: process.env.PROJECT_NAME!,
    AUTH_DELIVERY_EMAIL: process.env.AUTH_DELIVERY_EMAIL!,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
    CURRENCY_API_KEY: process.env.CURRENCY_API_KEY,
  };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates environment variables on module load
 * Call this at the start of your application
 */
export function initializeEnvironment(): void {
  try {
    validateEnvironmentVariables();
    console.log('✅ Environment variables validated successfully');
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
