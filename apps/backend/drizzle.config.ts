import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: '../../packages/database/src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/smmguru',
  },
  verbose: true,
  strict: true,
});
