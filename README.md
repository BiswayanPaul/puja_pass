# PujaPass

Discover Kolkata's Durga Puja pandals, reserve authorised timed-entry slots across several pandals in one checkout, and enter with QR passes. Puja clubs get a dashboard to manage their pandal, passes, slot capacity and gate check-ins.

> **Status:** the UI is complete. Pandal, ticket-type, slot and review data comes from PostgreSQL via Prisma. Auth, bookings, payments, the QR scanner and club "save" actions are still mocked in the browser. See the [roadmap](docs/DEVELOPER_GUIDE.md#12-roadmap-what-to-build-next).

## Features

### For visitors

- Pandal explorer with search, quick filters, area/entry-type filters and map pins
- Pandal pages with theme, gallery, facilities, reviews and free-entry details
- **Puja trail**: add slots from several pandals, then check out once
- Booking history and QR passes per slot

### For Puja clubs

- Four-step club registration
- Dashboard with sales, slot occupancy and recent check-ins
- Pandal profile editor, pass types and slot capacity management
- Entry scanner

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, Cache Components, Partial Prefetching) |
| UI | React 19 + React Compiler, Tailwind CSS v4, Base UI, lucide-react |
| Database | PostgreSQL + Prisma ORM 7 (`@prisma/adapter-pg`) |
| Language | TypeScript (strict) |
| Package manager | Bun 1.4 |

> This is **Next.js 16**, which differs from most tutorials. Read `AGENTS.md` and the docs in `node_modules/next/dist/docs/` before using an API.

## Getting started

**Prerequisites:** [Bun](https://bun.sh) 1.4+ and a PostgreSQL database (local or hosted).

```bash
bun install                 # also generates the Prisma client
cp .env.example .env        # set DATABASE_URL
createdb puja_pass          # if using local PostgreSQL
bun run db:migrate          # apply migrations
bun run db:seed             # DEV ONLY: wipes the DB, adds festival days + a demo pandal
bun run dev                 # http://localhost:3000
```

### Signing in

Sign-in is passwordless (Google or an emailed link) via Auth.js. Sign in with your own email, then make yourself a platform admin with `bun run admin:grant you@example.com`. See the developer guide, §7.4.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` / `bun run start` | Production build / server (the build needs database access) |
| `bun run lint` | ESLint |
| `bun run db:migrate` | Create and apply a migration after editing `prisma/schema.prisma` |
| `bun run db:seed` | Wipe a development database and load festival days + the demo pandal |
| `bun run demo:seed <email>` | Build the demo pandal on any database, owned by `<email>` (removes the old sample pandals) |
| `bun run admin:grant <email>` | Make an account a platform admin |
| `bun run db:reset` | Drop, re-migrate and re-seed the database |
| `bun run db:studio` | Open Prisma Studio |
| `bun run db:deploy` | Apply migrations in production |

## Project structure

```text
prisma/            Schema, migrations, seed script
src/app/           Routes: (marketing), (visitor), (auth), (club)
src/components/    Layout, shared sections and UI primitives
src/features/      Feature modules (pandals, trail, checkout, bookings, auth, club)
src/server/        Server-only database queries (Prisma, cached with 'use cache')
src/lib/           Prisma client, formatting helpers, client-side stores
src/data/          Settings: standard entry windows, fees, areas
src/types/         Shared domain types
```

## Documentation

**[docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)** is the full handbook:

- architecture and data flow
- database schema
- routes
- conventions
- the roadmap
- known issues
- deployment notes

Start there before making changes.
