import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getPostgresPool} from '../lib/postgres';
import {PostgresReservationStore} from '../lib/reservations-postgres';
import {createCommunityPost, listCommunityPosts, toggleCommunityLike} from '../lib/community-postgres';

if (process.env.RUN_POSTGRES_TESTS !== 'true') throw new Error('Run Postgres integration tests only against an isolated PostgreSQL test database.');
const pool = getPostgresPool();
after(async () => { await pool.end(); });

const now = Date.parse('2026-10-27T06:00:00Z');
const input = (requestId = randomUUID()) => ({roomId: 'fynbos', date: '2026-10-28', time: '10:00', hours: 2, requestId});
const user1 = randomUUID(), user2 = randomUUID();

test('PostgreSQL schema, owner-isolated reservations and atomic overlap protection', async () => {
  // A dedicated CI test DB is provisioned and migrated before this suite.
  await pool.query('INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$2,$3,false,NOW(),NOW()), ($4,$5,$6,false,NOW(),NOW())', [
    user1, 'Integration One', `test-${user1}@example.test`,
    user2, 'Integration Two', `test-${user2}@example.test`,
  ]);
  try {
    const store = new PostgresReservationStore();
    const details = input();
    const saved = await store.reserve(user1, details, now);
    assert.equal(saved.amountCents, 24000);
    assert.equal(saved.paymentStatus, 'unpaid');
    assert.equal((await store.reserve(user1, details, now)).id, saved.id);
    await assert.rejects(store.reserve(user1, {...details, hours: 1}, now), /already used/);
    await assert.rejects(store.reserve(user2, input(), now), /just been reserved/);
    const own = await store.availability(user2, '2026-10-28', now);
    assert.deepEqual(own.reservations, []);
    await assert.rejects(store.cancel(user2, {id: saved.id}, now), /could not be found/);
    const cancelled = await store.cancel(user1, {id: saved.id}, now);
    assert.equal(cancelled.status, 'cancelled');
    assert.equal((await store.reserve(user2, input(), now)).status, 'reserved');

    const post = await createCommunityPost(user1, 'Community introduction', 'Hello friends, looking forward to meeting you all!', 'Culture');
    assert.ok(post);
    assert.ok((await listCommunityPosts(user1)).some(p => p.id === post));
    assert.equal(await toggleCommunityLike(user2, post!), true);
    assert.equal((await listCommunityPosts(user2)).find(p => p.id === post)?.liked, true);
    assert.equal(await toggleCommunityLike(user2, post!), false);
  } finally {
    await pool.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [[user1, user2]]);
  }
});

test('concurrent room bookings yield exactly one success', async () => {
  const a = randomUUID(), b = randomUUID();
  await pool.query('INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$2,$3,false,NOW(),NOW()), ($4,$5,$6,false,NOW(),NOW())', [
    a, 'Concurrent A', `test-${a}@example.test`, b, 'Concurrent B', `test-${b}@example.test`,
  ]);
  try {
    const store = new PostgresReservationStore();
    const results = await Promise.allSettled([store.reserve(a, input(), now), store.reserve(b, input(), now)]);
    assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
    assert.equal(results.filter(x => x.status === 'rejected').length, 1);
  } finally {
    await pool.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [[a, b]]);
  }
});
