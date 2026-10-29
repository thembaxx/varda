import {getAuth} from '@/lib/auth';
import {getDatabase} from '@/lib/database';
import {isPostgres} from '@/lib/postgres';
import {PostgresReservationStore} from '@/lib/reservations-postgres';
import {ReservationError, ReservationStore, reservationDate} from '@/lib/reservations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'};

function failure(error: unknown) {
  if (error instanceof ReservationError)
    return Response.json({message: error.message}, {status: error.status, headers});
  if (error instanceof SyntaxError)
    return Response.json({message: 'Send valid JSON.'}, {status: 400, headers});
  return Response.json({message: 'Reservation status could not be confirmed. Check your reservations before retrying.'}, {status: 503, headers});
}

async function identity(request: Request) {
  const session = await getAuth().api.getSession({headers: request.headers});
  if (!session?.user) throw new ReservationError('Sign in to view availability and reserve a room.', 401);
  return session.user.id;
}

async function mutationBody(request: Request) {
  const origin = request.headers.get('origin');
  const canonical = new URL(process.env.APP_URL || request.url);
  if (canonical.username || canonical.password || (process.env.NODE_ENV === 'production' && canonical.protocol !== 'https:'))
    throw new ReservationError('Reservations are not configured for this origin.', 503);
  if (!origin || origin !== canonical.origin)
    throw new ReservationError('This request must come from your Varda account.', 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    throw new ReservationError('Send reservation details as JSON.', 415);
  if (Number(request.headers.get('content-length') || 0) > 4096)
    throw new ReservationError('The reservation request is too large.', 413);
  // Bound streamed/chunked requests too; do not rely on Content-Length.
  if (!request.body) throw new ReservationError('Send reservation details.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new ReservationError('The reservation request is too large.', 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

export async function GET(request: Request) {
  try {
    const userId = await identity(request);
    const date = new URL(request.url).searchParams.get('date') ?? reservationDate();
    return Response.json(await (isPostgres() ? new PostgresReservationStore().availability(userId, date) : new ReservationStore(getDatabase()).availability(userId, date)), {headers});
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const userId = await identity(request);
    const body = await mutationBody(request);
    const reservation = await (isPostgres() ? new PostgresReservationStore().reserve(userId, body) : new ReservationStore(getDatabase()).reserve(userId, body));
    return Response.json({reservation}, {status: 201, headers});
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request) {
  try {
    const userId = await identity(request);
    const body = await mutationBody(request);
    const reservation = await (isPostgres() ? new PostgresReservationStore().cancel(userId, body) : new ReservationStore(getDatabase()).cancel(userId, body));
    return Response.json({reservation}, {headers});
  } catch (error) { return failure(error); }
}
