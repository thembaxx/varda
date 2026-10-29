# Varda

Your place. Your people. A mobile-first Next.js community app with an interactive Three.js studio, Framer Motion, Better Auth, and an installable offline shell.

## Run locally

Requires Node.js 22.12+ and npm. SQLite uses a native module; a C++ toolchain is needed if your platform has no prebuilt binary.

```sh
npm ci
npm run setup:local
npm run dev
```

Open `http://localhost:3000`. `setup:local` creates a private `.env.local` with a random account secret and migrates `.data/varda.sqlite`. It preserves existing environment values. Neither file is committed. Re-run `npm run db:migrate` when the account schema changes.

## What works

- A responsive community home, event filters and bookmarks, personal attendance plans, shared-space booking previews, a neighbourhood guide, and persistent greener-living goals.
- Email/password registration, sign-in, profile updates, and sign-out through Better Auth. Passwords and sessions are handled by the library. Accounts do not require an external auth service.
- Authenticated community posts and reactions stored in SQLite. A new board shows conversation starters, explicitly labelled as such. Only real posts are attributed to residents. Offline visitors see their last cached public board; account responses are never cached.
- Light, dark, and system themes; colour accents; per-device motion, haptic, sound, and ambience preferences. Device reduced-motion settings take precedence. Audio is off initially, and ambience pauses when the document is hidden.
- A procedural Three.js flower with damped spring feedback and pointer response. The studio preserves the hardware explorer, shader choices, orbit/zoom, explosion slider, scene editor, and collision physics. Scenes load on demand, cap device pixel ratio, sleep offscreen, and dispose of GPU resources on unmount.
- PWA manifest, maskable icons, install guidance, home-screen shortcuts, safe-area layouts, a first-paint theme bootstrap, a public offline shell, and offline loading of the app's production JavaScript and fonts.

## Offline behaviour

Visit online once, then allow the service worker to finish installing. Saved events, personal plans, goals, preferences, and unpaid payment intents remain on the device. Offline mode in Settings disables account, social-write, and checkout requests; it does not change the device's network connection. A real network outage uses the same saved interface.

`npm run build` writes a list of versioned static assets and a build-specific service-worker cache. This includes dynamically loaded studio and dialog chunks so they can open offline even if they were not previously visited. Installation runs in the background with bounded concurrency. A new worker waits for existing tabs to close before activating. The worker caches only same-origin public assets and the public root HTML. It excludes APIs, auth, payments, RSC payloads, third-party responses, and mutations. Local cached community posts are public content, never account or session data.

Offline payment intents are **unpaid plans**. They are never automatically submitted, marked settled, or charged after reconnection.

## Payments and bookings

Checkout is a sandbox handoff for PayFast and Ozow, gated by real test credentials in `.env.local`. Missing credentials return a visible setup message. Live payment requests fail closed. Payment returns and the notification endpoint never claim settlement. The community board’s Book Pod flow now stores authenticated, unpaid reservations in SQLite. Availability is checked atomically before saving; a room cannot overlap another active reservation. Owners can cancel future reservations. Times use Africa/Johannesburg, half-hour starts between 08:00 and 20:00, one to four hours, up to 90 days ahead. Amounts come from the server room catalogue. Reservation confirmation does not mean payment. Other checkout previews do not reserve rooms.

Before enabling real payments, complete a payment order catalogue and settlement integration with the existing unpaid reservations, verified provider callbacks (including provider-side validation and amount/merchant matching), idempotent settlement, and fulfillment. Then deliberately enable live gateway configuration. No simulated successful payments are used by this interface.

## Deploying accounts

Set a new, random `BETTER_AUTH_SECRET` (at least 32 characters), set `BETTER_AUTH_URL` and `APP_URL` to the public HTTPS origin, and migrate the database before serving requests. Set `AUTH_DATABASE_PATH` to a **persistent, writable volume**, not the source tree or an ephemeral filesystem. Run one SQLite-backed instance, or use a shared durable database before scaling horizontally. Back up the database and protect its directory permissions.

Varda now includes an **explicit, opt-in PostgreSQL adapter** for Better Auth, the authenticated community board, and room reservations. It uses the existing managed `DATABASE_URL` when `VARDA_DATABASE_DRIVER=postgres`; local development continues to use SQLite by default. It never automatically migrates or imports local SQLite records. In production, the SQLite account adapter fails closed rather than writing to an ephemeral serverless filesystem.

