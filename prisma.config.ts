import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun prisma/seed.ts",
  },
  datasource: {
    // CLI (migrate/studio) needs a session-mode connection; the app uses
    // the pooled DATABASE_URL via the PrismaPg adapter in src/lib/prisma.ts.
    url: env("DIRECT_URL"),
  },
});
