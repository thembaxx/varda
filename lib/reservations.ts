import type Database from 'better-sqlite3';
import {randomUUID} from 'node:crypto';
import {CONFERENCE_ROOMS} from './sa-data';

export const RESERVATION_SCHEMA = `
  CREATE TABLE IF NOT EXISTS space_reservation (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    requestId TEXT NOT NULL,
    roomId TEXT NOT NULL,
    startsAt INTEGER NOT NULL,
    endsAt INTEGER NOT NULL CHECK(endsAt > startsAt),
    amountCents INTEGER NOT NULL CHECK(amountCents > 0),
    status TEXT NOT NULL CHECK(status IN ('reserved','cancelled')),
    createdAt INTEGER NOT NULL,
    cancelledAt INTEGER,
    UNIQUE(userId, requestId)
  );
  CREATE INDEX IF NOT EXISTS reservation_room_time
    ON space_reservation(roomId, startsAt, endsAt) WHERE status='reserved';
  CREATE INDEX IF NOT EXISTS reservation_owner ON space_reservation(userId, createdAt);
`;

export const RESERVATION_HOURS = {start: '08:00', end: '20:00', timeZone: 'Africa/Johannesburg'};
const DAY = 86_400_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ReservationError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

type ReservationRow = {
  id: string; userId: string; requestId: string; roomId: string; startsAt: number;
  endsAt: number; amountCents: number; status: 'reserved' | 'cancelled';
  createdAt: number; cancelledAt: number | null;
};

export type Reservation = {
  id: string; roomId: string; roomName: string; startsAt: string; endsAt: string;
  amountCents: number; currency: 'ZAR'; status: 'reserved' | 'cancelled';
  paymentStatus: 'unpaid'; createdAt: string; cancelledAt: string | null;
};

function publicReservation(row: ReservationRow): Reservation {
  return {
    id: row.id, roomId: row.roomId,
    roomName: CONFERENCE_ROOMS.find(room => room.id === row.roomId)?.name ?? row.roomId,
    startsAt: new Date(row.startsAt).toISOString(), endsAt: new Date(row.endsAt).toISOString(),
    amountCents: row.amountCents, currency: 'ZAR', status: row.status, paymentStatus: 'unpaid',
    createdAt: new Date(row.createdAt).toISOString(),
    cancelledAt: row.cancelledAt === null ? null : new Date(row.cancelledAt).toISOString(),
  };
}

export function reservationDate(now = Date.now()): string {
  return new Date(now + 2 * 3_600_000).toISOString().slice(0, 10);
}

function dateStart(value: unknown, now: number): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new ReservationError('Choose a valid date.');
  const at = Date.parse(`${value}T00:00:00+02:00`);
  if (!Number.isFinite(at) || reservationDate(at) !== value)
    throw new ReservationError('Choose a valid date.');
  const firstDay = Date.parse(`${reservationDate(now)}T00:00:00+02:00`);
  if (at < firstDay || at > firstDay + 90 * DAY)
    throw new ReservationError('Choose a date from today through the next 90 days.');
  return at;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ReservationError('Send the reservation details as an object.');
  return value as Record<string, unknown>;
}

function parseReservation(value: unknown, now: number) {
  const input = record(value);
  if (Object.keys(input).some(key => !['roomId', 'date', 'time', 'hours', 'requestId'].includes(key)))
    throw new ReservationError('Send only the room, date, time, hours and request ID.');
  const room = CONFERENCE_ROOMS.find(item => item.id === input.roomId && item.available);
  if (!room) throw new ReservationError('Choose an available room.');
  const day = dateStart(input.date, now);
  if (typeof input.time !== 'string' || !/^(0[8-9]|1\d):(00|30)$/.test(input.time))
    throw new ReservationError('Start on the hour or half-hour between 08:00 and 19:30.');
  if (typeof input.hours !== 'number' || !Number.isInteger(input.hours) || input.hours < 1 || input.hours > 4)
    throw new ReservationError('Reserve between one and four whole hours.');
  if (typeof input.requestId !== 'string' || !UUID.test(input.requestId))
    throw new ReservationError('A valid reservation request ID is required.');
  const [hour, minute] = input.time.split(':').map(Number);
  const startsAt = day + (hour * 60 + minute) * 60_000;
  const endsAt = startsAt + input.hours * 3_600_000;
  if (startsAt <= now || endsAt > day + 20 * 3_600_000)
    throw new ReservationError('Choose a future slot that ends by 20:00 South African time.');
  return {roomId: room.id, startsAt, endsAt, amountCents: room.rateZar * input.hours * 100, requestId: input.requestId};
}

