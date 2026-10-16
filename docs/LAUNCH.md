# Launch handoff / Guía de publicación

## 1. GitHub

Repository: https://github.com/MyNameIsJeff-305/celebrating-life. It was created by the owner and was public when inspected on October 15, 2026. Initial source, print files and documentation are on `main`. No real personal records or secrets are included. Do not upload `node_modules`, `.env`, `.netlify`, `.astro` or `dist` as source.

Branch workflow: `main` for production, `dev` for reviewed integration, feature branches/PRs into `dev`, then a release PR to `main`. The initial `dev` branch matches the initial full implementation on `main`.

## 2. Netlify

The empty project is already reserved. Do not create a second project:

- Dashboard: https://app.netlify.com/projects/betesda-celebrating-life
- Project ID: `7c3a94dc-ca2d-414c-92a0-33f49fab6f43`
- Team: `mediasmart305`
- Intended Netlify hostname: `betesda-celebrating-life.netlify.app` (not live until deployed).

Connect the new GitHub repository to this existing project. Use `main`, the repository root, build command from `netlify.toml`, and publish directory `dist`.

The `.netlify` directory is already gitignored. If linking from the CLI, keep the resulting `.netlify/state.json` local.

Netlify Database is declared via `@netlify/database` and the SQL migration. Confirm the account supports Database and review its usage/credit terms. No production database has been provisioned or billed by this implementation work. Do not apply the schema by manually editing a hosted database; let the deploy run checked-in migrations.

Set the following variables in Netlify before deployment. Use separate values for preview/testing and production where appropriate:

| Name | Scope | Required value |
| --- | --- | --- |
| `PUBLIC_GA_MEASUREMENT_ID` | Builds | New Celebrating Life `G-...` ID; leave empty on test previews |
| `ADMIN_PASSWORD` | Functions, secret | Random password of at least 20 characters; share privately with authorized volunteers |
| `SESSION_SECRET` | Functions, secret | Independent random value of at least 32 characters |

Netlify supplies database connection configuration. Never add a connection string, password or signing secret to the repository, browser code, printed QR or chat. Runtime secrets must be set through Netlify UI/API, not TOML. Redeploy after changing variables.

Before sharing preview links, remember Netlify database preview branches may contain copied production records. All APIs still require staff authentication for reads. Do not make screenshots or exports containing real registrant data public.

## 3. Domain and GoDaddy

After a successful deploy, add `celebratinglife.betesdachurchmiami.com` as the project's custom domain in Netlify. Then add this DNS record in GoDaddy:

| Type | Name / Host | Value / Target | TTL |
| --- | --- | --- | --- |
| CNAME | celebratinglife | betesda-celebrating-life.netlify.app | Default |

Use a hostname, without `https://` or a path, as the CNAME target. Do not change the main domain's nameservers, apex records or mail records. Inspect an existing record at this exact subdomain before replacing it.

Wait for DNS validation and Netlify HTTPS issuance, then test HTTPS on the custom domain and both `/q/es` and `/q/en`. Neither DNS nor the custom domain assignment has been performed in this session.

Official reference: https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/

## 4. Independent Google Analytics 4 property

Create a new property named `Celebrating Life · Betesda`, timezone `America/New_York`, with its own web stream for `https://celebratinglife.betesdachurchmiami.com`. A separate GA account is not necessary; the property and stream must be separate from Back to School.

Use its `G-...` measurement ID for `PUBLIC_GA_MEASUREMENT_ID`. Disable Enhanced Measurement auto-events, particularly form interactions and browser-history page changes: this application explicitly emits the reviewed events. Do not enable user-provided data collection, Google Signals, advertising personalization or prayer-topic dimensions. Keep email redaction enabled.

Events supplied by the code:

| Event | Meaning |
| --- | --- |
| `page_view` | Page view, after analytics consent |
| `form_start` | First interaction with a form, after consent |
| `generate_lead` | New contact request successfully persisted |
| `event_registration` | New concert registration successfully persisted |

Mark the two successful-submission events as key events. The server dashboard is authoritative for saved requests and attendance. No personal names, phone/email, prayer text, chosen spiritual topic or registration ID are transmitted to GA4. Do not add them later as event parameters or URLs.

Bottle campaign: `utm_source=water_bottle`, `utm_medium=qr`, `utm_campaign=celebrating_life_2026`, `utm_content=es|en`.

Validate with a test browser that declines analytics (no Google tag request), then accepts analytics (one page view and one event for a successful form). Verify the new property receives data and the Back-to-School property does not. Rejected submissions and page reloads must not emit success events. Dashboard pages intentionally do not load Analytics.

No GA4 property was created and no measurement ID is configured yet.

Official reference: https://support.google.com/analytics/answer/14183469

## 5. Bottle label

