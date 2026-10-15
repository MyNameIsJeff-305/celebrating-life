# Celebrating Life · Betesda Baptist Church

Bilingual event and outreach platform for **October 31, 2026 at 7:00 PM**. Doors open at 6:30 PM, as shown in the supplied concert flyer. Free admission. **12200 SW 56th Street, Miami, FL 33175**.

Production hostname: `celebratinglife.betesdachurchmiami.com`.

## Delivery status — October 15, 2026

- Source implemented; Astro check and production build passed (14 HTML pages).
- Five automated integration/security tests passed against a local Postgres-compatible PGlite database and the real Netlify SQL query builder.
- All static internal links resolved in the built output.
- Both label QR codes decoded from the rendered 300 DPI PDF.
- New Netlify project created: `betesda-celebrating-life`, id `7c3a94dc-ca2d-414c-92a0-33f49fab6f43`, team `mediasmart305`.
- Source repository: https://github.com/MyNameIsJeff-305/celebrating-life. Initial code is on `main`; `dev` starts from the same version.
- **Not deployed.** Connecting the repository to the reserved Netlify project is still pending.
- Domain assignment, GoDaddy DNS, production database provisioning, admin secrets and new GA4 property/measurement ID remain pending.
- Browser visual/interaction QA was not performed: a browser runtime was unavailable. Build, link and server tests do not replace mobile browser testing.
- Message is currently text-only; no video URLs were provided. The generated concert artwork is illustrative and derived from the supplied branding, not a photograph of a verified past concert.

## Local use

Node 24 (minimum 22.12). Run `npm ci`, `npm run check`, `npm test`, `npm run build`.

`npm run dev` serves the Astro UI only. For full functions/database development, install the current Netlify CLI, run `netlify dev`, and apply local migrations using `netlify database migrations apply`. Astro-only local preview cannot save forms; it intentionally shows an error instead of a false confirmation.

The test script uses Node's experimental module mock API only to replace the remote connection with an isolated local database. It exercises real handlers, migrations, SQL construction, authentication, attribution, exports and idempotency. Never run these tests against a production database.

## Public routes

Both `/es/` and `/en/` support the same content and functionality:

| Suffix | Purpose |
| --- | --- |
| `/` | Concert invitation |
| `/hope/` | Salvation message, prayer guide, contact and concert links |
| `/connect/` | Prayer requests and contact with the church |
| `/register/` | One-person concert registration |
| `/privacy/` | Data handling and analytics preferences |
| `/admin/` | Authenticated team dashboard |

Permanent printed URLs: `/q/es` and `/q/en`. They redirect to the correct language's message with fixed campaign parameters. Preserve these routes in future versions, even after the event.

## Architecture and data boundaries

- Astro 7 with static pages, self-hosted fonts and minimal client scripts; no React hydration.
- Netlify Functions expose explicit APIs. No Netlify Forms dependency or dual-write race.
- Netlify Database (Postgres) stores separate `qr_visits`, `contacts`, and `attendees` tables. It requires an eligible Credit-based Netlify plan; verify availability before launch. A deploy provisions the database and applies checked-in migrations on supported accounts.
- SQL parameters are bound, not interpolated as raw SQL. Registration IDs are random UUIDs. Retries use the same ID and cannot overwrite an existing submission. A new browser/form submission may still register the same person again; do not describe this as identity deduplication.
- Registration does **not** assert attendance. Authorized staff confirm arrival, preserving the first confirmation time. No ticket payment or capacity restriction is implemented.
- Dashboard uses a signed, HttpOnly, Secure (HTTPS), SameSite=Strict cookie with an 8-hour expiry. Password and signing secret never enter URLs, source files or analytics. Sign-out clears the browser cookie; rotating `SESSION_SECRET` invalidates all issued sessions.
- Login and public write/QR endpoints declare Netlify rate limits. Server-side honeypot and validation reject malformed intake data. Requests must be same-origin.
- Contact requests can be anonymous for prayer. Other intents require name, one contact method, and explicit permission to respond. Future communication permission is separate. No notifications, emails, SMS or automated outreach are sent.
- A signed attribution cookie links a browser's recent QR opening to submitted records for up to 30 days. This is browser attribution, not proof of personal identity. Shared devices and cleared cookies affect attribution. Do not sum contact and attendee records as unique people.

## Reporting

The private dashboard provides QR openings by language, contact requests, registrations, arrivals, age ranges, attributed contacts, a QR-opening-to-contact ratio, and arrivals from browsers with a contact record. Search is paginated (50 per page). CSV export includes all rows of the selected category and neutralizes spreadsheet formula prefixes.

QR counts measure link requests, not camera detections or unique humans. Known bots and prefetches are skipped, but filtering is not exhaustive. GA4 supplies estimated visitor/session counts only for visitors who accept analytics. Its totals can differ from operational records.

## File map

- `src/data/event.ts`: authoritative event facts and ES/EN copy.
- `src/pages/[lang]/[...page].astro`: shared localized route composition.
- `src/components/IntakeForm.astro`, `src/scripts/form.ts`: contact and registration UI.
- `src/components/Admin.astro`, `src/scripts/admin.ts`: staff UI, search, export and arrival actions.
- `src/scripts/analytics.ts`: opt-in GA4 with fixed campaign allowlist and events after successful writes.
- `netlify/functions/`: submit, auth, QR redirect, dashboard, attendance.
- `netlify/lib/`: validation, signed cookies and database connection.
- `netlify/database/migrations/`: immutable SQL migrations applied by deployment.
- `tests/flows.test.mjs`: meaningful server flow/security tests.
- `docs/LAUNCH.md`: deployment, domain, analytics, print and final acceptance steps.

No original Back-to-School records, secrets, analytics IDs or deploy settings have been copied.
