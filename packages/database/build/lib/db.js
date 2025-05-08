"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = __importDefault(require("pg"));
class Database {
    constructor(databaseUrl, schema) {
        this.pool = new pg_1.default.Pool({
            connectionString: databaseUrl,
        });
        this.db = (0, node_postgres_1.drizzle)({
            client: this.pool,
            casing: "snake_case",
            schema,
        });
        this.schema = schema;
    }
}
exports.Database = Database;
//# sourceMappingURL=db.js.map