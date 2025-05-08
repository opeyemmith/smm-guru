import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

export class Database<TSchema extends Record<string, unknown>> {
  private pool: pg.Pool;
  public db: NodePgDatabase<TSchema> & {
    $client: pg.Pool;
  };
  public schema: TSchema;

  constructor(databaseUrl: string, schema: TSchema) {
    this.pool = new pg.Pool({
      connectionString: databaseUrl,
    });

    this.db = drizzle({
      client: this.pool,
      casing: "snake_case",
      schema,
    });

    this.schema = schema;
  }
}
