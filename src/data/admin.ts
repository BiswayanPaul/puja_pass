// Seed data for the platform admin area: the admin account, club applications
// in every review state, and clubs/pandals that are approved but not live.
// Names are fictional. Only `prisma/seed.ts` reads this file.

export const platformAdmin = {
  id: "user-admin-1",
  name: "Ananya Mitra",
  email: "admin@pujapass.example.com",
  phone: "+91 98311 00001",
};

/** Club applicants with accounts. Applications can also arrive without one. */
export const applicants = [
  {
    id: "user-applicant-1",
    name: "Arindam Ghosh",
    email: "arindam@nabapally.example.com",
    phone: "+91 98302 11223",
  },
  {
    id: "user-applicant-2",
    name: "Moumita Sen",
    email: "moumita@milantirtha.example.com",
    phone: "+91 98303 44556",
  },
  {
    id: "user-applicant-3",
    name: "Tapas Kundu",
    email: "tapas@udayansangha.example.com",
    phone: "+91 98304 77889",
  },
  {
    id: "user-applicant-4",
    name: "Debjani Roy",
    email: "debjani@sandhani.example.com",
    phone: "+91 98305 99001",
  },
];

/** Registration number given to the seeded Sreebhumi club, reused by a duplicate application below. */
export const SREEBHUMI_REGISTRATION = "S/1L/27615";

type SeedApplication = {
  id: string;
  clubName: string;
  registrationNumber: string;
  established: number;
  area: string;
  address: string;
  theme?: string;
  description: string;
  expectedFootfall: string;
  offerings: string[];
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  certificate?: string;
  permission?: string;
  submittedAt: string;
  submittedById?: string;
  review?: {
    status: "APPROVED" | "REJECTED";
    notes?: string;
    reviewedAt: string;
    clubId?: string;
  };
};

