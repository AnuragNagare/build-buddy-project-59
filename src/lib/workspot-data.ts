import cafe1 from "@/assets/workspot-cafe-1.jpg";
import cafe2 from "@/assets/workspot-cafe-2.jpg";
import cafe3 from "@/assets/workspot-cafe-3.jpg";
import cafe4 from "@/assets/workspot-cafe-4.jpg";
import floorPlanImage from "@/assets/workspot-floor-plan.jpg";

export type Amenity = "Wi-Fi" | "Power" | "AC" | "Quiet" | "Food" | "Ergonomic";
export type SeatStatus = "available" | "unavailable" | "not-offered";
export type SeatKind = "single" | "table2" | "table4" | "communal" | "booth";
// x/y are percentages of the floor-plan image; tableId groups chairs that belong to one table or booth.
export type Seat = { id: string; name: string; type: string; status: SeatStatus; x: number; y: number; tableId?: string };
export type CafeReview = { id: string; author: string; rating: number; date: string; comment: string };
export type Cafe = {
  slug: string; name: string; area: string; address: string; distance: number; rating: number;
  reviews: number; price: number; image: string; amenities: Amenity[]; availability: string;
  vibe: string; description: string; hours: string; marker: { x: number; y: number }; seats: Seat[];
  reviewsList?: CafeReview[];
  tier?: "free" | "pro";
  lat?: number;
  lon?: number;
  // "osm" = listed from OpenStreetMap only, not a WorkSpot partner (no booking notifications).
  source?: "osm";
  ownerPhone?: string;
  ownerPinHash?: string;
};
// seatId is the first chosen chair; seatIds lists every chair when several are booked together.
export type BookingSelection = { cafeSlug: string; date: string; time: string; duration: number; seatId: string; seatIds?: string[] };
export type Booking = BookingSelection & {
  id: string;
  status: "upcoming" | "past" | "cancelled";
  createdAt: string;
  userId?: string;
  userPhone?: string;
  totalPrice?: number;
  paymentMethod?: string;
  paymentStatus?: "free_online" | "pay_at_venue" | "paid";
  seatName?: string;
};

export type VendorPlan = "free" | "pro";

export type VendorApplication = {
  id: string;
  cafeName: string;
  area: string;
  address: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  price: number;
  hours: string;
  vibe: string;
  description: string;
  amenities: Amenity[];
  seatsCount: number;
  coverImage: string;
  galleryImages?: string[];
  videoUrl?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  notes?: string;
  plan: VendorPlan;
  paidAmount?: number;
  paymentStatus?: "unpaid" | "paid";
  paymentMethod?: string;
  layoutSeats?: Seat[];
  ownerPinHash?: string;
};

export type CafeNotification = {
  id: string;
  cafeSlug: string;
  type: "booking_created" | "booking_cancelled";
  bookingId: string;
  seatName: string;
  date: string;
  time: string;
  duration: number;
  guestPhone?: string;
  createdAt: string;
  read: boolean;
};

export type PendingReviewSubmission = {
  id: string;
  cafeSlug: string;
  cafeName: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
};

export const floorPlan = { image: floorPlanImage, aspect: 1536 / 1024 };

export const seatKindLabels: Record<SeatKind, { label: string; hint: string }> = {
  single: { label: "Single seat", hint: "1 person" },
  table2: { label: "2-seater table", hint: "2 people" },
  table4: { label: "4-seater table", hint: "4 people" },
  communal: { label: "Communal table", hint: "Best for groups" },
  booth: { label: "Booth", hint: "More privacy" },
};

