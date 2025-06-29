import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, apiKey, createAuthMiddleware } from "better-auth/plugins";
import type { AuthConfigOptions, AuthSession } from "./types";

/**
 * Creates a Better Auth configuration based on environment and options
 */
export function createAuthConfig(
  db: any,
  schemas: any,
  options: AuthConfigOptions
) {
  const {
    environment,
    env,
    appName = "SMM Guru",
    enableEmailPassword = true,
    enableGitHubOAuth = true,
    enableApiKey = true,
    enableAdmin = true,
    customHooks,
  } = options;

  // Base configuration
  const baseConfig: any = {
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schemas,
    }),
    appName,
  };

  // Email and password configuration
  if (enableEmailPassword && environment === 'frontend') {
    baseConfig.emailAndPassword = {
      enabled: true,
      autoSignIn: true,
      sendResetPassword: customHooks?.sendResetPassword || undefined,
    };
  }

  // Social providers configuration
  if (enableGitHubOAuth && env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    baseConfig.socialProviders = {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    };
  }

  // Advanced configuration for frontend
  if (environment === 'frontend') {
    baseConfig.advanced = {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    };
  }

  // Backend-specific configuration
  if (environment === 'backend') {
    baseConfig.advanced = {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    };
  }

  // Hooks configuration
  if (customHooks?.afterSignIn && environment === 'frontend') {
    baseConfig.hooks = {
      after: createAuthMiddleware(customHooks.afterSignIn),
    };
  }

  // Plugins configuration
  const plugins: any[] = [];
  
  if (enableAdmin && environment === 'frontend') {
    plugins.push(admin());
  }
  
  if (enableApiKey && environment === 'backend') {
    plugins.push(apiKey());
  }
  
  if (environment === 'frontend') {
    plugins.push(nextCookies());
  }

  baseConfig.plugins = plugins;

  return betterAuth(baseConfig);
}

/**
 * Factory function to create wallet hook with database dependencies
 */
export function createWalletHookFactory(db: any, schemas: any) {
  return async function createWalletHook(c: any) {
    const newSession = c.context.newSession;
    const user = newSession?.user;

    if (newSession && user) {
      try {
        const isWalletAvail = await db.query.wallet.findFirst({
          where: schemas.eq(schemas.wallet.userId, user.id),
        });

        if (isWalletAvail) {
          return;
        }

        await db.insert(schemas.wallet).values({
          userId: user.id,
        });
      } catch (error) {
        console.error("Error while creating wallet in after hook:", error);
        throw c.redirect("/sign-in");
      }
    }
  };
}
