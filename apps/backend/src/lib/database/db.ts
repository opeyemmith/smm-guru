import { Database, allSchemas } from "@smm-guru/database";
import { DATABASE_URL } from "../env.js";

const database = new Database(DATABASE_URL, allSchemas);

export const db = database.db;

export const schema = database.schema;