export const clubApplications: SeedApplication[] = [
  {
    // Pending, complete: the happy path.
    id: "app-nabapally",
    clubName: "Nabapally Yuva Sangha",
    registrationNumber: "S/1L/40213",
    established: 1984,
    area: "North Kolkata",
    address: "14 Nabapally Road, Baranagar, Kolkata 700036",
    theme: "Terracotta Tales",
    description:
      "A neighbourhood Puja known for terracotta panels made by artisans from Bishnupur.",
    expectedFootfall: "25,000 – 1,00,000",
    offerings: ["Timed entry slots", "Bhog / prasad passes"],
    contactName: "Arindam Ghosh",
    contactRole: "Secretary",
    email: "arindam@nabapally.example.com",
    phone: "+91 98302 11223",
    certificate: "nabapally-society-registration.pdf",
    permission: "nabapally-police-permission-2026.pdf",
    submittedAt: "2026-10-18T09:30:00Z",
    submittedById: "user-applicant-1",
  },
  {
    // Pending, police permission missing: approval needs an explicit override.
    id: "app-lalbagan",
    clubName: "Lalbagan Sarbojanin Durgotsab",
    registrationNumber: "S/2L/18840",
    established: 1999,
    area: "South Kolkata",
    address: "7 Lalbagan Lane, Behala, Kolkata 700034",
    description:
      "Community Puja with a large open courtyard and an evening cultural programme.",
    expectedFootfall: "5,000 – 25,000",
    offerings: ["Timed entry slots"],
    contactName: "Sudipta Pal",
    contactRole: "Treasurer",
    email: "sudipta@lalbagan.example.com",
    phone: "+91 98306 12121",
    certificate: "lalbagan-registration.jpg",
    submittedAt: "2026-10-20T14:05:00Z",
  },
  {
    // Pending, no documents, first-year club with small footfall.
    id: "app-purbachal",
    clubName: "Purbachal Notun Pally Club",
    registrationNumber: "S/3L/52007",
    established: 2026,
    area: "Salt Lake",
    address: "CF Block, Sector 1, Salt Lake, Kolkata 700064",
    theme: "Ma Esechhe Ghore",
    description:
      "A new residents' association Puja holding its first celebration this year.",
    expectedFootfall: "Under 5,000",
    offerings: ["Timed entry slots", "Guided tours"],
    contactName: "Rahul Bose",
    contactRole: "President",
    email: "rahul@notunpally.example.com",
    phone: "+91 98307 34343",
    submittedAt: "2026-10-21T08:12:00Z",
  },
  {
    // Pending, but the registration number belongs to an already verified club.
    id: "app-sreebhumi-duplicate",
    clubName: "Sreebhumi Sporting Club (Lake Town)",
    registrationNumber: SREEBHUMI_REGISTRATION,
    established: 1972,
    area: "North Kolkata",
    address: "Sreebhumi, Lake Town, Kolkata 700048",
    description: "Re-registration request for the Sreebhumi Puja.",
    expectedFootfall: "Over 1,00,000",
    offerings: ["Timed entry slots", "Priority darshan"],
    contactName: "Partha Saha",
    contactRole: "Committee member",
    email: "partha.saha@example.com",
    phone: "+91 98308 56565",
    certificate: "sreebhumi-registration.pdf",
    permission: "sreebhumi-permission.pdf",
    submittedAt: "2026-10-19T17:45:00Z",
  },
  {
    // Pending for weeks: submitted before the festival and never picked up.
    id: "app-dakshin-sreepur",
    clubName: "Dakshin Sreepur Sammilani",
    registrationNumber: "S/1L/33918",
    established: 1968,
    area: "Central Kolkata",
    address: "22 Sreepur Lane, Entally, Kolkata 700014",
    theme: "Rivers of Bengal",
    description:
      "One of Entally's oldest Pujas, with a riverside-themed pandal every few years.",
    expectedFootfall: "5,000 – 25,000",
    offerings: [
      "Timed entry slots",
      "Priority darshan",
      "Bhog / prasad passes",
    ],
    contactName: "Shyamal Dey",
    contactRole: "Joint secretary",
    email: "shyamal@sreepur.example.com",
    phone: "+91 98309 78787",
    certificate: "sreepur-registration.pdf",
    permission: "sreepur-permission.pdf",
    submittedAt: "2026-09-02T11:20:00Z",
  },
  {
    id: "app-bandhu-mahal",
    clubName: "Bandhu Mahal Club",
    registrationNumber: "S/2L/27104",
    established: 1991,
    area: "South Kolkata",
    address: "3 Bandhu Mahal Road, Tollygunge, Kolkata 700033",
    description: "Neighbourhood Puja near Tollygunge metro.",
    expectedFootfall: "5,000 – 25,000",
    offerings: ["Timed entry slots"],
    contactName: "Kaushik Nandi",
    contactRole: "Secretary",
    email: "kaushik@bandhumahal.example.com",
    phone: "+91 98310 13579",
    certificate: "bandhu-mahal-registration.pdf",
    permission: "bandhu-mahal-permission-2024.pdf",
    submittedAt: "2026-09-10T10:00:00Z",
    review: {
      status: "REJECTED",
      notes:
        "The police permission letter is for 2024. Ask the club to apply again with this year's permission.",
      reviewedAt: "2026-09-12T12:30:00Z",
    },
  },
  {
    id: "app-milan-tirtha",
    clubName: "Kankurgachi Milan Tirtha",
    registrationNumber: "S/1L/45102",
    established: 2003,
    area: "North Kolkata",
    address: "P-41 CIT Road, Kankurgachi, Kolkata 700054",
    theme: "Threads of Bengal",
    description: "A pandal woven from handloom saris donated by local weavers.",
    expectedFootfall: "25,000 – 1,00,000",
    offerings: ["Timed entry slots", "Priority darshan"],
    contactName: "Moumita Sen",
    contactRole: "Secretary",
    email: "moumita@milantirtha.example.com",
    phone: "+91 98303 44556",
    certificate: "milan-tirtha-registration.pdf",
    permission: "milan-tirtha-permission.pdf",
    submittedAt: "2026-10-08T07:40:00Z",
    submittedById: "user-applicant-2",
    review: {
      status: "APPROVED",
      reviewedAt: "2026-10-10T09:00:00Z",
      clubId: "club-milan-tirtha",
    },
  },
  {
    id: "app-udayan",
    clubName: "Rajdanga Udayan Sangha",
    registrationNumber: "S/2L/39977",
    established: 1979,
    area: "South Kolkata",
    address: "Rajdanga Main Road, Kasba, Kolkata 700107",
    theme: "Dokra Dreams",
    description: "A dokra metal-craft pandal by artisans from Dariyapur.",
    expectedFootfall: "25,000 – 1,00,000",
    offerings: ["Timed entry slots"],
    contactName: "Tapas Kundu",
    contactRole: "President",
    email: "tapas@udayansangha.example.com",
    phone: "+91 98304 77889",
    certificate: "udayan-registration.pdf",
    permission: "udayan-permission.pdf",
    submittedAt: "2026-09-05T16:10:00Z",
    submittedById: "user-applicant-3",
    review: {
      status: "APPROVED",
      notes: "Documents checked.",
      reviewedAt: "2026-09-07T11:15:00Z",
      clubId: "club-udayan",
    },
  },
  {
    id: "app-sandhani",
    clubName: "Beleghata Sandhani",
    registrationNumber: "S/1L/50631",
    established: 1958,
    area: "Central Kolkata",
    address: "48 Beleghata Main Road, Kolkata 700010",
    theme: "Lanterns of Chandannagar",
    description: "Lighting by Chandannagar artists across the whole lane.",
    expectedFootfall: "25,000 – 1,00,000",
    offerings: ["Timed entry slots", "Guided tours"],
    contactName: "Debjani Roy",
    contactRole: "Secretary",
    email: "debjani@sandhani.example.com",
    phone: "+91 98305 99001",
    certificate: "sandhani-registration.pdf",
    permission: "sandhani-permission.pdf",
    submittedAt: "2026-10-12T13:00:00Z",
    submittedById: "user-applicant-4",
    review: {
      status: "APPROVED",
      reviewedAt: "2026-10-14T10:20:00Z",
      clubId: "club-sandhani",
    },
  },
];

