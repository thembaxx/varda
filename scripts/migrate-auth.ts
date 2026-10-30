import { getMigrations } from "better-auth/db/migration";
import { getAuth } from "../lib/auth";
import { getDatabase } from "../lib/database";
import { RESERVATION_SCHEMA } from "../lib/reservations";

async function main() {
  const { runMigrations } = await getMigrations(getAuth().options);
  await runMigrations();
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS community_post (
      id TEXT PRIMARY KEY, authorId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      title TEXT NOT NULL, message TEXT NOT NULL, category TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS community_post_created ON community_post(createdAt DESC);
    CREATE TABLE IF NOT EXISTS community_like (
      postId TEXT NOT NULL REFERENCES community_post(id) ON DELETE CASCADE,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      PRIMARY KEY (postId, userId)
    );
  `);
  getDatabase().exec(RESERVATION_SCHEMA);
  console.log("Varda account database is ready. Local secrets stay in .env.local.");
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
});
