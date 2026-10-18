// Domain types shared by the UI and the (future) backend.
// The mock data in `src/data` conforms to these shapes, so swapping it for a
// real database only requires re-implementing the functions in `src/lib/queries.ts`.

export type Area = "North Kolkata" | "South Kolkata" | "Central Kolkata" | "Salt Lake" | "New Town";
export type EntryType = "Free Entry" | "Paid Entry";
export type CrowdLevel = "Low" | "Moderate" | "High" | "Very High";

export type Pandal = {
  id: string;
  name: string;
  clubName: string;
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

export type TrailItem = {
  id: string;
  pandalId: string;
  tierId: string;
  slotId: string;
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

export type DailySales = { date: string; label: string; tickets: number; revenue: number };
