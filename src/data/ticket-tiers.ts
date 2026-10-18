import type { TicketTier } from "@/types";

export const ticketTiers: TicketTier[] = [
  // Sreebhumi Sporting Club
  { id: "sreebhumi-general", pandalId: "sreebhumi-sporting-club", name: "Timed Entry", description: "Enter through the dedicated slot lane within your time window.", price: 99, perks: ["Dedicated entry lane", "Skip the general queue"], capacityPerSlot: 900, active: true },
  { id: "sreebhumi-priority", pandalId: "sreebhumi-sporting-club", name: "Priority Darshan", description: "Closest viewing area with guided walk-through of the pandal.", price: 299, perks: ["Front viewing gallery", "Guided walk-through", "Prasad pack"], capacityPerSlot: 150, active: true },
  // Santosh Mitra Square
  { id: "santosh-gallery", pandalId: "santosh-mitra-square", name: "Viewing Gallery", description: "Reserved raised gallery for the hourly light & sound show.", price: 149, perks: ["Reserved seating", "Light show view"], capacityPerSlot: 120, active: true },
  // Badamtala Ashar Sangha
  { id: "badamtala-general", pandalId: "badamtala-ashar-sangha", name: "Timed Entry", description: "Slot-based entry through the Badamtala lane.", price: 79, perks: ["Dedicated entry lane"], capacityPerSlot: 300, active: true },
  { id: "badamtala-artist", pandalId: "badamtala-ashar-sangha", name: "Artist Walk", description: "A 20-minute walk-through with a member of the art team.", price: 249, perks: ["Guided by the art team", "Theme booklet"], capacityPerSlot: 30, active: true },
  // Bagbazar Sarbojanin
  { id: "bagbazar-heritage", pandalId: "bagbazar-sarbojanin", name: "Heritage Walk", description: "Guided heritage walk covering the Puja's 100+ year history.", price: 149, perks: ["Guided walk", "Bhog tasting"], capacityPerSlot: 40, active: true },
  // Deshapriya Park
  { id: "deshapriya-general", pandalId: "deshapriya-park", name: "Timed Entry", description: "Skip the main queue at the Rashbehari gate.", price: 99, perks: ["Express gate"], capacityPerSlot: 350, active: true },
  { id: "deshapriya-family", pandalId: "deshapriya-park", name: "Family Pass", description: "Entry for up to four with reserved bench seating.", price: 349, perks: ["Admits 4", "Reserved seating"], capacityPerSlot: 50, active: true },
  // Tridhara Sammilani
  { id: "tridhara-general", pandalId: "tridhara-sammilani", name: "Timed Entry", description: "Slot-based entry through the express lane.", price: 69, perks: ["Express lane"], capacityPerSlot: 250, active: true },
  // Ekdalia Evergreen
  { id: "ekdalia-general", pandalId: "ekdalia-evergreen", name: "Timed Entry", description: "Priority entry with reserved seating area access.", price: 89, perks: ["Priority entry", "Seating area"], capacityPerSlot: 250, active: true },
  // Kumartuli Park
  { id: "kumartuli-walk", pandalId: "kumartuli-park", name: "Artisan Walk", description: "Visit working studios in Kumartuli with a local guide.", price: 199, perks: ["Studio visits", "Local guide"], capacityPerSlot: 25, active: true },
  // College Square
  { id: "college-photo", pandalId: "college-square", name: "Photo Deck", description: "Access to the raised deck for the best reflection photographs.", price: 99, perks: ["Raised photo deck", "15-minute window"], capacityPerSlot: 60, active: true },
  // Suruchi Sangha
  { id: "suruchi-general", pandalId: "suruchi-sangha", name: "Timed Entry", description: "Express lane entry within your slot.", price: 99, perks: ["Express lane"], capacityPerSlot: 350, active: true },
  { id: "suruchi-craft", pandalId: "suruchi-sangha", name: "Craft Trail", description: "Guided tour of the folk-craft installations with an artisan.", price: 229, perks: ["Guided tour", "Craft souvenir"], capacityPerSlot: 40, active: true },
  // FD Block
  { id: "fdblock-general", pandalId: "fd-block-salt-lake", name: "Timed Entry", description: "Slot-based entry, includes the fountain show area.", price: 79, perks: ["Fountain show area"], capacityPerSlot: 300, active: true },
  // New Town CC Block
  { id: "newtown-sapling", pandalId: "newtown-cc-block", name: "Plant-a-Sapling", description: "Plant a sapling in the community garden and take home a seed kit.", price: 49, perks: ["Seed kit", "Certificate"], capacityPerSlot: 50, active: true },
];