/** Run on a persistent SQLite volume. Immediate transactions serialize slot checks and writes. */
export class ReservationStore {
  constructor(private db: Database.Database) {
    db.pragma('busy_timeout = 5000');
    db.exec(RESERVATION_SCHEMA);
  }

  availability(userId: string, date = reservationDate(), now = Date.now()) {
    const day = dateStart(date, now);
    const busy = this.db.prepare(`SELECT roomId, startsAt, endsAt FROM space_reservation
      WHERE status='reserved' AND startsAt < ? AND endsAt > ? ORDER BY startsAt`).all(day + DAY, day) as
      Pick<ReservationRow, 'roomId' | 'startsAt' | 'endsAt'>[];
    const own = this.db.prepare(`SELECT * FROM space_reservation WHERE userId=?
      ORDER BY startsAt DESC LIMIT 100`).all(userId) as ReservationRow[];
    return {
      date,
      rooms: CONFERENCE_ROOMS.map(room => ({...room, busy: busy.filter(slot => slot.roomId === room.id).map(slot => ({
        startsAt: new Date(slot.startsAt).toISOString(), endsAt: new Date(slot.endsAt).toISOString(),
      }))})),
      reservations: own.map(publicReservation), openingHours: RESERVATION_HOURS, maxHours: 4, maxAdvanceDays: 90,
    };
  }

  reserve(userId: string, value: unknown, now = Date.now()): Reservation {
    const input = parseReservation(value, now);
    return this.db.transaction(() => {
      const existing = this.db.prepare('SELECT * FROM space_reservation WHERE userId=? AND requestId=?')
        .get(userId, input.requestId) as ReservationRow | undefined;
      if (existing) {
        if (existing.roomId !== input.roomId || existing.startsAt !== input.startsAt || existing.endsAt !== input.endsAt)
          throw new ReservationError('That request ID was already used for different reservation details.', 409);
        return publicReservation(existing);
      }
      const conflict = this.db.prepare(`SELECT id FROM space_reservation WHERE roomId=? AND status='reserved'
        AND startsAt < ? AND endsAt > ? LIMIT 1`).get(input.roomId, input.endsAt, input.startsAt);
      if (conflict) throw new ReservationError('That room has just been reserved for part of this slot. Choose another time.', 409);
      const current = this.db.prepare(`SELECT count(*) AS count FROM space_reservation
        WHERE userId=? AND status='reserved' AND endsAt > ?`).get(userId, now) as {count: number};
      if (current.count >= 10) throw new ReservationError('You can hold up to ten upcoming reservations. Cancel one before adding another.', 409);
      const row: ReservationRow = {
        id: randomUUID(), userId, ...input, status: 'reserved', createdAt: now, cancelledAt: null,
      };
      this.db.prepare(`INSERT INTO space_reservation
        (id,userId,requestId,roomId,startsAt,endsAt,amountCents,status,createdAt,cancelledAt)
        VALUES (@id,@userId,@requestId,@roomId,@startsAt,@endsAt,@amountCents,@status,@createdAt,@cancelledAt)`).run(row);
      return publicReservation(row);
    }).immediate();
  }

  cancel(userId: string, value: unknown, now = Date.now()): Reservation {
    const input = record(value);
    if (Object.keys(input).some(key => key !== 'id') || typeof input.id !== 'string' || !UUID.test(input.id))
      throw new ReservationError('Choose a valid reservation.');
    return this.db.transaction(() => {
      const existing = this.db.prepare('SELECT * FROM space_reservation WHERE id=? AND userId=?')
        .get(input.id, userId) as ReservationRow | undefined;
      if (!existing) throw new ReservationError('This reservation could not be found.', 404);
      if (existing.status === 'cancelled') return publicReservation(existing);
      if (existing.startsAt <= now) throw new ReservationError('A reservation cannot be cancelled after its start time.', 409);
      this.db.prepare("UPDATE space_reservation SET status='cancelled',cancelledAt=? WHERE id=? AND userId=?")
        .run(now, existing.id, userId);
      return publicReservation({...existing, status: 'cancelled', cancelledAt: now});
    }).immediate();
  }
}
