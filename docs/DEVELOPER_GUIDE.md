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

Festival days are configured in `src/data/festival.ts` (currently Shashthi 28 Sep → Dashami 2 Oct 2026, taken from the design mock-up — **confirm these dates**).

---

## 2. Status at a glance

| Area | UI | Data source today | Next step |
| --- | --- | --- | --- |
| Home, pandal explorer, pandal detail | ✅ | **PostgreSQL** (`src/server/pandals.ts`) | — |
| Ticket tiers, slots, reviews on pandal page | ✅ | **PostgreSQL** | Live availability (§12.3) |
| Puja trail (cart) | ✅ | localStorage (snapshot per line) | Server-side re-validation at checkout |
| Checkout & payment | ✅ | Simulated; writes to localStorage | Real bookings + Razorpay (§12.3–12.4) |
| My bookings, booking detail, cancel | ✅ | Seed mock + localStorage | DB-backed, per user (§12.3) |
| Login / register / session | ✅ | Mock session in localStorage | Real auth (§12.1) |
| Club registration (4 steps) | ✅ | Not persisted | `ClubApplication` + admin review (§12.6) |
| Club dashboard | ✅ | Slots/tiers from DB; KPIs, chart, check-ins are mock | Aggregate from DB (§12.5) |
| Club pandal profile editor | ✅ | Reads DB; saves only to React state | Server Action + `revalidateTag` (§12.5) |
| Club tickets & slots | ✅ | Reads DB; edits only in React state | Server Actions (§12.5) |
| Entry scanner | ✅ | Fully mock (`src/data/club.ts`) | Camera decoding + check-in API (§12.5) |
| Saved pandals (heart) | ✅ | localStorage | `SavedPandal` table |
| QR codes | ✅ | Placeholder graphic (not scannable) | Real QR with signed token (§12.5) |

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
bun run db:seed                  # loads the mock data into the DB
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

### Demo accounts (mock login)

The login form is pre-filled; any password works.

| Role | Email | Lands on |
| --- | --- | --- |
| Visitor | `riya@example.com` | `/my-bookings` |
| Club admin (Sreebhumi Sporting Club) | `admin@sreebhumi.example.com` | `/club/dashboard` |

`/login?role=club` opens the club tab. `/login?next=/checkout` redirects back after login. The club area is browsable without logging in (falls back to the demo admin).

### Scanner demo codes

On `/club/scanner` use the "simulate a scan" chips, or type:
`SRB-2930-8841` (valid), `SRB-2930-0942` (already used), anything else (invalid).

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
│   └── seed.ts                # Loads src/data/* into the DB
├── public/images/             # Pandal photos used everywhere (and a design mock-up PNG)
├── docs/DEVELOPER_GUIDE.md    # This file
└── src/
    ├── app/                   # Routes (route groups explained in section 6)
    │   ├── layout.tsx         # Root layout, fonts, site-wide metadata
    │   ├── globals.css        # Tailwind v4 theme tokens, scan animation, print rules
    │   └── not-found.tsx      # Global 404
    ├── components/
    │   ├── layout/            # Navbar (client), Footer
    │   ├── shared/            # Home sections, PageHeader, EmptyState, StatusBadge, Logo, FakeQr
    │   └── ui/                # Primitives: button, sheet (Base UI dialog), field (inputs)
    ├── features/              # Feature modules: components + client hooks
    │   ├── auth/              # login/register/club-register forms, use-session (mock)
    │   ├── bookings/          # bookings list/detail, use-bookings (mock store)
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
| `(club)` | `ClubShell` sidebar (dark), fetches the managed pandal server-side | Club admin area |

| URL | File | Type | Data | Notes |
| --- | --- | --- | --- | --- |
| `/` | `(marketing)/page.tsx` → `components/shared/Home.tsx` | Server | DB (featured) | Hero search pushes `?q=&date=` to `/pandals` |
| `/pandals` | `(marketing)/pandals/page.tsx` | Server page + client explorer | DB (`getPandals`) | Filters run client-side over the full list |
| `/pandals/[slug]` | `(marketing)/pandals/[slug]/page.tsx` | Server, `generateStaticParams` | DB | Booking panel = client `SlotPicker` |
| `/trail` | `(visitor)/trail/page.tsx` | Server + client | localStorage; DB for suggestions | Same-time clash warning |
| `/checkout` | `(visitor)/checkout/page.tsx` | Client form | localStorage | Simulated payment, then `/bookings/{id}?new=1` |
| `/my-bookings` | `(visitor)/my-bookings/page.tsx` | Client | Mock + localStorage | Upcoming / Past / Cancelled tabs |
| `/bookings/[bookingId]` | `(visitor)/bookings/[bookingId]/page.tsx` | Static shell + client | Mock + localStorage | Reads id via `useParams` inside Suspense |
| `/login`, `/register` | `(auth)/…` | Client | Mock session | |
| `/clubs/register` | `(auth)/clubs/register/page.tsx` | Client | Not persisted | 4-step wizard |
| `/club/dashboard` | `(club)/club/dashboard/page.tsx` | Server | DB (slots, tiers) + mock KPIs | Chart: `features/club/components/sales-chart.tsx` |
| `/club/pandals` | `(club)/club/pandals/page.tsx` | Server + client form | DB read | Save is local only |
| `/club/tickets` | `(club)/club/tickets/page.tsx` | Server + client | DB read | Edits are local only |
| `/club/scanner` | `(club)/club/scanner/page.tsx` | Client | Mock | Camera view is a placeholder |

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
| Mock session | `pujapass:session` | `useSession()`, `signIn(role)`, `signOut()` |
| Saved pandals | `pujapass:saved-pandals` | `useSavedPandals()` |