// Chair positions in pixels of the 1536x1024 floor-plan image.
const planSeatGroups: { tableId: string; name: string; type: SeatKind; chairs: [number, number][] }[] = [
  { tableId: "banquette-1", name: "Banquette 1", type: "booth", chairs: [[205, 190], [205, 243], [205, 297]] },
  { tableId: "banquette-2", name: "Banquette 2", type: "booth", chairs: [[205, 418], [205, 473], [205, 527]] },
  {
    tableId: "communal-a", name: "Communal A", type: "communal",
    chairs: [370, 430, 490, 550].flatMap((y): [number, number][] => [[518, y], [638, y]]),
  },
  {
    tableId: "communal-b", name: "Communal B", type: "communal",
    chairs: [370, 430, 490, 550].flatMap((y): [number, number][] => [[825, y], [945, y]]),
  },
  { tableId: "round-1", name: "Round 1", type: "table4", chairs: [[1220, 290], [1298, 290], [1220, 350], [1298, 350]] },
  { tableId: "round-2", name: "Round 2", type: "table4", chairs: [[1220, 427], [1298, 427], [1220, 487], [1298, 487]] },
  { tableId: "round-3", name: "Round 3", type: "table4", chairs: [[1220, 570], [1298, 570], [1220, 630], [1298, 630]] },
  { tableId: "booth-1", name: "Booth 1", type: "booth", chairs: [[474, 733], [474, 798]] },
  { tableId: "booth-2", name: "Booth 2", type: "booth", chairs: [[718, 733], [718, 798]] },
  { tableId: "booth-3", name: "Booth 3", type: "booth", chairs: [[968, 733], [968, 798]] },
  { tableId: "lounge", name: "Lounge", type: "single", chairs: [[1195, 783], [1303, 795]] },
];

const toPercent = (value: number, total: number) => Math.round((value / total) * 1000) / 10;

/** The default café layout: one bookable seat per chair on the shared floor plan. */
export const defaultFloorSeats = (): Seat[] => {
  let n = 0;
  return planSeatGroups.flatMap((group) =>
    group.chairs.map(([x, y], i) => {
      n += 1;
      return {
        id: `s${n}`,
        name: `${group.name} · Seat ${i + 1}`,
        type: group.type,
        status: "available" as const,
        x: toPercent(x, 1536),
        y: toPercent(y, 1024),
        tableId: group.tableId,
      };
    }),
  );
};

const makeSeats = (_offset = 0): Seat[] => defaultFloorSeats();

/** Cafés saved before the floor plan existed have seats on the old plain grid; give them the default layout. */
export const withFloorPlan = <T extends { seats: Seat[] }>(cafe: T): T =>
  cafe.seats.some((seat) => seat.tableId) ? cafe : { ...cafe, seats: defaultFloorSeats() };

/** Whether two bookings on the same day overlap; times are "HH:MM" and durations are in hours. */
export const timesOverlap = (aTime: string, aDuration: number, bTime: string, bDuration: number) => {
  const toHours = (t: string) => Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60;
  const aStart = toHours(aTime);
  const bStart = toHours(bTime);
  return aStart < bStart + bDuration && bStart < aStart + aDuration;
};

export const today = () => new Date().toISOString().slice(0, 10);

const getDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const makeReviews = (name: string): CafeReview[] => [
  { id: "r1", author: "Aanya Shah", rating: 5, date: getDaysAgo(2), comment: `Loved the quiet window desk at ${name}. Super fast Wi-Fi and power outlets right by the seat.` },
  { id: "r2", author: "Rohan Khanna", rating: 5, date: getDaysAgo(5), comment: "Great artisanal coffee and polite staff. Perfect spot for focused morning work sprints." },
  { id: "r3", author: "Pooja Nair", rating: 4, date: getDaysAgo(12), comment: "The booking process was seamless. My reserved seat was ready when I reached and paying at the counter was super easy." }
];

