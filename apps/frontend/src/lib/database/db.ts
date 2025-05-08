import { DATABASE_URL } from "../env";
import { Database, allSchemas } from "@smm-guru/database";

const database = new Database(DATABASE_URL, allSchemas);

export const db = database.db;
