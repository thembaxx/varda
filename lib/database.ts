import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const globalDatabase = globalThis as unknown as { vardaDatabase?: Database.Database };
export function getDatabase() {
  if (globalDatabase.vardaDatabase) return globalDatabase.vardaDatabase;
  const path = resolve(process.env.AUTH_DATABASE_PATH || ".data/varda.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const database = new Database(path);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  return (globalDatabase.vardaDatabase = database);
}
