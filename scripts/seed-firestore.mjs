/**
 * WorkSpot — Mumbai café seeder via OpenStreetMap Overpass API
 *
 * Fetches real cafés across Mumbai — free, no API key needed — and writes them to Firestore.
 * Venues from OSM have a real name, location and (when tagged) Wi-Fi / AC info. Photos, ratings and
 * reviews are NOT invented: `image` stays empty (the app shows a representative photo) and
 * `rating`/`reviews` are 0 (the app shows "New").
 *
 * Usage:
 *   bun run db:seed             # upsert OSM cafés
 *   bun run db:seed -- --clean  # first delete every existing doc in `cafes`, then seed
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

try {
  const dotenv = await import("dotenv");
  dotenv.config();
} catch {
  // Bun loads .env automatically
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Error: Missing Firebase credentials in .env.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const clean = process.argv.includes("--clean");

const MUMBAI_BBOX = { south: 18.87, west: 72.77, north: 19.28, east: 72.99 };

const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  node["amenity"="cafe"](${MUMBAI_BBOX.south},${MUMBAI_BBOX.west},${MUMBAI_BBOX.north},${MUMBAI_BBOX.east});
  way["amenity"="cafe"](${MUMBAI_BBOX.south},${MUMBAI_BBOX.west},${MUMBAI_BBOX.north},${MUMBAI_BBOX.east});
);
out center tags;
`;

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

// Curated cafés live in src/lib/workspot-data.ts and are never overwritten by the OSM seed.
// Keep in sync with that file.
const CURATED_SLUGS = new Set([
  "third-wave-coffee-andheri", "blue-tokai-andheri", "doolally-taproom-andheri", "sequel-andheri",
  "bloom-cafea-andheri", "starbucks-lokhandwala", "subko-coffee-bandra", "blue-tokai-bandra",
  "third-wave-coffee-khar", "kmc-mumbai-fort", "kcroasters-chuim", "doolally-taproom-khar",
]);

// Approximate neighbourhood centres; each café gets the nearest one as its area.
const LOCALITIES = [
  ["Andheri West", 19.1363, 72.8277], ["Andheri West", 19.1405, 72.8290], ["Versova, Andheri West", 19.1310, 72.8112],
  ["Andheri East", 19.1136, 72.8697], ["Juhu", 19.1075, 72.8263], ["Vile Parle", 19.0990, 72.8440],
  ["Santacruz", 19.0810, 72.8410], ["Khar West", 19.0709, 72.8366], ["Bandra West", 19.0596, 72.8295],
  ["Bandra East / BKC", 19.0680, 72.8700], ["Mahim", 19.0410, 72.8400], ["Powai", 19.1176, 72.9060],
  ["Vikhroli", 19.1100, 72.9270], ["Goregaon", 19.1663, 72.8526], ["Malad", 19.1860, 72.8480],
  ["Kandivali", 19.2047, 72.8520], ["Borivali", 19.2307, 72.8567], ["Mulund", 19.1726, 72.9425],
  ["Ghatkopar", 19.0860, 72.9081], ["Kurla", 19.0726, 72.8845], ["Chembur", 19.0522, 72.9005],
  ["Sion", 19.0390, 72.8619], ["Matunga", 19.0270, 72.8570], ["Dadar", 19.0178, 72.8478],
  ["Prabhadevi", 19.0170, 72.8300], ["Worli", 19.0176, 72.8156], ["Lower Parel", 18.9930, 72.8300],
  ["Byculla / Mahalaxmi", 18.9800, 72.8320], ["Fort / Kala Ghoda", 18.9322, 72.8353],
  ["Churchgate / Marine Lines", 18.9440, 72.8230], ["Colaba", 18.9067, 72.8147],
];

// Distances are measured from a fixed reference (Dadar, central Mumbai) until the app uses live geolocation.
const REFERENCE = { lat: 19.0178, lon: 72.8478 };

// OSM tags `amenity=cafe` on tea stalls, juice bars and sweet shops that aren't work-friendly.
const NOT_WORK_FRIENDLY = /\b(tea\s*(stall|house|centre|center)?|chai|juice|snacks?|cold\s*drinks?|mishtan|bakery|bakers?|sweets?|dhaba|pav|vada|dosa|misal|lassi|ice\s*cream|stores?|restaurant|family|bhavan|bhojanalay|paan)\b/i;

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function nearestArea(lat, lon) {
  let best = LOCALITIES[0];
  let bestKm = Infinity;
  for (const loc of LOCALITIES) {
    const km = haversineKm(lat, lon, loc[1], loc[2]);
    if (km < bestKm) {
      bestKm = km;
      best = loc;
    }
  }
  return best[0];
}

function slugify(name, area) {
  return `${name}-${area}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);
}

const seatNames = [
  "Window 1", "Window 2", "Window 3", "Community 1", "Community 2",
  "Community 3", "Bar 1", "Bar 2", "Nook 1", "Nook 2",
];

// Default seat grid for venues that haven't configured their own layout.
const makeSeats = () =>
  seatNames.map((name, i) => ({
    id: `s${i + 1}`,
    name,
    type: name.split(" ")[0] ?? "Seat",
    status: "available",
    x: 12 + (i % 3) * 31,
    y: 12 + Math.floor(i / 3) * 25,
  }));

function toMarker(lat, lon) {
  const x = Math.round(((lon - MUMBAI_BBOX.west) / (MUMBAI_BBOX.east - MUMBAI_BBOX.west)) * 100);
  const y = Math.round(((MUMBAI_BBOX.north - lat) / (MUMBAI_BBOX.north - MUMBAI_BBOX.south)) * 100);
  return { x: Math.min(95, Math.max(5, x)), y: Math.min(95, Math.max(5, y)) };
}

function amenitiesFromTags(tags) {
  const amenities = ["Food"];
  if (["wlan", "yes", "wifi"].includes(tags.internet_access)) amenities.unshift("Wi-Fi");
  if (tags.air_conditioning === "yes") amenities.push("AC");
  return amenities;
}

async function fetchMumbaiCafes() {
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Querying Overpass mirror: ${url}...`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "WorkSpot-seeder/1.0 (cafe workspace booking prototype)",
        },
        body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
        signal: AbortSignal.timeout(60000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.elements?.length > 0) return data.elements;
      } else {
        console.warn(`  HTTP ${response.status} from mirror.`);
      }
    } catch {
      console.warn("  Mirror failed or timed out. Trying next mirror...");
    }
  }
  return null;
}

async function cleanExistingCafes() {
  const snapshot = await getDocs(collection(db, "cafes"));
  console.log(`Deleting ${snapshot.size} existing docs from 'cafes'...`);
  let deleted = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(docSnap.ref);
    deleted++;
  }
  console.log(`  Deleted ${deleted}.\n`);
}

async function seed() {
  console.log("WorkSpot — Mumbai café seeder (OpenStreetMap)\n");

  const elements = await fetchMumbaiCafes();
  if (!elements) {
    console.error("All Overpass mirrors failed. Nothing was changed; try again in a few minutes.");
    process.exit(1);
  }

  const cafesToSeed = [];
  const seen = new Set();
  let skippedNotWorkFriendly = 0;

  for (const el of elements) {
    const name = el.tags?.name?.trim();
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!name || name.length < 2 || !lat || !lon) continue;
    if (NOT_WORK_FRIENDLY.test(name)) {
      skippedNotWorkFriendly++;
      continue;
    }

    const area = nearestArea(lat, lon);
    const slug = slugify(name, area);
    if (!slug || seen.has(slug) || CURATED_SLUGS.has(slug)) continue;
    seen.add(slug);

    const street = [el.tags["addr:housenumber"], el.tags["addr:street"]].filter(Boolean).join(", ");
    cafesToSeed.push({
      slug,
      name,
      area,
      address: street ? `${street}, ${area}, Mumbai` : `${area}, Mumbai`,
      distance: Math.round(haversineKm(REFERENCE.lat, REFERENCE.lon, lat, lon) * 10) / 10,
      rating: 0,
      reviews: 0,
      price: 149,
      image: "",
      amenities: amenitiesFromTags(el.tags),
      availability: "Seats available",
      vibe: "Neighbourhood café",
      description: `A café in ${area}, Mumbai. Amenities and photos are still being verified by the venue.`,
      hours: el.tags.opening_hours || "Hours not listed",
      marker: toMarker(lat, lon),
      seats: makeSeats(),
      lat,
      lon,
      source: "osm",
    });
  }

  console.log(
    `${elements.length} OSM cafés fetched; ${cafesToSeed.length} kept (${skippedNotWorkFriendly} tea stalls/juice bars/etc. skipped).\n`
  );

  if (clean) await cleanExistingCafes();

  console.log(`Uploading ${cafesToSeed.length} cafés to Firestore project '${firebaseConfig.projectId}'...\n`);

  let seeded = 0;
  let failed = 0;
  for (const cafe of cafesToSeed) {
    try {
      await setDoc(doc(db, "cafes", cafe.slug), cafe, { merge: true });
      seeded++;
      if (seeded % 25 === 0) console.log(`  ${seeded}/${cafesToSeed.length}`);
    } catch (err) {
      failed++;
      console.warn(`  Failed to seed ${cafe.name}: ${err.message}`);
    }
  }

  console.log(`\nSeeded ${seeded} cafés into '${firebaseConfig.projectId}'.${failed ? ` ${failed} failed.` : ""}`);
  process.exit(failed ? 1 : 0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