**Production rollout order:** (1) create a durable database backup and inspect any old SQLite user/community/reservation records, (2) confirm a dedicated managed PostgreSQL database and the Vercel-provisioned `DATABASE_URL`, (3) from a trusted migration runner with scoped DB credentials, set `VARDA_DATABASE_DRIVER=postgres` and execute `npm run db:migrate`, (4) verify user/session/verification, community and reservation tables and concurrency tests, (5) set Vercel `VARDA_DATABASE_DRIVER=postgres` and a new secret `BETTER_AUTH_SECRET` (32+ characters); set `BETTER_AUTH_URL` and `APP_URL` to the public HTTPS origin, then deploy. Avoid mixing a former SQLite signing secret into an unrelated Postgres environment without a migration plan. Production database changes are **not** executed as part of ordinary builds or HTTP requests.

Postgres reservations use transaction-scoped advisory locks for each room and for the requesting user, preserving overlapping-slot and ten-upcoming-booking limits. Unpaid reservations remain unpaid. Run `npm run test:db` for existing SQLite tests and `RUN_POSTGRES_TESTS=true npm run test:postgres` only against an isolated PostgreSQL database after migration. CI starts a temporary Postgres service. No claim of production data migration is made. Email/password sign-in continues to work independently of email delivery. Optional passwordless **email-code sign-in** uses Better Auth's email OTP plugin (six digits, 5-minute lifetime, three attempts, one-time use, hashed verification storage) and Resend's HTTPS API. To enable it, first verify a sending domain and configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (for example `Varda <login@your-verified-domain.example>`) on the server, set `VARDA_EMAIL_OTP_ENABLED=true`, and set `NEXT_PUBLIC_VARDA_EMAIL_OTP_ENABLED=true` for the matching client build. All four values must be present and the sender verified. Leave both flags false when delivery is unavailable. OTP request and verification endpoints have database-backed per-client limits, although production abuse protection should also include per-recipient and edge-level controls. Important: Better Auth may revoke an existing unverified account's password and sessions after a successful email OTP sign-in; review existing user verification status before enabling. No codes are written to logs or stored in browser storage; a failed provider request does not produce a false success. Run `npm run db:migrate` after enabling the plugin, and verify an actual end-to-end email delivery and OTP login before releasing. `npm run test:auth` covers delivery configuration and provider-failure behavior. Password recovery and verified-email policies are **not** silently enabled by this opt-in feature.

The standalone build includes `public/` and `/_next/static/`. Deploy with HTTPS for service workers, install prompts, and native sharing. Platform/browser support for vibration, native share, installation, and status-bar styling varies; the app provides visual feedback and guided installation fallbacks.

## Checks

```sh
npm run typecheck
npm run lint
npm run build
npm run start
npm run test:e2e
```

The Playwright suite uses the system Chromium when `CHROMIUM_PATH` is set, otherwise `/usr/bin/chromium` if present, or Playwright's installed browser. Install it with `npx playwright install chromium` if needed. Tests use an isolated account and clean it up. Tests cover themes, saved plans, offline reload, mobile layout, auth and community posting, native install events, and accessibility.

See `design-qa.md` for visual checks and `verification.md` for verification evidence.

## Design sources

The provided NOLi reference boards informed forest green, sage, warm yellow, coral, serif headings, and friendly shared-space layouts. Varda self-hosts Fraunces, Outfit, and JetBrains Mono for numbers, and uses Phosphor icons. Font licences are included in `app/fonts/`. The community-room image was generated for this project. Supplementary food and garden photography is from Unsplash ([food](https://images.unsplash.com/photo-1547592180-85f173990554), [garden](https://images.unsplash.com/photo-1416879595882-3373a0480b5b)). The theme implementation follows [web.dev's theming guidance](https://web.dev/learn/design/theming). Authentication follows the [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next).

Reservation storage checks: `node --import tsx --test tests/reservations.test.ts`. Migrate before serving (`npm run db:migrate`); back up the persistent SQLite volume. Availability and reservations require an account and are never cached offline.
