/** A name to show for a user who may not have set one: their name, else the start of their email. */
export function displayName(user: { name?: string | null; email?: string | null }) {
  return user.name?.trim() || user.email?.split("@")[0] || "PujaPass user";
}
