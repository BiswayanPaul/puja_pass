// Domain types shared by the UI and the (future) backend.
// The mock data in `src/data` conforms to these shapes, so swapping it for a
// real database only requires re-implementing the functions in `src/lib/queries.ts`.

export type Area =
  | "North Kolkata"
  | "South Kolkata"
  | "Central Kolkata"
  | "Salt Lake"
  | "New Town";
export type EntryType = "Free Entry" | "Paid Entry";
export type CrowdLevel = "Low" | "Moderate" | "High" | "Very High";

export type Pandal = {
  id: string;
  /** URL segment: /pandals/[slug] */
  slug: string;
  name: string;
  clubName: string;
  /** Whether the club passed PujaPass verification. */
  clubVerified: boolean;
  neighbourhood: string;
  address: string;
  area: Area;
  category: string;
  imageSrc: string;
  imageAlt: string;
  gallery: { src: string; alt: string }[];
  rating: number;
  reviewCount: string;
  entryType: EntryType;
  highlight: string;
  tags: string[];
  featured: boolean;
  ecoFriendly: boolean;
  theme: { title: string; description: string };
  description: string;
  established: number;
  idolArtist: string;
  timings: string;
  crowdLevel: CrowdLevel;
  nearestMetro: string;
  amenities: string[];
  freeEntryInfo: string;
  /** Position on the stylised city map, in percent. */
  mapPosition: { x: number; y: number };
  distanceKm: number;
};

export type TicketTier = {
  id: string;
  pandalId: string;
  name: string;
  description: string;
  price: number;
  perks: string[];
  capacityPerSlot: number;
  active: boolean;
};

export type PujaDay = { date: string; label: string; weekday: string };

export type Slot = {
  id: string;
  pandalId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
};

export type Review = {
  id: string;
  pandalId: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
};

/** A cart line. Display fields are a snapshot taken when the slot was added. */
export type TrailItem = {
  id: string;
  pandalId: string;
  pandalSlug: string;
  pandalName: string;
  neighbourhood: string;
  imageSrc: string;
  imageAlt: string;
  tierId: string;
  tierName: string;
  unitPrice: number;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  quantity: number;
};

export type PassStatus = "valid" | "used" | "cancelled";

export type Pass = {
  id: string;
  code: string;
  pandalId: string;
  tierId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  holderName: string;
  quantity: number;
  unitPrice: number;
  status: PassStatus;
  checkedInAt?: string;
};

export type BookingStatus = "confirmed" | "completed" | "cancelled";
export type PaymentMethod = "UPI" | "Card" | "Net Banking";

export type Booking = {
  id: string;
  createdAt: string;
  status: BookingStatus;
  contact: { name: string; email: string; phone: string };
  passes: Pass[];
  subtotal: number;
  fees: number;
  total: number;
  paymentMethod: PaymentMethod;
};

export type UserRole = "visitor" | "club_admin";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  /** Set for club admins: the pandal they manage. */
  pandalId?: string;
};

export type CheckIn = {
  id: string;
  passCode: string;
  holderName: string;
  tierName: string;
  quantity: number;
  time: string;
  result: "admitted" | "duplicate" | "invalid";
};

export type DailySales = {
  date: string;
  label: string;
  tickets: number;
  revenue: number;
};

// ─── Platform admin ─────────────────────────────────────────────────────────

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type ClubApplicationSummary = {
  id: string;
  clubName: string;
  registrationNumber: string;
  area: string;
  established: number;
  contactName: string;
  status: ApplicationStatus;
  /** ISO timestamp. */
  submittedAt: string;
  /** Whole days since submission, for pending applications. */
  waitingDays: number;
  hasCertificate: boolean;
  hasPermission: boolean;
  /** Name of an existing club that already uses this registration number. */
  duplicateOfClub: string | null;
  reviewedAt: string | null;
};

export type ClubApplicationDetail = ClubApplicationSummary & {
  address: string;
  theme: string | null;
  description: string;
  expectedFootfall: string;
  offerings: string[];
  contactRole: string;
  email: string;
  phone: string;
  /** Uploaded file names; null when not provided. */
  certificate: string | null;
  permission: string | null;
  reviewNotes: string | null;
  reviewedBy: string | null;
  submittedBy: { name: string; email: string | null } | null;
  club: { id: string; name: string; verified: boolean } | null;
  /** Other applications using the same registration number. */
  relatedApplications: { id: string; clubName: string; status: ApplicationStatus }[];
};

/** live: on the public site · draft: club verified, not published · blocked: club not verified. */
export type AdminPandalStatus = "live" | "draft" | "blocked";

export type AdminPandal = {
  id: string;
  slug: string;
  name: string;
  area: string;
  imageSrc: string;
  imageAlt: string;
  clubId: string;
  clubName: string;
  clubVerified: boolean;
  status: AdminPandalStatus;
  featured: boolean;
  /** Profile fields that must be filled in before publishing. */
  profileGaps: string[];
  activeTierCount: number;
  slotCount: number;
};

export type AdminClub = {
  id: string;
  name: string;
  registrationNumber: string | null;
  established: number | null;
  verified: boolean;
  verifiedAt: string | null;
  verificationNote: string | null;
  owner: string | null;
  memberCount: number;
  pandals: { id: string; name: string; slug: string; published: boolean }[];
};

export type AdminOverview = {
  applications: Record<ApplicationStatus, number>;
  overdueApplications: number;
  clubs: { verified: number; unverified: number };
  pandals: Record<AdminPandalStatus, number>;
  readyToPublish: number;
};
