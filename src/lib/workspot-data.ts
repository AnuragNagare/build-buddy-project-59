import cafe1 from "@/assets/workspot-cafe-1.jpg";
import cafe2 from "@/assets/workspot-cafe-2.jpg";
import cafe3 from "@/assets/workspot-cafe-3.jpg";
import cafe4 from "@/assets/workspot-cafe-4.jpg";

export type Amenity = "Wi-Fi" | "Power" | "AC" | "Quiet" | "Food" | "Ergonomic";
export type SeatStatus = "available" | "unavailable" | "not-offered";
export type Seat = { id: string; name: string; type: string; status: SeatStatus; x: number; y: number };
export type Cafe = {
  slug: string; name: string; area: string; address: string; distance: number; rating: number;
  reviews: number; price: number; image: string; amenities: Amenity[]; availability: string;
  vibe: string; description: string; hours: string; marker: { x: number; y: number }; seats: Seat[];
};
export type BookingSelection = { cafeSlug: string; date: string; time: string; duration: number; seatId: string };
export type Booking = BookingSelection & { id: string; status: "upcoming" | "past" | "cancelled"; createdAt: string };

const seatNames = ["Window 1", "Window 2", "Window 3", "Community 1", "Community 2", "Community 3", "Bar 1", "Bar 2", "Nook 1", "Nook 2"];
const makeSeats = (offset = 0): Seat[] => seatNames.map((name, i) => ({
  id: `s${i + 1}`, name, type: name.split(" ")[0] ?? "Seat", status: (i + offset) % 5 === 2 ? "unavailable" : (i + offset) % 7 === 4 ? "not-offered" : "available",
  x: 12 + (i % 3) * 31, y: 12 + Math.floor(i / 3) * 25,
}));

export const cafes: Cafe[] = [
  { slug: "blue-door-coffee", name: "Blue Door Coffee", area: "Bandra West", address: "Chapel Road, Bandra West, Mumbai", distance: 0.8, rating: 4.8, reviews: 126, price: 149, image: cafe1, amenities: ["Wi-Fi", "Power", "AC", "Food"], availability: "6 seats open", vibe: "Bright & social", description: "A sunlit neighbourhood workspace with long window counters, steady Wi-Fi and excellent coffee within arm’s reach.", hours: "8:00 AM–8:00 PM IST", marker: { x: 22, y: 53 }, seats: makeSeats(0) },
  { slug: "monsoon-desk-cafe", name: "Monsoon Desk Café", area: "Lower Parel", address: "Senapati Bapat Marg, Lower Parel, Mumbai", distance: 2.1, rating: 4.7, reviews: 98, price: 179, image: cafe4, amenities: ["Wi-Fi", "Power", "Quiet", "Ergonomic"], availability: "4 seats open", vibe: "Focused & quiet", description: "Lofty ceilings, dedicated work tables and a low-volume soundtrack make deep-work sessions feel effortless.", hours: "9:00 AM–7:00 PM IST", marker: { x: 49, y: 41 }, seats: makeSeats(1) },
  { slug: "citrus-corner", name: "Citrus Corner", area: "Andheri West", address: "Veera Desai Road, Andheri West, Mumbai", distance: 2.8, rating: 4.6, reviews: 84, price: 129, image: cafe2, amenities: ["Wi-Fi", "Power", "AC", "Food"], availability: "8 seats open", vibe: "Warm & lively", description: "A cheerful all-day café with generous community tables and plenty of plug points for quick work sprints.", hours: "8:30 AM–9:00 PM IST", marker: { x: 31, y: 22 }, seats: makeSeats(2) },
  { slug: "paper-plane-cafe", name: "Paper Plane Café", area: "Powai", address: "Central Avenue, Powai, Mumbai", distance: 4.4, rating: 4.9, reviews: 143, price: 199, image: cafe3, amenities: ["Wi-Fi", "Power", "Quiet", "Food", "Ergonomic"], availability: "3 seats open", vibe: "Calm & scenic", description: "Lake views, quiet corners and thoughtfully spaced desks for calls, writing and long creative sessions.", hours: "8:00 AM–8:30 PM IST", marker: { x: 72, y: 18 }, seats: makeSeats(3) },
  { slug: "studio-bean", name: "Studio Bean", area: "Fort", address: "Kala Ghoda, Fort, Mumbai", distance: 5.7, rating: 4.5, reviews: 67, price: 159, image: cafe1, amenities: ["Wi-Fi", "Power", "AC", "Quiet"], availability: "5 seats open", vibe: "Creative & calm", description: "A compact art-district spot with reliable connectivity, considered lighting and tucked-away desks.", hours: "9:00 AM–7:30 PM IST", marker: { x: 67, y: 72 }, seats: makeSeats(4) },
  { slug: "yellow-kettle", name: "The Yellow Kettle", area: "Dadar", address: "Shivaji Park, Dadar West, Mumbai", distance: 3.6, rating: 4.7, reviews: 112, price: 139, image: cafe2, amenities: ["Wi-Fi", "Power", "Food"], availability: "7 seats open", vibe: "Friendly & relaxed", description: "A friendly local favourite designed for productive mornings and easy afternoon meetings.", hours: "7:30 AM–8:00 PM IST", marker: { x: 42, y: 62 }, seats: makeSeats(5) },
];

export const getCafe = (slug: string): Cafe => cafes.find((cafe) => cafe.slug === slug) ?? cafes[0] ?? fallbackCafe;
const fallbackCafe: Cafe = { slug: "workspot", name: "WorkSpot Café", area: "Mumbai", address: "Mumbai", distance: 0, rating: 4.8, reviews: 0, price: 149, image: cafe1, amenities: ["Wi-Fi", "Power"], availability: "Seats available", vibe: "Focused", description: "A work-friendly café in Mumbai.", hours: "9:00 AM–6:00 PM IST", marker: { x: 50, y: 50 }, seats: makeSeats() };
export const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
export const today = () => new Date().toISOString().slice(0, 10);
