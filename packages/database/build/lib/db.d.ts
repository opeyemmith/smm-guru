import { NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
export declare class Database<TSchema extends Record<string, unknown>> {
    private pool;
    db: NodePgDatabase<TSchema> & {
        $client: pg.Pool;
    };
    schema: TSchema;
    constructor(databaseUrl: string, schema: TSchema);
}
//# sourceMappingURL=db.d.ts.map