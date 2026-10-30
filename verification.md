# Verification — 30 October 2026

The profile/tooling branch incorporates current main `70b0fd9`, including optional email-code sign-in and the shared PostgreSQL account/community/reservation backend. Existing reservation implementation and tests, Next.js/Motion versions, branding and production SQLite safeguards were preserved. Generated icon and service-worker build output is excluded from these source changes.

## Local proof

Checked with Node.js 24.19.0, Bun 1.4.4 and system Chromium:

- Frozen Bun installation, Oxfmt format check, Oxlint and TypeScript passed. Oxlint retains 25 warnings; the Next.js, React and TypeScript rule sets remain enabled. One narrowly scoped export-handler purity exception documents an event-handler false positive.
- All **5 unit tests** passed: email-code configuration/provider failure and SQLite reservation durability/validation.
- Both **PostgreSQL integration tests** passed after explicit migration into a dedicated local test database, including ownership, idempotency, community writes and concurrent booking overlap protection.
- The complete Next.js production build and offline asset manifest completed successfully.

## Browser proof

The final targeted production runs use isolated PostgreSQL 18, a temporary loopback HTTPS certificate/proxy, and desktop (1440 × 1000) and mobile (390 × 844, touch) Chromium contexts. The production SQLite rejection and public-origin checks stay enabled. Tests clean up their own account records; no production database or provider credentials are used.

All **10 affected scenarios passed across the final targeted runs**:

- Registration, profile edit, authenticated community posting, wrong-origin rejection, unpaid booking/idempotency/cancellation, reload and sign-in on both profiles.
- Unauthenticated community writes and unsigned settlement fail closed on both profiles.
- Responsive navigation and page width at 320, 390, 640, 768, 1024, 1280 and 1440 pixels on both profiles.
- Whole-home and Settings accessibility scans have no serious/critical violations on both profiles. A final two-case accessibility rerun passed after darkening Settings help text; accessibility rules were unchanged.
- Installed public shell reloads offline, account controls explain the connection requirement, and caches exclude API/account/payment responses on both profiles.

The other **10 unchanged scenarios** (home/settings access, persisted themes/accents, studio motion preference, offline-payment labels and system appearance) passed in the earlier full Chromium run before the latest-main integration. They were not redundantly rerun locally after the PostgreSQL merge. The CI workflow runs the full **20-case** suite with its own PostgreSQL service and HTTPS harness, alongside format/lint/type/unit/build gates.

## Dialog entrance follow-up

Parallel hosted runs on `e9f1e05` exposed a Settings audit timing race: the passing run completed all 20 cases, while the other scanned modal content at approximately 79% entrance opacity and reported transient blended colours. The steady-state colour tokens were unchanged by this follow-up. Dialogs now skip entrance animation when the device requests reduced motion; regular entrance motion is preserved. Accessibility checks wait for the visible dialog content to reach opacity 1 and its settled transform before running the same Axe rules. The focused desktop/mobile accessibility checks passed **2/2** against the rebuilt production HTTPS/PostgreSQL app. Lint, TypeScript and production build also passed.

## Boundaries

No production deployment, production data migration, live email-code delivery or payment settlement was performed. Physical-device installation, haptics and native sharing remain device checks. Automated accessibility results cover the tested pages/states, not every possible interaction.
