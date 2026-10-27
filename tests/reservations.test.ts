import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ReservationStore } from '../lib/reservations';
const now = Date.parse('2026-10-27T06:00:00Z');
const input = () => ({roomId: 'fynbos', date: '2026-10-28', time: '10:00', hours: 2, requestId: randomUUID()});
test('durable availability, overlap, idempotency and owner cancellation', () => {
 const dir = mkdtempSync(join(tmpdir(), 'varda-reservations-'));
 const path = join(dir, 'store.sqlite');
 let db = new Database(path);
 try {
  db.pragma('foreign_keys = ON'); db.exec("CREATE TABLE user(id TEXT PRIMARY KEY); INSERT INTO user VALUES ('alice'),('bob');");
  let store = new ReservationStore(db); const details = input();
  const saved = store.reserve('alice', details, now);
  assert.equal(saved.amountCents, 24000); assert.equal(saved.paymentStatus, 'unpaid');
  assert.equal(saved.startsAt, '2026-10-28T08:00:00.000Z');
  assert.equal(store.reserve('alice', details, now).id, saved.id);
  assert.throws(() => store.reserve('alice', {...details, hours: 1}, now));
  assert.throws(() => store.reserve('bob', input(), now), /just been reserved/);
  assert.throws(() => store.cancel('bob', {id:saved.id}, now), /could not be found/);
  const view = store.availability('bob', '2026-10-28', now);
  assert.deepEqual(view.reservations, []); assert.equal(JSON.stringify(view.rooms).includes('alice'), false);
  db.close(); db = new Database(path); store = new ReservationStore(db);
  assert.equal(store.availability('alice', '2026-10-28', now).reservations[0].id, saved.id);
  assert.equal(store.cancel('alice', {id: saved.id}, now).status, 'cancelled');
  assert.equal(store.reserve('bob', input(), now).status, 'reserved');
 } finally { db.close(); rmSync(dir,{recursive:true,force:true}); }
});
test('invalid, past, out-of-hours, unavailable and client pricing requests fail closed', () => {
 const db = new Database(':memory:'); db.exec("CREATE TABLE user(id TEXT PRIMARY KEY); INSERT INTO user VALUES ('alice');");
 try { const store = new ReservationStore(db);
  for (const extra of [{date:'2026-02-30'},{date:'2026-10-26'},{time:'07:30'},{time:'19:30',hours:1},{hours:0},{hours:5},{roomId:'marula'},{amountCents:1}])
    assert.throws(() => store.reserve('alice',{...input(),...extra},now));
 } finally {db.close();}
});
