import type { Context, Next } from "hono";

// Environment types
export interface AuthEnvironment {
  // Database
  DATABASE_URL: string;
  
  // OAuth
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  
  // Email
  AUTH_DELIVERY_EMAIL?: string;
  PROJECT_NAME?: string;
  RESEND_API_KEY?: string;
  
  // Redis
  REDIS_URL?: string;
  UPSTASH_REDIS_URL?: string;
  
  // Security
  AES_SECRET_KEY?: string;
  
  // Client
  CLIENT_DOMAIN?: string;
  APP_DOMAIN?: string;
}

// Auth configuration types
export interface AuthConfigOptions {
  environment: 'frontend' | 'backend';
  env: AuthEnvironment;
  appName?: string;
  enableEmailPassword?: boolean;
  enableGitHubOAuth?: boolean;
  enableApiKey?: boolean;
  enableAdmin?: boolean;
  customHooks?: {
    afterSignIn?: (context: any) => Promise<void>;
    beforeSignIn?: (context: any) => Promise<void>;
    sendResetPassword?: (params: { user: any; url: string }) => Promise<void>;
  };
}

// Session types
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User | null;
  session: Session | null;
}

// Hono context types
export interface HonoAuthSession {
  Variables: {
    user: User | null;
    session: Session | null;
    "user-id": string;
  };
}

// Middleware types
export type AuthMiddleware = (c: Context, next: Next) => Promise<Response | void>;

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDuration: number;
  keyGenerator?: (c: Context) => string;
}

export interface RateLimitStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<number>;
  delete(key: string): Promise<void>;
}