export const cafes: Cafe[] = [
  // --- Andheri West Cafés ---
  {
    slug: "third-wave-coffee-andheri",
    name: "Third Wave Coffee",
    area: "Andheri West",
    address: "Samartha Vaibhav, Oshiwara, Lokhandwala Complex, Andheri West, Mumbai, Maharashtra 400053",
    distance: 1.5,
    rating: 4.8,
    reviews: 320,
    price: 149,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food"],
    availability: "7 seats open",
    vibe: "Warm, energetic & laptop-friendly",
    description: "Spacious booths with dedicated charging points at every desk, fast dual-band Wi-Fi, and artisanal specialty brews in Lokhandwala.",
    hours: "8:00 AM–11:30 PM IST",
    marker: { x: 32, y: 24 },
    seats: makeSeats(0),
    reviewsList: makeReviews("Third Wave Coffee Andheri"),
    tier: "pro"
  },
  {
    slug: "blue-tokai-andheri",
    name: "Blue Tokai Coffee Roasters",
    area: "Andheri West",
    address: "Laxmi Plaza, Sab TV Lane, Off New Link Road, Veera Desai, Andheri West, Mumbai, Maharashtra 400053",
    distance: 2.1,
    rating: 4.9,
    reviews: 295,
    price: 159,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Quiet"],
    availability: "6 seats open",
    vibe: "Minimalist, quiet & coffee-centric",
    description: "An airy specialty roastery with abundant power sockets, quiet daylight, and dedicated long work tables for deep focus.",
    hours: "7:00 AM–11:00 PM IST",
    marker: { x: 34, y: 22 },
    seats: makeSeats(1),
    reviewsList: makeReviews("Blue Tokai Coffee Roasters Andheri"),
    tier: "pro"
  },
  {
    slug: "doolally-taproom-andheri",
    name: "Doolally Taproom",
    area: "Andheri West",
    address: "Dalia Industrial Estate, Off New Link Road, Veera Desai, Andheri West, Mumbai, Maharashtra 400053",
    distance: 2.3,
    rating: 4.7,
    reviews: 410,
    price: 139,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Ergonomic"],
    availability: "9 seats open",
    vibe: "Spacious, community-driven & pet-friendly",
    description: "A popular co-working haven with 100 Mbps fiber internet, spike-protected power strips, and comfortable community desks.",
    hours: "8:00 AM–1:00 AM IST",
    marker: { x: 35, y: 25 },
    seats: makeSeats(2),
    reviewsList: makeReviews("Doolally Taproom Andheri")
  },
  {
    slug: "sequel-andheri",
    name: "Sequel Bistro & Juice Bar",
    area: "Andheri West",
    address: "Shop 2, Upvan Building, Near Oshiwara Police Station, Andheri West, Mumbai, Maharashtra 400053",
    distance: 1.8,
    rating: 4.7,
    reviews: 182,
    price: 179,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Quiet"],
    availability: "5 seats open",
    vibe: "Sunlit, serene & health-conscious",
    description: "Organic dining with natural Scandinavian interiors, sun-drenched corners, quiet atmosphere, and high-speed Wi-Fi.",
    hours: "8:00 AM–10:30 PM IST",
    marker: { x: 33, y: 26 },
    seats: makeSeats(3),
    reviewsList: makeReviews("Sequel Bistro & Juice Bar"),
    tier: "pro"
  },
  {
    slug: "bloom-cafea-andheri",
    name: "Bloom Cafea",
    area: "Andheri West",
    address: "Royal Sands Building, Shastri Nagar, Oshiwara, Andheri West, Mumbai, Maharashtra 400053",
    distance: 1.9,
    rating: 4.8,
    reviews: 140,
    price: 169,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food"],
    availability: "6 seats open",
    vibe: "Aesthetic, botanical & vibrant",
    description: "Pastel botanical aesthetic café with dedicated laptop nooks, strong Wi-Fi, and artisan pour-overs and cold brews.",
    hours: "8:30 AM–11:00 PM IST",
    marker: { x: 31, y: 23 },
    seats: makeSeats(4),
    reviewsList: makeReviews("Bloom Cafea")
  },
  {
    slug: "starbucks-lokhandwala",
    name: "Starbucks Coffee",
    area: "Andheri West",
    address: "Greenfield CHS, Lokhandwala Market, Andheri West, Mumbai, Maharashtra 400053",
    distance: 1.4,
    rating: 4.6,
    reviews: 512,
    price: 159,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food"],
    availability: "8 seats open",
    vibe: "Classic, reliable & lively",
    description: "High-speed Wi-Fi, abundant charging outlets, spacious community seating, and reliable espresso for productive work sessions.",
    hours: "7:00 AM–12:00 AM IST",
    marker: { x: 32, y: 27 },
    seats: makeSeats(5),
    reviewsList: makeReviews("Starbucks Lokhandwala")
  },

  // --- Bandra, Khar & South Mumbai Cafés ---
  {
    slug: "subko-coffee-bandra",
    name: "Subko Coffee Craft House",
    area: "Bandra West",
    address: "Ranwar Village, Bandra West, Mumbai, Maharashtra 400050",
    distance: 0.9,
    rating: 4.9,
    reviews: 342,
    price: 189,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Ergonomic"],
    availability: "5 seats open",
    vibe: "Artisanal, vibrant & laptop-friendly",
    description: "A restored heritage house in Ranwar Village with specialty single-origin pour-overs, dedicated work counters, and high-speed Wi-Fi.",
    hours: "7:30 AM–10:00 PM IST",
    marker: { x: 24, y: 54 },
    seats: makeSeats(0),
    reviewsList: makeReviews("Subko Coffee Craft House"),
    tier: "pro"
  },
  {
    slug: "blue-tokai-bandra",
    name: "Blue Tokai Coffee Roasters",
    area: "Bandra West",
    address: "Perry Cross Rd, Pali Hill, Bandra West, Mumbai, Maharashtra 400050",
    distance: 1.4,
    rating: 4.8,
    reviews: 289,
    price: 159,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Quiet"],
    availability: "7 seats open",
    vibe: "Focused, quiet & coffee-centric",
    description: "Mumbai's go-to workspace for founders and creators. Ample power sockets, specialty roasts, and quiet natural lighting.",
    hours: "7:00 AM–11:00 PM IST",
    marker: { x: 26, y: 52 },
    seats: makeSeats(1),
    reviewsList: makeReviews("Blue Tokai Coffee Roasters"),
    tier: "pro"
  },
  {
    slug: "third-wave-coffee-khar",
    name: "Third Wave Coffee",
    area: "Khar West",
    address: "Linking Road, Khar West, Mumbai, Maharashtra 400052",
    distance: 2.1,
    rating: 4.7,
    reviews: 215,
    price: 149,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food"],
    availability: "6 seats open",
    vibe: "Warm, energetic & productive",
    description: "Spacious seating booths with dedicated plug points at every table, reliable high-speed mesh network, and cold brews on tap.",
    hours: "8:00 AM–11:30 PM IST",
    marker: { x: 28, y: 46 },
    seats: makeSeats(2),
    reviewsList: makeReviews("Third Wave Coffee")
  },
  {
    slug: "kmc-mumbai-fort",
    name: "KMC Mumbai",
    area: "Kala Ghoda / Fort",
    address: "Kitab Mahal, 1st Floor, D.N. Road, Fort, Mumbai, Maharashtra 400001",
    distance: 5.4,
    rating: 4.8,
    reviews: 178,
    price: 199,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Quiet", "Ergonomic", "Food"],
    availability: "4 seats open",
    vibe: "Sophisticated, calm & literary",
    description: "Housed inside the iconic Kitab Mahal, KMC offers library-quiet zones, ergonomic seating, and creative cuisine for long workdays.",
    hours: "10:00 AM–10:00 PM IST",
    marker: { x: 68, y: 74 },
    seats: makeSeats(3),
    reviewsList: makeReviews("KMC Mumbai"),
    tier: "pro"
  },
  {
    slug: "kcroasters-chuim",
    name: "KCROASTERS by Curators",
    area: "Khar / Chuim Village",
    address: "Chuim Village Road, Khar West, Mumbai, Maharashtra 400052",
    distance: 2.3,
    rating: 4.9,
    reviews: 164,
    price: 169,
    image: "",
    amenities: ["Wi-Fi", "Power", "Quiet", "Food"],
    availability: "5 seats open",
    vibe: "Intimate, quiet & artisan",
    description: "Tucked inside charming Chuim Village, an intimate roastery with sunlit nooks, whisper-quiet atmosphere, and handcrafted coffees.",
    hours: "8:00 AM–9:00 PM IST",
    marker: { x: 30, y: 48 },
    seats: makeSeats(4),
    reviewsList: makeReviews("KCROASTERS by Curators")
  },
  {
    slug: "doolally-taproom-khar",
    name: "Doolally Taproom",
    area: "Khar West",
    address: "1st Floor, Raj Kutir, 33rd Road, Khar West, Mumbai, Maharashtra 400052",
    distance: 1.8,
    rating: 4.6,
    reviews: 310,
    price: 139,
    image: "",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Ergonomic"],
    availability: "8 seats open",
    vibe: "Pet-friendly, relaxed & spacious",
    description: "A legendary co-working favourite with 100 Mbps Wi-Fi, abundant plugs, pet-friendly workspace, and hearty breakfast options.",
    hours: "8:00 AM–1:00 AM IST",
    marker: { x: 25, y: 49 },
    seats: makeSeats(5),
    reviewsList: makeReviews("Doolally Taproom")
  },
];

