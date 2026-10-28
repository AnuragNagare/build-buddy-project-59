import cafe1 from "@/assets/workspot-cafe-1.jpg";
import cafe2 from "@/assets/workspot-cafe-2.jpg";
import cafe3 from "@/assets/workspot-cafe-3.jpg";
import cafe4 from "@/assets/workspot-cafe-4.jpg";

export type Amenity = "Wi-Fi" | "Power" | "AC" | "Quiet" | "Food" | "Ergonomic";
export type SeatStatus = "available" | "unavailable" | "not-offered";
export type Seat = { id: string; name: string; type: string; status: SeatStatus; x: number; y: number };
export type CafeReview = { id: string; author: string; rating: number; date: string; comment: string };
export type Cafe = {
  slug: string; name: string; area: string; address: string; distance: number; rating: number;
  reviews: number; price: number; image: string; amenities: Amenity[]; availability: string;
  vibe: string; description: string; hours: string; marker: { x: number; y: number }; seats: Seat[];
  reviewsList?: CafeReview[];
  tier?: "free" | "pro";
};
export type BookingSelection = { cafeSlug: string; date: string; time: string; duration: number; seatId: string };
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

const seatNames = ["Window 1", "Window 2", "Window 3", "Community 1", "Community 2", "Community 3", "Bar 1", "Bar 2", "Nook 1", "Nook 2"];
const makeSeats = (offset = 0): Seat[] => seatNames.map((name, i) => ({
  id: `s${i + 1}`, name, type: name.split(" ")[0] ?? "Seat", status: (i + offset) % 5 === 2 ? "unavailable" : (i + offset) % 7 === 4 ? "not-offered" : "available",
  x: 12 + (i % 3) * 31, y: 12 + Math.floor(i / 3) * 25,
}));

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
    image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1200&q=80",
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
  image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
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