Notes:

- **Trail lines are snapshots** (pandal name/slug/image, tier name, unit price, slot date/times) taken when added in `SlotPicker`. The trail never fetches. **The server must re-price and re-check capacity at checkout** — never trust these values.
- `useBookings()` merges the locally created bookings with the seed bookings; a cancelled seed booking is stored locally as an override.
- `useIsClient()` returns `false` during SSR/hydration. The booking detail page uses it to show a skeleton instead of a "not found" flash.
- If you change a store's shape, bump its key (as done with `trail:v2`) so old browser data is ignored.

### 7.3 Important flows

#### Add to trail → checkout → pass (current, mocked)

1. `/pandals/[slug]` → `SlotPicker`: pass type → day → slot → visitors → `addToTrail(snapshot)`.
2. `/trail` shows lines grouped by day; `TrailSummary` computes subtotal + fees.
3. `/checkout` → `createBooking()` (local, random `PP26-XXXXXX` reference and pass codes) → `clearTrail()` → `/bookings/{id}?new=1`.
4. `/bookings/[id]` renders each pass with `FakeQr`, print, and cancel.

**Club area:** `(club)/layout.tsx` loads the managed pandal (`CLUB_PANDAL_ID` in `src/data/club.ts`) and passes `{ name, clubName, slug }` into `ClubShell`. Pages fetch tiers and slots by the pandal's DB id.

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

### 8.4 Seed (`prisma/seed.ts`)

- Reads `src/data/*`, **deletes all rows**, then inserts: 2 users, 12 clubs (one per pandal), 12 pandals (+ images), 16 tiers, 360 slots, 36 reviews, 4 bookings with 6 passes and payments.
- **Seeded pandal, tier and slot ids equal the mock ids** (e.g. pandal id = slug = `sreebhumi-sporting-club`). The remaining mock lookups in `src/lib/queries.ts` rely on this. Rows created later get cuids.
- If you remove `src/data`, rewrite the seed first.

---

## 9. Mock data and client-side stores

`src/data/` holds the fake data. It is used by the seed and by the features that are not on the DB yet.

| File | Contents | Still used at runtime by |
| --- | --- | --- |
| `festival.ts` | Puja days, slot times, fee, max passes | Everywhere (config, not mock — keep) |
| `pandals.ts` | 12 pandals, `areas` list | `areas` (filters, forms); bookings lookups |
| `ticket-tiers.ts` | 16 tiers | Bookings lookups |
| `slots.ts` | Deterministic generated availability | Seed only |
| `reviews.ts` | 3 reviews per pandal | Seed only |
| `bookings.ts` | 4 bookings for the demo visitor | `useBookings`, `/bookings/[id]` static params |
| `users.ts` | Demo visitor + club admin | Mock session, login form, club shell |
| `club.ts` | `CLUB_PANDAL_ID`, `CLUB_TODAY`, KPI numbers, daily sales, check-ins, scanner passes | Club dashboard KPIs/chart, scanner, club layout |

`src/lib/queries.ts` now only has `getPandalById`, `getTierById` and `getSeedBookings` for the bookings feature. **Delete it once bookings use the DB.**

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

### 12.1 Authentication (blocks almost everything)

- Pick a library: Auth.js or Better Auth (both have Prisma adapters). Phone OTP is likely the primary method for Indian users, with email as a fallback.
- Add the library's tables to `schema.prisma` (sessions/accounts/verification), keeping `User.role`.
- Replace `src/features/auth/use-session.ts` and the login/register forms with real flows. Add forgot-password and OTP screens.
- Protect routes in **`proxy.ts`**:
  - `/club/*` needs a `ClubMember` of the pandal's club.
  - `/my-bookings`, `/bookings/*` and `/checkout` need a signed-in visitor.
  - Platform admin routes need `PLATFORM_ADMIN`.
- Replace `CLUB_PANDAL_ID` (in `(club)/layout.tsx` and the club pages) with "the pandal(s) of the signed-in member's club".
- Navbar: the session will come from the server. Render the account area under `<Suspense>` with a logged-out fallback, so the shell stays static.

