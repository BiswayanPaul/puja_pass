import type { DefaultSession } from "next-auth";
import type { SessionClub } from "./index";

// What our Auth.js session carries (see the `session` callback in src/auth.ts).
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      isPlatformAdmin: boolean;
      club: SessionClub | null;
    } & DefaultSession["user"];
  }
}