- Trim: **6.500 in wide × 2.255 in high** (468 × 162.36 pt).
- Separate bleed file: 0.125 in per edge; media size **6.750 × 2.505 in**. PDF TrimBox records the final cut size.
- Embedded fonts, vector text/crown and vector QR modules; RGB colors. Ask the printer for their required color profile/finish and convert using that profile if requested. Do not claim CMYK/PDF-X certification.
- Each QR includes a four-module white quiet zone and an approximately 1.056 in square total footprint.
- Both codes decoded successfully from the rendered PDF at 300 DPI.
- Spanish: `https://celebratinglife.betesdachurchmiami.com/q/es`.
- English: `https://celebratinglife.betesdachurchmiami.com/q/en`.

These are **design proofs until the domain and redirects work**. Print at 100%, not fit-to-page. Confirm the printer's dieline, overlap/seam allowance, and bleed requirement. Test an actual label on the chosen bottle, including curvature/condensation and several phones, before the full print run.

The label follows the supplied black/gold crown and script branding. It uses a clean vector reconstruction of the crown motif rather than claiming to include an official logo master.

## 6. Remaining acceptance checks

- Browser review at 390px, tablet and desktop widths; keyboard focus, errors and confirmations in both languages.
- Confirm same-page language switches and all event facts; flyer-derived doors-open time is 6:30 PM.
- Test successful and failed writes in a deployment with test-only data.
- Repeat a request with the same ID: exactly one row. Verify a public registrant cannot read another person's data or mark arrival.
- Simulate volunteers sharing a network, confirm rate limits work for expected gate volume, and agree on a fallback if the venue loses internet. There is no offline queue; a failed save does not confirm registration.
- Search, CSV export, sign-out and expired-session behavior; staff-only arrival confirmation.
- QR opens the right language and contact source persists. Shared-browser linkage is not identity matching.
- Review Spanish/English salvation text with the ministry leader; add approved video URLs if available.
- Decide who handles requests and how long church records will be retained. Follow-up and retention are manual in this version.

## Artwork provenance

`public/concert.webp` is a generated promotional background derived from the provided flyer using the built-in image generation tool. Prompt: “Create a website background image derived from the supplied Celebrating Life Christian concert flyer. Preserve the visual atmosphere: warm amber and golden stage lights, deep near-black surroundings, glowing simple cross in the distant center of the stage, silhouettes of musicians and audience worshipping. Remove ALL lettering, logos, crowns, date, address, icons and event information. This is illustrative promotional artwork, not documentary photography. Landscape wide composition, dark clear negative space in the upper and left half for HTML text overlays. Concert occupies lower-right half. Elegant cinematic amber lights and soft haze, no purple or blue, no scary or Halloween motifs. No text, no watermark.”

## Visual motion

The shared layout owns one decorative `/concert.webp` image, fixed behind the header, page content and footer on every language route. `src/styles/motion.css` adds a 32-second Ken Burns animation that alternates direction continuously (a full out-and-back cycle takes 64 seconds). Mobile uses a smaller zoom. Dark overlays and solid input surfaces maintain readability.

The header's bilingual effects control saves only a local motion preference. System reduced-motion always takes priority; the background also pauses in hidden tabs. With JavaScript disabled, content and the background remain visible and static. Scroll reveals use IntersectionObserver without initially hiding content. No new animation dependency, client-side router, or change to form/analytics lifecycles was added.

Visual direction was informed by https://github.com/midudev/la-velada-web-oficial (layered atmosphere, restrained transitions). Implementation is original; no code or visual assets were copied from that project.

Before launch, review the home, hope and form pages at mobile and desktop widths; check a complete Ken Burns cycle for uncovered edges, pause/resume across page navigation, reduced-motion changes, keyboard navigation and no-JavaScript fallback. Browser visual acceptance remains pending.

## Language and cookie preferences

The unlocalized `/` route chooses a saved manual language preference first, then the first supported language in `navigator.languages`, falling back to English. It preserves query parameters and fragments. Without JavaScript, it defaults to `/en/`. Direct `/es/` and `/en/` routes and language-specific QR links remain explicit; automatic detection never overrides them. The old unconditional Spanish root redirect has been removed.

The cookie notice is a centered native dialog in both languages, with Accept/Reject buttons and a privacy link. Escape dismisses it without granting consent; the footer reopens it. Analytics continues to require explicit acceptance; scrolls, unrelated clicks and form activity do not grant consent. Existing yes/no choices are preserved. The privacy page can be read without an automatic dialog interruption. Analytics consent stays usable within the current page when browser storage is blocked.

For this change, the request to infer acceptance from scrolling has deliberately not been applied: a scroll does not express a clear cookie choice. Review the explicit-choice alternative in the PR before release.

## Website icons

All website pictograms use `@lucide/astro` (pinned in the package lock): ArrowUpRight, ArrowDown, Pause, Play and Crown. Components render inline SVG at build time, inherit the existing colors and include decorative accessibility attributes. No icon font, CDN or client-side icon initialization is required. Use named Lucide imports for future interface icons instead of Unicode arrows or emoji.

The favicon uses the same Lucide Crown geometry on a dark tile; its source version is recorded in the SVG comment. `public/lucide-license.txt` contains the upstream license notices. Printed label artwork is a separate deliverable and was not changed by this website update.

The submit button updates only its text span while saving, preserving the SVG through validation errors, failed requests and retries.
