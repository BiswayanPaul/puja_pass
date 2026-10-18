import type { User } from "@/types";

// Demo accounts. Any password works on the mock login screen.
export const users: User[] = [
  { id: "user-visitor-1", name: "Riya Banerjee", email: "riya@example.com", phone: "+91 98300 12345", role: "visitor" },
  { id: "user-club-1", name: "Sourav Dutta", email: "admin@sreebhumi.example.com", phone: "+91 98310 54321", role: "club_admin", pandalId: "sreebhumi-sporting-club" },
];

export const demoVisitor = users[0];
export const demoClubAdmin = users[1];
