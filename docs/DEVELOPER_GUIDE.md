# PujaPass — Developer Guide

Everything you need to pick up PujaPass and keep building. Read sections 1–4 before writing code; the rest is reference.

> **State of the project (Oct 2026):** the UI is complete for every planned page. Pandal, ticket-type, slot and review data is served from PostgreSQL via Prisma. Auth, bookings, payments, the QR scanner and all club "save" actions are still mocked in the browser. Section 12 is the ordered roadmap.

---

## Contents

1. [What PujaPass is](#1-what-pujapass-is)
2. [Status at a glance](#2-status-at-a-glance)
3. [Tech stack and framework gotchas](#3-tech-stack-and-framework-gotchas)
4. [Getting started](#4-getting-started)
5. [Project structure](#5-project-structure)
6. [Routes](#6-routes)
7. [Architecture and data flow](#7-architecture-and-data-flow)
8. [Database (Prisma 7 + PostgreSQL)](#8-database-prisma-7--postgresql)
9. [Mock data and client-side stores](#9-mock-data-and-client-side-stores)
10. [UI and styling conventions](#10-ui-and-styling-conventions)
11. [Coding conventions](#11-coding-conventions)
12. [Roadmap: what to build next](#12-roadmap-what-to-build-next)
13. [Known issues and gotchas](#13-known-issues-and-gotchas)
14. [Checks before you push](#14-checks-before-you-push)
15. [Deployment notes](#15-deployment-notes)

---

## 1. What PujaPass is

A Durga Puja companion for Kolkata with two audiences:

- **Visitors** discover pandals, see free-entry details, pick timed-entry slots from several pandals into a **Puja trail** (a cart), pay once, and receive one **QR pass** per slot.
- **Puja clubs** register (verified by the PujaPass team), manage their pandal profile, define pass types (ticket tiers) and slot capacity, watch sales, and check visitors in by scanning QR passes.

Product rules that the UI already reflects and the backend must keep:

- Free public entry is always shown; paid passes are only for club-authorised slots/benefits.
- A pass is valid only for its date and time window; one scan admits everyone on the pass (`quantity`).
- A slot must never be oversold.
- A convenience fee of ₹15 per pass is added at checkout (`CONVENIENCE_FEE_PER_PASS`).
- Max 8 passes per slot per trail line (`MAX_PASSES_PER_SLOT`).

Festival days live in the database (`FestivalDay`) and are set by platform admins at `/admin/festival`. They are seeded with the 2026 season (Shashthi 28 Sep → Dashami 2 Oct); add next season's days there.

---

## 2. Status at a glance

| Area | UI | Data source today | Next step |
| --- | --- | --- | --- |
| Home, pandal explorer, pandal detail | ✅ | **PostgreSQL** (`src/server/pandals.ts`) | — |
| Ticket tiers, slots, reviews on pandal page | ✅ | **PostgreSQL** | Live availability (§12.3) |
| Puja trail (cart) | ✅ | localStorage (snapshot per line); re-priced on the server at checkout | — |
| Checkout & payment | ✅ | **PostgreSQL** booking with atomic seat reservation; payment simulated | Razorpay + seat holds (§12.3–12.4) |
| Booking emails | ✅ | Resend via the `Notification` outbox (confirmation + cancellation) | Own sending domain; WhatsApp after Meta verification |
| My bookings, booking detail, cancel | ✅ | **PostgreSQL**, opened with signed links; "My bookings" lists bookings made on this device | Per-user list after auth (§12.1) |
| Login / register / session | ✅ | **Auth.js v5**: Google + email link, database sessions | Phone/WhatsApp OTP later |
| Club registration (4 steps) | ✅ | **PostgreSQL** (`ClubApplication`); documents keep file names only | File uploads (§12.6) |
| Platform admin (`/admin`) | ✅ | **PostgreSQL**: review applications, verify/revoke clubs, publish/feature pandals; `PLATFORM_ADMIN` only | Audit log |
| Club dashboard | ✅ | **PostgreSQL** aggregates (`src/server/club-stats.ts`): sales, revenue, per day/pass type, check-ins, occupancy | Visitor list + CSV export |
| Club pandal profile editor | ✅ | **PostgreSQL** via `updatePandalProfile` (`src/features/club/actions.ts`); real Live/Draft status | Photo uploads (§12.5) |
| Club tickets & slots | ✅ | **PostgreSQL**: pass types, entry windows (bulk add), capacity, pause, delete | Per-tier capacity limits |
| Entry scanner | ✅ | Phone camera (BarcodeDetector or jsQR) → `verifyScan`/`admitPass`, every scan logged in `CheckIn` | Offline mode |
| Festival days | ✅ | **PostgreSQL** (`FestivalDay`), edited at `/admin/festival` | — |
| Saved pandals (heart) | ✅ | localStorage | `SavedPandal` table |
| QR codes | ✅ | Real QR (`qrcode`) holding a signed link `/p/<code>.<sig>` → public pass check page | Gate check-in in the scanner (§12.5) |

---

## 3. Tech stack and framework gotchas

| Tool | Version | Notes |
| --- | --- | --- |
| Next.js | 16.4.2 (App Router, Turbopack) | **Not the Next.js in most tutorials** — see below |
| React | 19.3 + React Compiler | `reactCompiler: true`; avoid manual `useMemo`/`useCallback` unless needed |
| TypeScript | 5, `strict` | Path alias `@/*` → `src/*` |
| Tailwind CSS | v4 (CSS-first config in `globals.css`) | No `tailwind.config.js` |
| UI primitives | Base UI (`@base-ui/react`) via shadcn "base-nova" style | Only `button`, `sheet`, `field` exist in `src/components/ui` |
| Icons | `lucide-react` | |
| ORM | Prisma **7.10.1** + `@prisma/adapter-pg` | Keep CLI and client on the same version |
| Database | PostgreSQL (developed on 18) | |
| Package manager | **Bun 1.4.3** | Seed script runs with `bun` |

### Next.js 16 rules that will bite you

`AGENTS.md` applies: **read the docs bundled in `node_modules/next/dist/docs/` before using an API** — several APIs changed.

1. **Cache Components is on** (`cacheComponents: true`, `partialPrefetching: true` in `next.config.ts`).
   - Any uncached I/O (Prisma queries, `fetch`) in a server component must either be inside a `'use cache'` function or under a `<Suspense>` boundary. Otherwise `next build` fails.
   - Reading `params` / `searchParams` at the top of a page triggers the dev error *"Next.js encountered URL data during prerendering"*. Read them inside a child component wrapped in `<Suspense>` (see `src/app/(marketing)/pandals/[slug]/page.tsx`).
   - Client components calling `useSearchParams()` or `useParams()` must sit under `<Suspense>` (see `/pandals`, `/login`, `/bookings/[bookingId]`).
   - Dynamic routes should export `generateStaticParams`; without it, a `[param]` route can fail the build with a "blocking metadata" error.
   - Don't call `new Date()` / `Date.now()` / `Math.random()` while rendering; it breaks prerendering. Event handlers are fine.
2. **`next/image`:** `priority` is deprecated — use `preload` for above-the-fold images.
3. **Middleware is now `proxy.ts`** (`docs/01-app/01-getting-started/16-proxy.md`). Use it for route protection.
4. **Typed route helpers** `PageProps<"/route/[param]">` and `LayoutProps<...>` are global types; `params` is a `Promise`.
5. Caching APIs: `'use cache'`, `cacheLife(profile)`, `cacheTag(tag)`, `revalidateTag(tag)` from `next/cache`. Presets: `minutes` (revalidate 1 min), `hours` (1 h), `days`…

---

## 4. Getting started

### Prerequisites

- Bun 1.4.x (`bun --version`)
- PostgreSQL running locally (Homebrew: `brew services start postgresql@18`) or a hosted Postgres URL

### First run

```bash
bun install                      # postinstall runs `prisma generate`
cp .env.example .env             # then set DATABASE_URL
createdb puja_pass               # if using local Postgres
bun run db:migrate               # applies prisma/migrations
bun run db:seed                  # DEVELOPMENT ONLY: wipes the DB, adds festival days + the demo pandal
bun run dev                      # http://localhost:3000
```

`.env` (gitignored; Next.js and the Prisma CLI both load it):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/puja_pass?schema=public"
```

### Scripts

| Script | What it does |
| --- | --- |
| `dev` / `build` / `start` / `lint` | Next.js + ESLint |
| `db:migrate` | `prisma migrate dev` — create/apply a migration after editing the schema |
| `db:deploy` | `prisma migrate deploy` — apply migrations in production |
| `db:seed` | `prisma db seed` → `bun prisma/seed.ts` (**wipes and reloads all tables**) |
| `db:reset` | Drop, re-migrate, re-seed |
| `db:studio` | Prisma Studio GUI |
| `db:generate` | Regenerate the client into `src/generated/prisma` |

### Signing in locally

Sign-in is passwordless (§7.4): Google, or a one-time link emailed through the configured email provider. Seeded accounts use `example.com` addresses that can't receive mail, so for local testing either:

- sign in with your own email (an email provider must be configured, see §7.3), then give it a role: `bun run admin:grant you@example.com` for platform admin, or add a `ClubMember` row in Prisma Studio for club access;
- or set up Google sign-in (`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`).

Without an email provider, development only logs that an email would be sent, so email-link sign-in can't complete.

`/login?next=/checkout` returns there after sign-in.

### Demo pandal

`prisma/demo.ts` builds **PujaPass Demo Sarbojanin**, a fictional pandal with a season of bookings, check-ins and reviews (all real rows, no notifications sent). On a live database run `bun run demo:seed <owner-email>`: it also deletes the old real-name sample pandals by id, then makes that email the demo club's only owner. Re-running regenerates the demo on the current festival days. Sign in as the owner to show the dashboard and scanner.

To try the scanner without a phone, type a demo pass code (e.g. a `PUJ-…` code from the booking page) into its "type the code" box; passes for a past day ask for "Admit anyway".

---

## 5. Project structure

```text
puja_pass/
├── AGENTS.md                  # "Read Next 16 docs before coding" — applies to humans too
├── next.config.ts             # cacheComponents, partialPrefetching, reactCompiler, Tailwind loader
├── prisma.config.ts           # Prisma 7 config: schema path, migrations, seed, DATABASE_URL
├── prisma/
│   ├── schema.prisma          # Database schema (section 8)
│   ├── migrations/            # SQL migrations (commit these)
│   ├── seed.ts                # Dev reset: festival days + demo pandal
│   └── demo.ts                # The demo pandal and its season (also used by scripts/demo-seed.ts)
├── public/images/             # Pandal photos used everywhere (and a design mock-up PNG)
├── docs/DEVELOPER_GUIDE.md    # This file
└── src/
    ├── app/                   # Routes (route groups explained in section 6)
    │   ├── layout.tsx         # Root layout, fonts, site-wide metadata
    │   ├── globals.css        # Tailwind v4 theme tokens, scan animation, print rules
    │   └── not-found.tsx      # Global 404
    ├── components/
    │   ├── layout/            # Navbar (client), Footer
    │   ├── shared/            # Home sections, PageHeader, EmptyState, StatusBadge, Logo
    │   └── ui/                # Primitives: button, sheet (Base UI dialog), field (inputs)
    ├── features/              # Feature modules: components + client hooks
    │   ├── auth/              # login/register/club-register forms, use-session (mock)
    │   ├── bookings/          # bookings list/detail, cancel action, device-bookings (refs + keys)
    │   ├── checkout/          # checkout form
    │   ├── club/              # club shell (sidebar), dashboard chart, profile form, tickets, scanner
    │   ├── pandals/           # explorer, filters, cards, slot picker, use-saved-pandals
    │   └── trail/             # trail view/summary, use-trail (cart store)
    ├── server/                # SERVER-ONLY data access (Prisma)
    │   ├── pandals.ts         # Cached queries for pandals, tiers, slots, reviews
    │   └── mappers.ts         # DB rows → UI types
    ├── lib/
    │   ├── prisma.ts          # Shared PrismaClient (server-only)
    │   ├── queries.ts         # Remaining MOCK lookups used by bookings (delete later)
    │   ├── create-store.ts    # localStorage store via useSyncExternalStore + useIsClient
    │   ├── format.ts          # formatINR, formatDate, formatPujaDate, formatTime…
    │   └── utils.ts           # cn()
    ├── data/                  # Mock data (also the seed source)
    ├── types/index.ts         # UI/domain types shared across the app
    └── generated/prisma/      # Generated Prisma client (gitignored)
```

Rule of thumb: **`src/server/*` and `src/lib/prisma.ts` must never be imported by a `"use client"` file** (they import `server-only`, so the build fails if you try).

---

## 6. Routes

Route groups (folders in parentheses) only share layouts; they don't appear in URLs.

| Group | Layout | Purpose |
| --- | --- | --- |
| `(marketing)` | Overlay Navbar + Footer | Public discovery pages |
| `(visitor)` | Navbar + Footer, stone background; pages start with a dark `PageHeader` | Trail, checkout, bookings |
| `(auth)` | Split screen: photo + form, no navbar | Login and registration |
| `(club)` | `ClubShell` sidebar (dark), static; club name/role from the client session | Club area; each page checks `requireClubAccess()` |
| `(admin)` | `AdminShell` sidebar (dark), static | Platform admin area (development only until auth exists) |

| URL | File | Type | Data | Notes |
| --- | --- | --- | --- | --- |
| `/` | `(marketing)/page.tsx` → `components/shared/Home.tsx` | Server | DB (featured) | Hero search pushes `?q=&date=` to `/pandals` |
| `/pandals` | `(marketing)/pandals/page.tsx` | Server page + client explorer | DB (`getPandals`) | Filters run client-side over the full list |
| `/pandals/[slug]` | `(marketing)/pandals/[slug]/page.tsx` | Server, `generateStaticParams` | DB | Booking panel = client `SlotPicker` |
| `/trail` | `(visitor)/trail/page.tsx` | Server + client | localStorage; DB for suggestions | Same-time clash warning |
| `/checkout` | `(visitor)/checkout/page.tsx` | Client form | localStorage | Simulated payment, then `/bookings/{id}?new=1` |
| `/my-bookings` | `(visitor)/my-bookings/page.tsx` | Client | Mock + localStorage | Upcoming / Past / Cancelled tabs |
| `/bookings/[bookingId]` | `(visitor)/bookings/[bookingId]/page.tsx` | Static shell + client | Mock + localStorage | Reads id via `useParams` inside Suspense |
| `/login`, `/register` | `(auth)/…` | Static + client form | Auth.js | Same form; `?next=` return path, `?error=` messages |
| `/login/check-email` | `(auth)/login/check-email/page.tsx` | Static | — | Shown after an email link is sent |
| `/clubs/register` | `(auth)/clubs/register/page.tsx` | Client | Not persisted | 4-step wizard |
| `/club/dashboard` | `(club)/club/dashboard/page.tsx` | Server | DB (slots, tiers) + mock KPIs | Chart: `features/club/components/sales-chart.tsx` |
| `/club/pandals` | `(club)/club/pandals/page.tsx` | Server + client form | DB read | Save is local only |
| `/club/tickets` | `(club)/club/tickets/page.tsx` | Server + client | DB read | Edits are local only |
| `/club/scanner` | `(club)/club/scanner/page.tsx` | Streamed + client camera | DB | `verifyScan` / `admitPass` in `src/features/club/scan-actions.ts`; needs HTTPS for the camera |
| `/admin` | `(admin)/admin/page.tsx` | Static shell + streamed | DB (uncached) | Overview: queue, unverified clubs, drafts ready to publish |
| `/admin/applications` | `(admin)/admin/applications/page.tsx` | Static shell + streamed | DB | `?status=pending\|approved\|rejected` tabs, oldest pending first |
| `/admin/applications/[id]` | `(admin)/admin/applications/[id]/page.tsx` | Static shell + streamed | DB | Approve / reject panel |
| `/admin/clubs`, `/admin/pandals` | `(admin)/admin/…` | Static shell + streamed | DB | Revoke/restore verification; publish/feature |
| `/admin/festival` | `(admin)/admin/festival/page.tsx` | Static shell + streamed | DB | Add/rename/remove festival days (removal refused while valid passes exist) |

---

## 7. Architecture and data flow

### 7.1 Server reads (DB → page)

```text
page.tsx (server component)
  └─ await getPandalBySlug(slug)          src/server/pandals.ts  ('use cache' + cacheLife + cacheTag)
        └─ prisma.pandal.findUnique(...)  src/lib/prisma.ts      (PrismaClient + PrismaPg adapter)
        └─ toPandal(row)                  src/server/mappers.ts  (DB row → UI `Pandal`)
  └─ <ClientComponent pandal={...} />     receives plain serialisable props
```

- **UI types (`src/types`) are the contract.** Components never import Prisma types. When you add a column, update the schema, the mapper and the UI type together.
- **Caching:** pandal-level data uses `cacheLife("hours")`; slots use `cacheLife("minutes")`. Tags live in `pandalTags`:

  ```ts
  pandalTags.list            // "pandals"
  pandalTags.pandal(slug)    // "pandal:<slug>"
  pandalTags.tiers(id)       // "pandal-tiers:<pandalId>"
  pandalTags.slots(id)       // "pandal-slots:<pandalId>"
  pandalTags.reviews(id)     // "pandal-reviews:<pandalId>"
  ```

  After any write, call `revalidateTag(...)` for the affected tags (§12.5).
- **Enum mapping:** DB enums are UPPER_CASE (`PAID`, `VERY_HIGH`, `CONFIRMED`); UI types use display strings or lower case (`"Paid Entry"`, `"Very High"`, `"confirmed"`). Mapping lives in `mappers.ts` (and in `prisma/seed.ts` for the reverse direction).
- **Dates:** `Slot.date` is `@db.Date` and comes back as UTC midnight; `mappers.ts` turns it into `"YYYY-MM-DD"`. Slot times are `"HH:mm"` strings in IST.

### 7.2 Client state (browser only, for now)

All client stores use `createPersistentStore(key, initial)` in `src/lib/create-store.ts`. It is built on `useSyncExternalStore`, so the server and first client render use `initial` (no hydration mismatch), then switch to the localStorage value. Stores also sync across tabs.

| Store | Key | Hook / actions |
| --- | --- | --- |
| Trail (cart) | `pujapass:trail:v2` | `useTrail()`, `addToTrail`, `updateTrailQuantity`, `removeFromTrail`, `clearTrail` |
| Created/cancelled bookings | `pujapass:bookings` | `useBookings()`, `useBooking(id)`, `createBooking`, `cancelBooking` |
| Saved pandals | `pujapass:saved-pandals` | `useSavedPandals()` |

Notes:

- **Trail lines are snapshots** (pandal name/slug/image, tier name, unit price, slot date/times) taken when added in `SlotPicker`. The trail never fetches. **The server must re-price and re-check capacity at checkout** — never trust these values.
- `useBookings()` merges the locally created bookings with the seed bookings; a cancelled seed booking is stored locally as an override.
- `useIsClient()` returns `false` during SSR/hydration. The booking detail page uses it to show a skeleton instead of a "not found" flash.
- If you change a store's shape, bump its key (as done with `trail:v2`) so old browser data is ignored.

### 7.3 Important flows

#### Add to trail → checkout → pass

1. `/pandals/[slug]` → `SlotPicker`: pass type → day → slot → visitors → `addToTrail(snapshot)`.
2. `/trail` shows lines grouped by day; `TrailSummary` computes subtotal + fees.
3. `/checkout` → `placeBooking()` (`src/features/checkout/actions.ts`):
   - re-prices from the DB and refuses if the total differs from what the visitor saw;
   - in one transaction, reserves seats with a conditional `UPDATE "Slot"` (never oversells) and creates the `Booking` (CONFIRMED, demo `Payment`), its `Pass`es and a `Notification`;
   - after the response, `deliverSoon()` emails the passes.
4. The browser remembers `{ reference, key }` (`device-bookings.ts`) and opens `/bookings/{ref}?k=<manage key>&new=1`.
5. `/bookings/[id]` checks the key on the server (`getBookingWithKey`) and renders real QR codes, print, share and (manage key only) cancel.

#### Booking links and QR codes (`src/server/booking-links.ts`)

- Every booking has two keys, both HMACs of the reference with `BOOKING_SECRET`:
  - **manage**: only in the confirmation email and this browser; can cancel;
  - **view**: what "Share on WhatsApp" / "Copy link" send; read-only.
- QR codes hold a signed link, `<site>/p/<pass code>.<hex signature>` (`passQrUrl` / `verifyPassToken`):
  - any phone camera opens `/p/[token]`, a public page that says whether the pass is genuine and Valid / Already used / Cancelled, without personal details;
  - the gate scanner should read the same link, verify it with `verifyPassToken`, then check in atomically.
  - The signature is hex and codes are upper case, so links still verify if a scanner app changes the letter case.
  - In development the link points at `localhost`, so a phone can't open it; set `NEXT_PUBLIC_SITE_URL` to your computer's network address to test with a phone.
- Rotating `BOOKING_SECRET` invalidates every link and QR code already sent.

#### Notifications outbox (`src/server/notifications`)

- Write a `Notification` row in the same transaction as the change (`bookingNotification()`), then call `deliverSoon(ids)`, which sends after the response via `after()`.
- `deliverNotification()` claims a row (PENDING → SENDING) so it is never sent twice; failures back off 2/4/8/16 min and become FAILED after 5 attempts. Resend also gets the notification id as an idempotency key.
- `GET /api/cron/notifications` with `Authorization: Bearer $CRON_SECRET` retries due rows and recovers rows stuck in SENDING. **Schedule it** (e.g. Vercel Cron every 5 minutes) when deploying.
- Email: `sendEmail()` in `email.ts` picks a provider from `.env`:
  - **SMTP** (`SMTP_USER` + `SMTP_PASS`, default host `smtp.gmail.com:465`), used today with a Gmail App password: free, ~500 recipients/day, sent from that Gmail address (`EMAIL_FROM` must be it). Over the limit, Gmail refuses sends; the outbox retries, then marks them FAILED.
  - **Resend** (`RESEND_API_KEY`): switch to it once a domain is verified. Resend can't send from `gmail.com` or any unverified domain.
  - Neither, in development: emails are only logged. `EMAIL_REDIRECT_TO` (testing) sends everything to one inbox.
  - Templates are React Email components in `emails.tsx`; QR codes are inline attachments (`cid:`).
- WhatsApp is not sent yet: Meta restricted the WhatsApp Business Account until **business verification**. Visitors share the view link with the WhatsApp share button instead.

**Club area:** each page calls `requireClubAccess(roles)` and loads the member's own pandal with `getClubPandal()` (drafts included). The dashboard reads `getClubDashboard(pandalId, day)`: counted are valid/used passes in confirmed/completed bookings; revenue is quantity × pass price (no convenience fee); the day defaults to today in India, else the next festival day, else the last.

#### Gate check-in

1. The scanner decodes the QR (a `/p/<code>.<sig>` link) or takes a typed code.
2. `verifyScan` checks the signature, that the pass is for this pandal and its booking is paid and not cancelled; used passes come back as duplicates. Invalid and duplicate scans are logged.
3. The result shows the pass's timing: on time (from 15 minutes before the window to its end), early, late or another day. Outside the window staff must tap "Admit anyway".
4. `admitPass` flips the pass VALID → USED in one conditional update (so two phones can't admit it twice) and logs ADMITTED with the scanner's user id.

### 7.4 Authentication and access

Auth.js v5 (`next-auth@5.0.0-beta`) in `src/auth.ts`:

- **Sign-in:** passwordless. "Continue with Google" (only when `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set) or a one-time email link sent by `sendSignInEmail()` through our email provider. Signing in creates the account; `/register` is the same form.
- **Sessions:** stored in the `Session` table (database strategy), 30 days, revocable. Our own adapter (`src/server/auth/adapter.ts`) talks to the Prisma 7 client; the official adapter only supports Prisma ≤ 6.
- **Session contents** (`callbacks.session`): `id`, `isPlatformAdmin` (from `User.role`), and `club` (the first `ClubMember` membership: club, role, first pandal).
- **Guest bookings** with the same email are attached to the account on every sign-in (`events.signIn`); emails are verified by both providers.
- **Google + email link with the same address** share one account (`allowDangerousEmailAccountLinking`, safe because Google verifies emails).

Access is checked in two layers:

1. `src/proxy.ts`: no session cookie on `/admin/*` or `/club/*` → redirect to `/login?next=…`. It never reads the database.
2. `src/server/auth/session.ts` (the real checks, called by pages inside `<Suspense>` and by every Server Action):
   - `getCurrentUser()`; `requireUser(returnTo)`;
   - `requirePlatformAdmin()`: anyone else gets a 404;
   - `requireClubAccess(roles, returnTo)`: OWNER/ADMIN for dashboard, profile, tickets; plus SCANNER for `/club/scanner`. Returns a reason instead of throwing so pages can explain (`ClubAccessNotice`).

| Area | Access |
| --- | --- |
| Pandals, trail, checkout, pass check, booking link with key | Public (guest checkout); signed-in users get bookings attached and prefilled forms |
| `/bookings/[ref]` without a key | The booking's owner (signed in) |
| `/my-bookings` | Public: this device's bookings, plus the account's when signed in |
| `/clubs/register` (submitting) | Signed in; the applicant becomes OWNER on approval |
| `/club/*` | Club members by role |
| `/admin/*` and admin actions | `PLATFORM_ADMIN` (`bun run admin:grant <email>`) |

The UI reads the session in the browser (`useCurrentUser()` in `src/features/auth/use-session.ts`, via `SessionProvider` in the root layout), so public pages stay static. Never rely on it for access.

---

## 8. Database (Prisma 7 + PostgreSQL)

### 8.1 Setup facts

- Generator `prisma-client` writes to **`src/generated/prisma`** (gitignored; regenerated on `bun install`). Import from `@/generated/prisma/client` and `@/generated/prisma/enums`.
- Prisma 7 requires a **driver adapter**: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`.
- The connection URL lives in **`prisma.config.ts`** (`datasource.url`), not in `schema.prisma`.
- `src/lib/prisma.ts` exports a singleton cached on `globalThis` in development (prevents pool exhaustion on hot reload).
- Stay on Prisma **7.x** for the CLI, `@prisma/client` and `@prisma/adapter-pg` together. A Prisma 8 RC was installed earlier and broke the config (`definePrismaConfig`/`skills` are v8-only); it was rolled back.
- Bun blocks the `@prisma/engines` postinstall by default; migrations still work. If a Prisma command complains about a missing engine, run `bun pm trust @prisma/engines`.

### 8.2 Schema overview (`prisma/schema.prisma`)

Conventions: ids are `cuid()`; **money is whole rupees (`Int`)**; slot dates are `@db.Date` with `"HH:mm"` IST times; arrays use Postgres `String[]`.

| Model | Purpose | Key fields / relations |
| --- | --- | --- |
| `User` | Visitor, club staff or platform admin | `email`/`phone` unique, `role` (`VISITOR`, `CLUB_ADMIN`, `PLATFORM_ADMIN`), `passwordHash?` |
| `Club` | A verified Puja club | `registrationNumber` unique, `verified`, has many `Pandal` |
| `ClubMember` | User ↔ club with role | PK `(userId, clubId)`, role `OWNER`/`ADMIN`/`SCANNER` |
| `ClubApplication` | Submission from `/clubs/register` | `status` `PENDING`/`APPROVED`/`REJECTED`, document URLs, optional `clubId` after approval |
| `Pandal` | Public listing | `slug` unique, `area`/`category` as text, `entryType` `FREE`/`PAID`, `tags`/`amenities` arrays, theme fields, `mapX/mapY` (placeholder), `latitude/longitude`, denormalised `ratingAverage`/`reviewCount`, `published` |
| `PandalImage` | Gallery | `position` (0 = first; the cover is `Pandal.coverImageUrl`) |
| `TicketTier` | Pass type ("Timed Entry", "Priority Darshan"…) | `price` (₹), `perks[]`, `capacityPerSlot`, `active`, `position` |
| `Slot` | One entry window | unique `(pandalId, date, startTime)`, `capacity`, `booked`, `salesPaused` |
| `Booking` | One checkout | `reference` unique (e.g. `PP26-4K7Q2M`), `status` `PENDING`/`CONFIRMED`/`COMPLETED`/`CANCELLED`/`EXPIRED`, contact fields, `subtotal`/`fees`/`total`, `expiresAt` (seat-hold expiry) |
| `Pass` | One QR pass per (slot, tier) in a booking | `code` unique, `quantity`, `unitPrice`, `status` `VALID`/`USED`/`CANCELLED`, `checkedInAt` |
| `Payment` | Gateway record | `providerOrderId` unique, `providerPaymentId` unique, `status` `CREATED`/`PAID`/`FAILED`/`REFUNDED` |
| `CheckIn` | Every scan, incl. rejected | `result` `ADMITTED`/`DUPLICATE`/`INVALID`, `pandalId`, optional `passId`, `scannedById` |
| `Review` | Visitor review | `rating`, `comment`, optional `userId` |
| `SavedPandal` | Hearted pandals | PK `(userId, pandalId)` |

Delete behaviour: a pandal's images/tiers/slots/reviews cascade; a `Slot` or `TicketTier` that has passes **cannot be deleted** (`Restrict`) — deactivate (`active = false` / `salesPaused = true`) instead.

### 8.3 Migrations workflow

```bash
# edit prisma/schema.prisma, then:
bun run db:migrate --name describe_change      # creates + applies SQL, regenerates client
# update src/server/mappers.ts and src/types/index.ts if shapes changed
```

Commit everything in `prisma/migrations/`. Never edit an applied migration; add a new one.

### 8.4 Seed and demo data

- `bun run db:seed` (`prisma/seed.ts`) is for **development databases only**: it deletes every row, adds the 2026 festival days and builds the demo pandal (owner `DEMO_OWNER_EMAIL`, default `demo-owner@pujapass.example`).
- `bun run demo:seed <email>` (`scripts/demo-seed.ts`) is safe for the live database: it never touches other clubs. See §4 "Demo pandal".
- Both use `DIRECT_URL` when set, since the pooled Supabase URL can time out transactions.
- Make yourself an admin with `bun run admin:grant <email>`.

---

## 9. Configuration and client-side stores

All content comes from the database. `src/data/` only holds settings:

| File | Contents |
| --- | --- |
| `festival.ts` | Standard hourly entry windows (defaults in "Add entry windows"), convenience fee, max passes per slot |
| `areas.ts` | Areas offered in the club registration and profile forms (the explorer's area filter is built from listed pandals) |

Browser-only state (§7.2): the trail (cart), bookings remembered on this device, saved pandals.

---

## 10. UI and styling conventions

- **Palette:** Tailwind `stone` neutrals + `orange` accent (`orange-600` primary actions, `orange-50/100` tints). Success `emerald`, warning `amber`, error `rose`. Dark sections use `bg-stone-950`.
- **Typography:** body uses Geist (`--font-sans` → `--font-geist-sans` in `globals.css`). Headings use `font-serif` (currently the system serif). Eyebrow labels: `text-sm font-bold tracking-[0.16em] text-orange-600` in caps.
- **Shapes:** cards `rounded-2xl border border-stone-200 bg-white`, buttons and chips `rounded-full`.
- **Page patterns:**
  - Visitor pages start with `<PageHeader eyebrow title description>` (dark band that sits under the transparent navbar).
  - Club pages use `<ClubPageHeader title description actions>`.
  - Empty lists use `<EmptyState icon title description action>`.
  - Status pills use `<StatusBadge status>`.
- **Forms:** use `Field`, `Input`, `Textarea`, `Select`, `Checkbox` from `src/components/ui/field.tsx`.
- **Overlays:** `Sheet` (Base UI Dialog) for side panels; the Navbar account menu uses Base UI `Menu` directly. Base UI composes with a `render` prop, not `asChild`: `<SheetClose render={<Link href="/x" />}>Text</SheetClose>`.
- **Charts** (`sales-chart.tsx`): single hue, recessive gridlines, hover tooltip per bar, plus a screen-reader `<table>`. Status colours are only for state, and always come with an icon and a label.
- **Images:** all from `public/images`. Above-the-fold heroes use `preload`.
- **Accessibility:** icons get `aria-hidden`, icon-only buttons get `aria-label`, toggles use `aria-pressed`/`role="switch"`, live results use `aria-live`.
- **Responsive:** test at 390px. Headless Chrome screenshots have a ~500px minimum width, so narrower screenshots look clipped even when the page is fine.

---

## 11. Coding conventions

- **Server by default.** Add `"use client"` only for state, effects, event handlers or browser APIs. Fetch on the server and pass plain props down.
- **Data access goes through `src/server/*`.** Add new query files there (e.g. `src/server/bookings.ts`), each with `import "server-only"`, a `'use cache'` + `cacheLife` + `cacheTag` for public data, and a mapper to UI types.
- **Writes** should be Server Actions (`"use server"`) placed next to the feature (e.g. `src/features/club/actions.ts`). Validate input (add `zod`), check authorisation, write with Prisma, then `revalidateTag`.
- **Per-user data** (session, bookings) must not go inside `'use cache'` unless the user id is an argument. Read cookies outside cached scopes and keep personalised UI under `<Suspense>`.
- **Formatting helpers** live in `src/lib/format.ts`. Don't hand-format rupees or dates. `formatDate` parses `YYYY-MM-DD` manually to avoid timezone shifts.
- **Naming:** files are mixed — older `components/shared/*` are PascalCase (`HeroSection.tsx`, `Redirection_Card.tsx`), newer `features/**` are kebab-case. Use **kebab-case for new files**.
- **`cn`:** import from `@/lib/utils` (`button.tsx`/`sheet.tsx` import `cn` directly; harmless but inconsistent).
- Some older components are written as single very long JSX lines (`pandal-collection.tsx`, `pandal-benefits.tsx`, parts of `pandal-explorer.tsx`). Adding Prettier + `prettier-plugin-tailwindcss` is recommended.
- **Lint ignores** `src/generated/**` (see `eslint.config.mjs`).

---

## 12. Roadmap: what to build next

In dependency order. Each item lists the files to touch.

### 12.1 Authentication

Done (see §7.4). Still to do:

- Phone sign-in (WhatsApp authentication templates avoid SMS DLT registration) once Meta verification passes.
- An account page: set your name and phone number; list and sign out of other sessions.
- Club members of several clubs: a club switcher (`requireClubAccess` uses the first membership).
- Team management for club owners: invite ADMIN/SCANNER members.

### 12.2 Bookings on the database

Done (see §7.3): bookings, passes and cancellation are in the DB; links are signed; emails go through the outbox.

Still to do:

- After auth: `getBookingsForUser(userId)` for "My bookings", set `Booking.userId` at checkout, and attach guest bookings when a visitor signs up with the same verified email.
- Refuse slots that have already started (the check is a TODO in `placeBooking` because the seeded festival dates are in the past).
- A "resend my passes" action, and an admin view of failed notifications.

### 12.3 Checkout with seat holds (the critical piece)

`placeBooking` already re-prices and reserves seats atomically (steps 1–2 below). What's left is the payment step: create the booking as `PENDING` instead of `CONFIRMED`, and confirm it (and only then queue the email) from the Razorpay webhook.

1. Re-load each tier and slot from the DB; ignore client prices. Reject inactive tiers and paused, sold-out or past slots.
2. In **one transaction**, reserve seats atomically per slot:

   ```sql
   UPDATE "Slot" SET booked = booked + $qty
   WHERE id = $slotId AND "salesPaused" = false AND booked + $qty <= capacity
   RETURNING id;   -- 0 rows → sold out → roll back
   ```

   (`prisma.$executeRaw` or `updateMany` with a `where` on `booked` via raw SQL, since Prisma can't compare two columns.)
3. Create a `Booking` (`PENDING`, `expiresAt = now + 10 min`) with its `Pass`es, plus a `Payment` (`CREATED`) holding the gateway order id.
4. Return the gateway order to the client.
5. A cron or scheduled job expires `PENDING` bookings past `expiresAt`: set them to `EXPIRED`, return the seats (`booked = booked - qty`), and revalidate the slot tags.
6. `revalidateTag(pandalTags.slots(pandalId))` after each change in availability.

Also enforce per-tier capacity if you need it (today capacity is per slot = sum of active tiers' `capacityPerSlot`).

### 12.4 Payments (Razorpay suggested)

- Create the order server-side; open Razorpay Checkout in `checkout-form.tsx` (replace the simulated `setTimeout`).
- Confirm **only** via a webhook route handler (`src/app/api/webhooks/razorpay/route.ts`):
  - verify the signature
  - make it idempotent on `providerPaymentId`
  - set `Payment` to `PAID`, `Booking` to `CONFIRMED`, and send the passes
- Refunds on cancellation set `Payment` to `REFUNDED`.

### 12.5 Club tools on real data

- **Profile editor**: done. `updatePandalProfile` checks the member's club owns the pandal, validates, saves, and refreshes the public page (`updateTag`). Rules: the club name is read-only (it's what PujaPass verified); a **live** pandal can't be saved with required fields empty (`getProfileGaps`); the slug never changes. Drafts go live when a platform admin publishes them from `/admin/pandals` (they appear under "Ready to publish" once complete). Still to do: photo uploads (Supabase Storage/S3) feeding `PandalImage`; removing and reordering existing photos already saves.
- **Tickets & slots**: done (`src/features/club/actions.ts`, read with `getClubTiers`/`getClubSlots`, which show real paused/booked state). `saveTicketTier`, `setTierActive`, `addSlots` (chosen festival days × standard or custom windows; existing windows are skipped), `updateSlot` (capacity can't drop below `booked`, checked atomically; pause/resume), `deleteSlot` (only without bookings). Each action checks the member's club runs the pandal and refreshes the public cache tags. Slot capacity is shared by all pass types; `capacityPerSlot` only sets the default for new windows.
- **Dashboard, QR codes and scanner:** done (§7.3 "Gate check-in"). Still to do: offline scanning for weak networks near pandals (verify signatures on the phone and sync check-ins later).
- **New screens:** bookings/visitor list with search + CSV export, payouts/settlements, staff accounts (`ClubMember` role `SCANNER`).

### 12.6 Club onboarding and platform admin

Done:

- `club-register-form.tsx` saves a `ClubApplication` (`src/features/auth/actions.ts`). It refuses a registration number that belongs to a club or to another pending application.
- Admin area `(admin)/admin/*`. Reads are in `src/server/admin.ts` and writes in `src/features/admin/actions.ts`. Every action calls `requirePlatformAdmin()`. Rules:
  - **Approve**: needs both documents, or an explicit "verified another way" tick (recorded in the notes). Refused if a club already has the registration number. Creates a verified `Club`, an OWNER `ClubMember` (if the applicant had an account; the user becomes `CLUB_ADMIN`) and an **unpublished** draft `Pandal`.
  - **Reject**: needs a reason of 10+ characters.
  - **Revoke** club verification: needs a reason; unpublishes and unfeatures all its pandals. **Restore** does not republish them.
  - **Publish**: only if the club is verified and the profile has no gaps (`getProfileGaps`). **Feature**: only live pandals.
- **Public visibility rule**: a pandal is public only when `published` **and** its club is `verified` (`publicPandalWhere` in `src/server/pandals.ts`). The VERIFIED badge reads `Pandal.clubVerified`.

Still to do:

- Store uploaded documents (S3/R2/Supabase Storage); the form keeps only file names today.
- Email the club on approval/rejection; an audit log of admin actions; refunds and disputes.

### 12.7 Other gaps

- **Notifications:** WhatsApp delivery once Meta business verification passes (add a `WHATSAPP` branch in `send()`); a reminder before each slot.
- **Reviews:** let visitors review after a `USED` pass; recompute `ratingAverage`/`reviewCount`.
- **Saved pandals:** persist to `SavedPandal` for signed-in users.
- **Real map:**
  - store `latitude`/`longitude` and use Leaflet or Google Maps
  - replace the `mapX/mapY` placeholder and the derived `distanceKm` in `mappers.ts`
  - "Near Me" should use browser geolocation
- **Loading and error states:** `loading.tsx` / `error.tsx` per route group; a toast system (e.g. Sonner) instead of inline success messages.
- **SEO:** `sitemap.ts`, `robots.ts`, per-pandal Open Graph images, schema.org `Event`/`Place`.
- **Product ideas:** Bengali localisation (`next-intl`); PWA with offline passes; waitlist for sold-out slots; live crowd level from check-ins; suggested walking route for a trail.
- **Tests:** Vitest for `format.ts`, trail maths and mappers; Playwright for explore → trail → checkout → booking and for the scanner.

---

## 13. Known issues and gotchas

| Issue | Where | Notes |
| --- | --- | --- |
| Unknown pandal slug returns HTTP **200** with the 404 page | `/pandals/[slug]` | `notFound()` is called after streaming starts (inside Suspense); the page is marked `noindex`. Fine for SEO; change only if a strict 404 status is needed. |
| `next build` needs database access | DB-backed pages | `generateStaticParams` and cached queries run at build time. CI/deploy needs `DATABASE_URL`. |
| Explorer date filter doesn't filter | `pandal-explorer.tsx` | Only changes the subtitle. Should hide pandals with no availability that day. |
| "Kolkata" dropdown in explorer hero does nothing | `pandal-explorer-hero.tsx` | Wire it to the area filter or remove it. |
| "Theme / Style" and "Facilities" filter groups from the design aren't built | `filter-sidebar.tsx` | Data exists (`category`, `amenities`). |
| "Near Me" uses a fake distance | `server/mappers.ts` | Derived from the stylised map position. |
| Emails are sent from a personal Gmail account | `.env` (`SMTP_*`) | Free stopgap capped at ~500/day. Buy a domain, verify it in Resend, then remove `SMTP_USER`/`SMTP_PASS` and set `EMAIL_FROM` to the domain. |
| Booking reference can't be looked up by email | `/my-bookings` | "My bookings" lists bookings made in this browser; other devices need the emailed link until auth exists. |
| Slot picker always starts on Shashthi | `slot-picker.tsx` | Should default to today (or the next festival day) once real dates matter; compute it outside render. |
| Festival days are last season's | `/admin/festival` | 28 Sep – 2 Oct 2026. Add 2027's days in the admin area, then re-run `bun run demo:seed <email>` to move the demo onto them. |
| The scanner camera needs HTTPS | `entry-scanner.tsx` | Browsers only allow the camera on HTTPS or `localhost`; on a phone, test against the deployed site. |
| Old trail data is dropped | `use-trail.ts` | Key bumped to `pujapass:trail:v2` when lines became snapshots. |
| Headings use the system serif | `globals.css` | The mock-up suggests a display serif (e.g. Fraunces/Playfair via `next/font`). |
| `.dark` theme tokens exist but nothing uses them | `globals.css` | Implement dark mode or remove them. |
| No captcha on sign-in or checkout | `src/server/rate-limit.ts` | Rate limits cap abuse (sign-in emails 3/15 min per address, 20/hour per IP; bookings 5/hour per email, 20/hour per IP). Add a captcha (e.g. Cloudflare Turnstile) if abuse appears. |

---

## 14. Checks before you push

```bash
bunx tsc --noEmit        # types
bun run lint             # ESLint (ignores src/generated)
bun run build            # also validates Cache Components rules; needs the DB
```

In `bun run dev`, watch the **browser console**: Next 16 reports instant-navigation problems (params/searchParams outside Suspense, uncached data) there, not in the terminal.

After a schema change: `bun run db:migrate`, then update `mappers.ts` and `types/index.ts`, then build.

---

## 15. Deployment notes

- Environment variables: see `.env.example` (`DATABASE_URL`, `DIRECT_URL`, `BOOKING_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, …). Keep it up to date; it's the only env file committed.
- Schedule `GET /api/cron/notifications` (every ~5 minutes) so failed emails are retried.
- Release order: `bun install` (runs `prisma generate`) → `bun run db:deploy` → `bun run build` → `bun run start`.
- Use a pooled connection string for serverless hosts (e.g. Neon/Supabase pooler, Prisma Postgres) to avoid exhausting connections.
- `'use cache'` uses an in-memory cache by default. On serverless, entries don't persist between instances. Consider `'use cache: remote'` with a platform cache handler if the DB load matters.
- Cached pages revalidate on their `cacheLife`. Writes must call `revalidateTag` so edits show up immediately.