const legacySlugMap: Record<string, string> = {
  "blue-door-coffee": "subko-coffee-bandra",
  "monsoon-desk-cafe": "blue-tokai-bandra",
  "citrus-corner": "third-wave-coffee-andheri",
  "paper-plane-cafe": "kmc-mumbai-fort",
  "studio-bean": "kcroasters-chuim",
  "yellow-kettle": "doolally-taproom-khar",
};

export const getCafe = (slug: string): Cafe => {
  const resolvedSlug = legacySlugMap[slug] || slug;
  return cafes.find((cafe) => cafe.slug === resolvedSlug) ?? cafes[0] ?? fallbackCafe;
};

const fallbackCafe: Cafe = {
  slug: "subko-coffee-bandra",
  name: "Subko Coffee Craft House",
  area: "Bandra West",
  address: "Ranwar Village, Bandra West, Mumbai",
  distance: 0.9,
  rating: 4.9,
  reviews: 342,
  price: 189,
  image: "",
  amenities: ["Wi-Fi", "Power", "AC", "Food", "Ergonomic"],
  availability: "Seats available",
  vibe: "Artisanal & productive",
  description: "A work-friendly specialty coffee house in Mumbai.",
  hours: "7:30 AM–10:00 PM IST",
  marker: { x: 24, y: 54 },
  seats: makeSeats()
};

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${value}T12:00:00`)
  );


// Generic photos for cafés that haven't uploaded their own yet (real photos arrive via partner registration).
const genericCafeImages = [cafe1, cafe2, cafe3, cafe4];

// Stock URLs (the old seed data and the partner form default) are not photos of the venue itself.
export const isGenericCafeImage = (image?: string) => !image || image.includes("images.unsplash.com");

export const getCafeImage = (cafe: Pick<Cafe, "slug" | "image">) => {
  if (!isGenericCafeImage(cafe.image)) return cafe.image;
  let hash = 0;
  for (const char of cafe.slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return genericCafeImages[hash % genericCafeImages.length] ?? cafe1;
};

// Neighbourhoods searched together, e.g. "Andheri" should also find Lokhandwala and Versova cafés.
const areaAliases: Record<string, string[]> = {
  andheri: ["lokhandwala", "oshiwara", "versova", "veera desai", "seven bungalows", "jb nagar", "chakala", "marol"],
  bandra: ["khar", "pali hill", "linking road", "bkc", "bandra kurla"],
  "lower parel": ["worli", "mahalaxmi", "prabhadevi"],
  fort: ["kala ghoda", "colaba", "churchgate", "nariman point"],
};

export const matchesCafeSearch = (cafe: Pick<Cafe, "name" | "area" | "address">, search: string) => {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  const terms = [needle, ...(areaAliases[needle] ?? [])];
  const haystack = `${cafe.name} ${cafe.area} ${cafe.address}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
};