### 12.2 Bookings on the database

- New `src/server/bookings.ts`: `getBookingsForUser(userId)`, `getBookingByReference(ref, userId)`.
- Replace `useBookings` / `useBooking` in `bookings-list.tsx`, `booking-detail.tsx` and `my-bookings/page.tsx` with server-fetched data (wrap in Suspense; these are per-user).
- Delete `src/lib/queries.ts`, `src/data/bookings.ts` usage and `generateStaticParams` on `/bookings/[bookingId]` (use a Suspense'd dynamic read instead).
- Cancellation becomes a Server Action:
  - set the `Booking` and its `Pass`es to `CANCELLED`
  - decrement `Slot.booked`
  - trigger a refund
  - revalidate the slot tags

### 12.3 Checkout with seat holds (the critical piece)

Server Action `createCheckout(trailLines, contact)`:

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

- **Profile editor** (`pandal-profile-form.tsx`): Server Action to update `Pandal`, then `revalidateTag(pandalTags.pandal(slug))` and `revalidateTag(pandalTags.list)`. Add image upload (S3/R2/UploadThing) feeding `PandalImage`.
- **Tickets & slots** (`tickets-manager.tsx`): actions to create/update tiers, toggle `active`, edit `Slot.capacity` (never below `booked`) and `salesPaused`. Revalidate the tiers/slots tags.
- **Dashboard:** replace `dailySales`, `tierSales`, `todayStats` and `recentCheckIns` with aggregates over `Pass` / `Payment` / `CheckIn` (use `cacheLife("minutes")`).
- **QR codes:**
  - The QR should encode a **signed token** (e.g. HMAC of `passId + slotId`), not the plain code.
  - Replace `FakeQr` with a real encoder (`qrcode` / `qrcode.react`).
- **Scanner** (`entry-scanner.tsx`):
  - Decode with the camera (`@zxing/browser` or `BarcodeDetector`).
  - POST to a check-in action that verifies the token and atomically flips the pass (`UPDATE "Pass" SET status='USED', "checkedInAt"=now() WHERE id=$1 AND status='VALID'`).
  - Log every scan to `CheckIn`.
  - Consider offline signature verification for poor network near pandals.
- **New screens:** bookings/visitor list with search + CSV export, payouts/settlements, staff accounts (`ClubMember` role `SCANNER`).

### 12.6 Club onboarding and platform admin

- `club-register-form.tsx` → Server Action that creates a `ClubApplication` and uploads documents.
- New admin area (e.g. `(admin)/admin/*`, `PLATFORM_ADMIN` only):
  - review applications; approving creates the `Club`, a `ClubMember` (OWNER) and a draft `Pandal`
  - manage featured pandals
  - handle refunds and disputes
- Email the club on approval.

### 12.7 Other gaps

- **Notifications:** email/SMS/WhatsApp with passes after booking; a reminder before each slot.
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
| Club edits are not saved | `pandal-profile-form.tsx`, `tickets-manager.tsx` | Local React state only (§12.5). |
| Club dashboard KPIs, chart, check-ins and scanner are mock | `src/data/club.ts` | `CLUB_TODAY` is fixed to Ashtami 2026-09-30. |
| QR codes aren't scannable | `components/shared/FakeQr.tsx` | Deterministic placeholder pattern. |
| Slot picker always starts on Shashthi | `slot-picker.tsx` | Should default to today (or the next festival day) once real dates matter; compute it outside render. |
| Festival dates need confirming | `src/data/festival.ts` | 28 Sep – 2 Oct 2026, from the design mock-up. |
| Real club names with invented prices and ratings | `src/data/*`, DB seed | Replace with clubs' real data before going public. |
| Old trail data is dropped | `use-trail.ts` | Key bumped to `pujapass:trail:v2` when lines became snapshots. |
| Headings use the system serif | `globals.css` | The mock-up suggests a display serif (e.g. Fraunces/Playfair via `next/font`). |
| `.dark` theme tokens exist but nothing uses them | `globals.css` | Implement dark mode or remove them. |

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

- Environment variables: `DATABASE_URL` (add the payment, auth and storage secrets as those features land). Keep `.env.example` up to date; it's the only env file committed.
- Release order: `bun install` (runs `prisma generate`) → `bun run db:deploy` → `bun run build` → `bun run start`.
- Use a pooled connection string for serverless hosts (e.g. Neon/Supabase pooler, Prisma Postgres) to avoid exhausting connections.
- `'use cache'` uses an in-memory cache by default. On serverless, entries don't persist between instances. Consider `'use cache: remote'` with a platform cache handler if the DB load matters.
- Cached pages revalidate on their `cacheLife`. Writes must call `revalidateTag` so edits show up immediately.