type SeedPandal = {
  id: string;
  name: string;
  neighbourhood: string;
  address: string;
  area: string;
  category: string;
  coverImageUrl: string;
  coverImageAlt: string;
  highlight: string;
  themeTitle: string;
  themeDescription: string;
  description: string;
  established: number;
  idolArtist: string;
  timings: string;
  nearestMetro: string;
  amenities: string[];
  freeEntryInfo: string;
};

/** Clubs created by approved applications. None of their pandals are public. */
export const reviewedClubs: {
  id: string;
  applicationId: string;
  ownerId: string;
  verified: boolean;
  verifiedAt: string;
  verificationNote?: string;
  pandal: SeedPandal;
}[] = [
  {
    // Approved, but the club hasn't finished its profile: can't be published yet.
    id: "club-milan-tirtha",
    applicationId: "app-milan-tirtha",
    ownerId: "user-applicant-2",
    verified: true,
    verifiedAt: "2026-10-10T09:00:00Z",
    pandal: {
      id: "kankurgachi-milan-tirtha",
      name: "Kankurgachi Milan Tirtha",
      neighbourhood: "Kankurgachi, Kolkata",
      address: "P-41 CIT Road, Kankurgachi, Kolkata 700054",
      area: "North Kolkata",
      category: "Theme Based",
      coverImageUrl: "/images/Grandly Lit Durga Puja Pandal at Night.png",
      coverImageAlt: "A pandal lit up at night",
      highlight: "",
      themeTitle: "Threads of Bengal",
      themeDescription: "",
      description:
        "A pandal woven from handloom saris donated by local weavers.",
      established: 2003,
      idolArtist: "",
      timings: "",
      nearestMetro: "",
      amenities: [],
      freeEntryInfo: "General entry is free for everyone.",
    },
  },
  {
    // Approved and complete: ready for an admin to publish.
    id: "club-sandhani",
    applicationId: "app-sandhani",
    ownerId: "user-applicant-4",
    verified: true,
    verifiedAt: "2026-10-14T10:20:00Z",
    pandal: {
      id: "beleghata-sandhani",
      name: "Beleghata Sandhani",
      neighbourhood: "Beleghata, Kolkata",
      address: "48 Beleghata Main Road, Kolkata 700010",
      area: "Central Kolkata",
      category: "Art & Heritage",
      coverImageUrl: "/images/Golden Durga Puja Pandal at Night.png",
      coverImageAlt: "A golden pandal facade lit up at night",
      highlight: "Chandannagar lighting across the whole lane",
      themeTitle: "Lanterns of Chandannagar",
      themeDescription:
        "Hand-built light panels tell the story of Mahishasura Mardini along the approach lane.",
      description:
        "A heritage Puja from 1958, famous for its lighting by Chandannagar artists.",
      established: 1958,
      idolArtist: "Pradip Rudra Pal",
      timings: "10:00 AM – 2:00 AM",
      nearestMetro: "Phoolbagan (1.2 km)",
      amenities: ["Drinking water", "First aid", "Help desk"],
      freeEntryInfo:
        "General entry is free for everyone through the main gate.",
    },
  },
  {
    // Was verified, then verification was revoked: its pandal is hidden.
    id: "club-udayan",
    applicationId: "app-udayan",
    ownerId: "user-applicant-3",
    verified: false,
    verifiedAt: "2026-09-07T11:15:00Z",
    verificationNote:
      "Fire-safety NOC expired on 15 Oct 2026. Restore once the club shares the renewed certificate.",
    pandal: {
      id: "rajdanga-udayan-sangha",
      name: "Rajdanga Udayan Sangha",
      neighbourhood: "Kasba, Kolkata",
      address: "Rajdanga Main Road, Kasba, Kolkata 700107",
      area: "South Kolkata",
      category: "Art & Heritage",
      coverImageUrl: "/images/pexels-souvik-laha-3637528-10852594-640x710.jpg",
      coverImageAlt: "A pandal at night with visitors",
      highlight: "Dokra metal-craft by Dariyapur artisans",
      themeTitle: "Dokra Dreams",
      themeDescription: "Thousands of dokra figurines line the pandal walls.",
      description: "A Kasba favourite known for craft-led themes.",
      established: 1979,
      idolArtist: "Sanatan Dinda",
      timings: "11:00 AM – 1:00 AM",
      nearestMetro: "Kavi Subhash (2.5 km)",
      amenities: ["Drinking water", "First aid"],
      freeEntryInfo: "General entry is free for everyone.",
    },
  },
];
