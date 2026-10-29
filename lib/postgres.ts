import {Pool} from 'pg';
import {getDatabase} from './database';

/**
 * Database selection is explicit. A configured DATABASE_URL alone must never
 * silently switch an existing local database or migrate its contents.
 */
export function isPostgres() {
  return process.env.VARDA_DATABASE_DRIVER === 'postgres';
}

const state = globalThis as unknown as {vardaPgPool?: Pool};

export function getPostgresPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !/^postgres(ql)?:\/\//.test(connectionString)) {
    throw new Error('A PostgreSQL DATABASE_URL is required for the durable Varda database.');
  }
  if (!state.vardaPgPool) {
    state.vardaPgPool = new Pool({
      connectionString, max: 3, idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 5000, allowExitOnIdle: true,
    });
    state.vardaPgPool.on('error', () => {
      // A temporarily disconnected idle client is removed by pg.
      // Do not log connection string or driver error details here.
    });
  }
  return state.vardaPgPool;
}

export function getAccountDatabase() {
  if (isPostgres()) return getPostgresPool();
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Production accounts require VARDA_DATABASE_DRIVER=postgres and a durable database.');
  }
  return getDatabase();
}

/** Schema is created only by the explicit migration command, never in a request. */
export const POSTGRES_APPLICATION_SCHEMA = `
  CREATE TABLE IF NOT EXISTS community_post (
    id TEXT PRIMARY KEY,
    "authorId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS community_post_created ON community_post("createdAt" DESC);
  CREATE TABLE IF NOT EXISTS community_like (
    "postId" TEXT NOT NULL REFERENCES community_post(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    PRIMARY KEY ("postId", "userId")
  );
  CREATE TABLE IF NOT EXISTS space_reservation (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "requestId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startsAt" BIGINT NOT NULL,
    "endsAt" BIGINT NOT NULL CHECK ("endsAt" > "startsAt"),
    "amountCents" INTEGER NOT NULL CHECK ("amountCents" > 0),
    status TEXT NOT NULL CHECK (status IN ('reserved', 'cancelled')),
    "createdAt" BIGINT NOT NULL,
    "cancelledAt" BIGINT,
    UNIQUE ("userId", "requestId")
  );
  CREATE INDEX IF NOT EXISTS reservation_room_time
    ON space_reservation("roomId", "startsAt", "endsAt") WHERE status = 'reserved';
  CREATE INDEX IF NOT EXISTS reservation_owner
    ON space_reservation("userId", "createdAt");
`;
