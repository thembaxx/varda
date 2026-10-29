import {randomUUID} from 'node:crypto';
import {getPostgresPool} from './postgres';
import {CONFERENCE_ROOMS} from './sa-data';
import {
  ReservationError, RESERVATION_HOURS, reservationDate, parseReservation,
  publicReservation, dateStart, UUID, type Reservation, type ReservationRow,
} from './reservations';

function row(value: Record<string, unknown>): ReservationRow {
  return {
    id: String(value.id),
    userId: String(value.userId),
    requestId: String(value.requestId),
    roomId: String(value.roomId),
    startsAt: Number(value.startsAt),
    endsAt: Number(value.endsAt),
    amountCents: Number(value.amountCents),
    status: value.status as ReservationRow['status'],
    createdAt: Number(value.createdAt),
    cancelledAt: value.cancelledAt === null ? null : Number(value.cancelledAt),
  };
}

/**
 * All writes serialize by room, using a transaction-scoped advisory lock.
 * The lock also prevents concurrent idempotent requests from double-inserting.
 * Never hold the lock beyond the database transaction.
 */
export class PostgresReservationStore {
  async availability(userId: string, date = reservationDate(), now = Date.now()) {
    // Shared validator enforces the original 90-day limit and Johannesburg dates.
    const day = dateStart(date, now);
    const db = getPostgresPool();
    const [busy, owned] = await Promise.all([
      db.query('SELECT "roomId", "startsAt", "endsAt" FROM space_reservation WHERE status = $1 AND "startsAt" < $2 AND "endsAt" > $3 ORDER BY "startsAt"', ['reserved', day + 86400000, day]),
      db.query('SELECT * FROM space_reservation WHERE "userId" = $1 ORDER BY "startsAt" DESC LIMIT 100', [userId]),
    ]);
    return {
      date,
      rooms: CONFERENCE_ROOMS.map(room => ({...room, busy: busy.rows.filter(x => x.roomId === room.id).map(x => ({
        startsAt: new Date(Number(x.startsAt)).toISOString(), endsAt: new Date(Number(x.endsAt)).toISOString(),
      }))})),
      reservations: owned.rows.map(value => publicReservation(row(value))),
      openingHours: RESERVATION_HOURS, maxHours: 4, maxAdvanceDays: 90,
    };
  }

  async reserve(userId: string, value: unknown, now = Date.now()): Promise<Reservation> {
    const input = parseReservation(value, now);
    const client = await getPostgresPool().connect();
    try {
      await client.query('BEGIN');
      // Lock per room: independently requested slots in the same room cannot race.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`user:${userId}`]);
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`room:${input.roomId}`]);
      const prior = await client.query('SELECT * FROM space_reservation WHERE "userId" = $1 AND "requestId" = $2', [userId, input.requestId]);
      if (prior.rowCount) {
        const existing = row(prior.rows[0]);
        if (existing.roomId !== input.roomId || existing.startsAt !== input.startsAt || existing.endsAt !== input.endsAt)
          throw new ReservationError('That request ID was already used for different reservation details.', 409);
        await client.query('COMMIT');
        return publicReservation(existing);
      }
      const conflict = await client.query(
        'SELECT id FROM space_reservation WHERE "roomId"=$1 AND status=$2 AND "startsAt" < $3 AND "endsAt" > $4 LIMIT 1',
        [input.roomId, 'reserved', input.endsAt, input.startsAt],
      );
      if (conflict.rowCount) throw new ReservationError('That room has just been reserved for part of this slot. Choose another time.', 409);
      const count = await client.query('SELECT COUNT(*) AS count FROM space_reservation WHERE "userId"=$1 AND status=$2 AND "endsAt" > $3', [userId, 'reserved', now]);
      if (Number(count.rows[0].count) >= 10)
        throw new ReservationError('You can hold up to ten upcoming reservations. Cancel one before adding another.', 409);
      const record: ReservationRow = {id: randomUUID(), userId, ...input, status: 'reserved', createdAt: now, cancelledAt: null};
      await client.query(
        'INSERT INTO space_reservation (id,"userId","requestId","roomId","startsAt","endsAt","amountCents",status,"createdAt","cancelledAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [record.id, record.userId, record.requestId, record.roomId, record.startsAt, record.endsAt, record.amountCents, record.status, record.createdAt, record.cancelledAt],
      );
      await client.query('COMMIT');
      return publicReservation(record);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async cancel(userId: string, value: unknown, now = Date.now()): Promise<Reservation> {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => key !== 'id'))
      throw new ReservationError('Choose a valid reservation.');
    const id = (value as {id?: unknown}).id;
    if (typeof id !== 'string' || !UUID.test(id))
      throw new ReservationError('Choose a valid reservation.');
    const db = getPostgresPool();
    const result = await db.query(
      "UPDATE space_reservation SET status='cancelled', \"cancelledAt\"=$3 WHERE id=$1 AND \"userId\"=$2 AND status='reserved' AND \"startsAt\" > $3 RETURNING *",
      [id, userId, now],
    );
    if (result.rowCount) return publicReservation(row(result.rows[0]));
    const prior = await db.query('SELECT * FROM space_reservation WHERE id=$1 AND "userId"=$2', [id, userId]);
    if (!prior.rowCount) throw new ReservationError('This reservation could not be found.', 404);
    const existing = row(prior.rows[0]);
    if (existing.status === 'cancelled') return publicReservation(existing);
    throw new ReservationError('A reservation cannot be cancelled after its start time.', 409);
  }
}
