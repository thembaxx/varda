"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import type { Reservation } from "@/lib/reservations";

type Room = {
  id: string;
  name: string;
  features: string;
  rateZar: number;
  available: boolean;
  busy: { startsAt: string; endsAt: string }[];
};
type Availability = { date: string; rooms: Room[]; reservations: Reservation[] };
const fieldClass =
  "w-full rounded-lg border border-[#144239]/30 bg-white p-2 text-sm text-[#144239]";
const buttonClass =
  "rounded-lg bg-[#144239] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50";
const dateText = (at: number) => new Date(at + 7_200_000).toISOString().slice(0, 10);
const timeText = (at: string) =>
  new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(at));
const money = (cents: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
const slots = Array.from(
  { length: 24 },
  (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
);

async function jsonResponse(response: Response) {
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "The request could not be completed. Please try again.");
  return data;
}

function AccountAccess() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    try {
      const credentials = {
        email: String(fields.get("email")),
        password: String(fields.get("password")),
      };
      const result =
        mode === "signup"
          ? await authClient.signUp.email({
              ...credentials,
              name: String(fields.get("name")).trim(),
            })
          : await authClient.signIn.email(credentials);
      if (result.error) throw new Error(result.error.message || "We could not sign you in.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-3">
      <p className="text-sm">Sign in to view room availability and manage your reservations.</p>
      <div className="flex flex-wrap gap-2">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            disabled={pending}
            aria-pressed={mode === value}
            className="rounded-lg border border-[#144239]/30 px-3 py-2 text-sm"
            onClick={() => {
              setMode(value);
              setError("");
            }}
          >
            {value === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <form className="space-y-3" onSubmit={submit}>
        {mode === "signup" && (
          <label className="block text-sm">
            Your name
            <input
              className={fieldClass}
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
            />
          </label>
        )}
        <label className="block text-sm">
          Email address
          <input
            className={fieldClass}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            className={fieldClass}
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={10}
            maxLength={128}
            required
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <button className={buttonClass} type="submit" disabled={pending}>
          {pending ? "Connecting…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function BookingForm({
  userId,
  email,
  onSignOut,
}: {
  userId: string;
  email: string;
  onSignOut: () => Promise<void>;
}) {
  const [dates] = useState(() => ({
    min: dateText(Date.now()),
    max: dateText(Date.now() + 90 * 86_400_000),
  }));
  const [date, setDate] = useState(dates.min);
  const [roomId, setRoomId] = useState("fynbos");
  const [time, setTime] = useState("10:00");
  const [hours, setHours] = useState(2);
  const [refresh, setRefresh] = useState(0);
  const [view, setView] = useState<{ key: string; data?: Availability; error?: string }>({
    key: "",
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const request = useRef<{ fingerprint: string; id: string } | null>(null);
  const mutation = useRef<AbortController | null>(null);
  const key = `${userId}:${date}:${refresh}`;
  const current = view.key === key ? view : null;
  const data = current?.data;
  const loading = !current;
  const room = data?.rooms.find((item) => item.id === roomId);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort("timeout"), 15_000);
    fetch(`/api/reservations?date=${encodeURIComponent(date)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(jsonResponse)
      .then((value: Availability) => {
        if (!controller.signal.aborted) setView({ key, data: value });
      })
      .catch((problem) => {
        if (!controller.signal.aborted || controller.signal.reason === "timeout")
          setView({
            key,
            error:
              controller.signal.reason === "timeout"
                ? "Availability took too long to load. Please retry."
                : problem instanceof Error
                  ? problem.message
                  : "Availability could not be loaded.",
          });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [date, key]);

  useEffect(
    () => () => {
      mutation.current?.abort();
    },
    [],
  );

  async function changeReservation(method: "POST" | "DELETE", body: object) {
    if (pending) return;
    setPending(true);
    setError("");
    setMessage("");
    const controller = new AbortController();
    mutation.current = controller;
    const timeout = window.setTimeout(() => controller.abort("timeout"), 15_000);
    try {
      const result: { reservation: Reservation } = await fetch("/api/reservations", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }).then(jsonResponse);
      if (controller.signal.aborted) return;
      request.current = null;
      setCancelling(null);
      setMessage(
        method === "POST"
          ? result.reservation.status === "cancelled"
            ? "This request belongs to a cancelled reservation. Submit again to make a new reservation."
            : `Reserved ${result.reservation.roomName}. Payment is unpaid; no money has been charged.`
          : "Reservation cancelled. No payment was charged or refunded.",
      );
      setRefresh((value) => value + 1);
    } catch (problem) {
      if (!controller.signal.aborted || controller.signal.reason === "timeout")
        setError(
          controller.signal.reason === "timeout"
            ? "Connection timed out. Refresh your reservations or retry the same details to check the outcome."
            : problem instanceof Error
              ? problem.message
              : "Check your connection and retry.",
        );
      if (!controller.signal.aborted) setRefresh((value) => value + 1);
    } finally {
      window.clearTimeout(timeout);
      if (mutation.current === controller) mutation.current = null;
      if (!controller.signal.aborted || controller.signal.reason === "timeout") setPending(false);
    }
  }

  function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fingerprint = JSON.stringify({ roomId, date, time, hours });
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() };
    void changeReservation("POST", { roomId, date, time, hours, requestId: request.current.id });
  }

  async function signOut() {
    setPending(true);
    setError("");
    try {
      await onSignOut();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Sign out failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 text-[#144239]">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="break-all">Signed in as {email}</span>
        <button
          type="button"
          disabled={pending}
          className="underline"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
      <p className="text-sm">
        Reservations hold a room for your chosen time. Payment remains unpaid and checkout is
        separate. Times are South African time (SAST), 08:00–20:00.
      </p>
      <label className="block text-sm">
        Reservation date
        <input
          className={fieldClass}
          type="date"
          required
          min={dates.min}
          max={dates.max}
          value={date}
          disabled={pending}
          onChange={(event) => {
            setDate(event.target.value);
            setMessage("");
          }}
        />
      </label>
      {loading && (
        <p role="status" className="text-sm">
          Checking availability…
        </p>
      )}
      {current?.error && (
        <p role="alert" className="text-sm text-red-800">
          {current.error}
        </p>
      )}
      <button
        type="button"
        className="text-sm underline"
        disabled={pending || loading}
        onClick={() => setRefresh((value) => value + 1)}
      >
        Refresh availability and reservations
      </button>
      {data && (
        <>
          <form className="space-y-3" onSubmit={reserve}>
            <label className="block text-sm">
              Room
              <select
                className={fieldClass}
                value={roomId}
                disabled={pending}
                onChange={(event) => setRoomId(event.target.value)}
              >
                {data.rooms.map((item) => (
                  <option key={item.id} value={item.id} disabled={!item.available}>
                    {item.name} · {money(item.rateZar * 100)}/hr
                    {item.available ? "" : " · unavailable"}
                  </option>
                ))}
              </select>
            </label>
            {room && (
              <>
                <p className="text-sm">{room.features}</p>
                <p className="text-sm">
                  {room.busy.length
                    ? `Reserved on this date: ${room.busy.map((slot) => `${timeText(slot.startsAt)}–${timeText(slot.endsAt)}`).join(", ")}.`
                    : "No reservations recorded for this room on this date."}{" "}
                  Availability is checked again when you reserve.
                </p>
              </>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Start time
                <select
                  className={fieldClass}
                  value={time}
                  disabled={pending}
                  onChange={(event) => setTime(event.target.value)}
                >
                  {slots.map((slot) => (
                    <option key={slot}>{slot}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Duration
                <select
                  className={fieldClass}
                  value={hours}
                  disabled={pending}
                  onChange={(event) => setHours(Number(event.target.value))}
                >
                  {[1, 2, 3, 4].map((value) => (
                    <option key={value} value={value}>
                      {value} {value === 1 ? "hour" : "hours"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-sm">
              Room charge:{" "}
              <strong>{room ? money(room.rateZar * hours * 100) : "Select a room"}</strong>. No
              payment is taken here.
            </p>
            <button className={buttonClass} type="submit" disabled={pending || !room?.available}>
              {pending ? "Saving…" : "Reserve room · unpaid"}
            </button>
          </form>
          <section
            aria-label="Your room reservations"
            className="space-y-2 border-t border-[#144239]/20 pt-3"
          >
            <h4 className="font-bold">Your reservations</h4>
            {data.reservations.length === 0 ? (
              <p className="text-sm">You have no room reservations yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.reservations.map((item) => (
                  <li
                    key={item.id}
                    className="space-y-1 rounded-lg border border-[#144239]/20 p-3 text-sm"
                  >
                    <strong>{item.roomName}</strong>
                    <p>
                      {new Intl.DateTimeFormat("en-ZA", {
                        dateStyle: "medium",
                        timeZone: "Africa/Johannesburg",
                      }).format(new Date(item.startsAt))}{" "}
                      · {timeText(item.startsAt)}–{timeText(item.endsAt)} SAST
                    </p>
                    <p>
                      {money(item.amountCents)} ·{" "}
                      {item.status === "reserved" ? "Reserved · unpaid" : "Cancelled"}
                    </p>
                    {item.status === "reserved" &&
                      (cancelling === item.id ? (
                        <div role="group" aria-label={`Confirm cancellation of ${item.roomName}`}>
                          <p>Cancel this room reservation?</p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              className="underline"
                              disabled={pending}
                              onClick={() => void changeReservation("DELETE", { id: item.id })}
                            >
                              Confirm cancellation
                            </button>
                            <button
                              type="button"
                              className="underline"
                              disabled={pending}
                              onClick={() => setCancelling(null)}
                            >
                              Keep reservation
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="underline"
                          disabled={pending}
                          onClick={() => setCancelling(item.id)}
                        >
                          Cancel reservation
                        </button>
                      ))}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ReservationBooking() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  if (isPending)
    return (
      <p role="status" className="text-sm">
        Checking your account…
      </p>
    );
  if (error)
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm">
          Accounts are unavailable. Reconnect and retry.
        </p>
        <button type="button" className="text-sm underline" onClick={() => void refetch()}>
          Retry account connection
        </button>
      </div>
    );
  if (!session) return <AccountAccess />;
  return (
    <BookingForm
      key={session.user.id}
      userId={session.user.id}
      email={session.user.email}
      onSignOut={async () => {
        const result = await authClient.signOut();
        if (result.error) throw new Error(result.error.message || "Sign out failed.");
      }}
    />
  );
}
