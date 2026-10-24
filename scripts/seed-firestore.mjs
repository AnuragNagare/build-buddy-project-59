/**
 * WorkSpot — Mumbai Café Fetcher via OpenStreetMap Overpass API
 *
 * Fetches real cafés across all Mumbai neighbourhoods — completely free, no API key needed.
 *
 * Usage:
 *   bun run db:seed
 *
 * What it does:
 *  1. Queries OpenStreetMap Overpass API for all cafes in Mumbai
 *  2. Filters to those with real names and coordinates
 *  3. Seeds all of them into your Firestore `cafes` collection
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

// Mumbai neighbourhoods covered
const MUMBAI_BBOX = {
  south: 18.87,
  west: 72.77,
  north: 19.28,
  east: 72.99,
};

// Overpass QL query — fetches all nodes/ways tagged as amenity=cafe in Mumbai
const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  node["amenity"="cafe"]
    (${MUMBAI_BBOX.south},${MUMBAI_BBOX.west},${MUMBAI_BBOX.north},${MUMBAI_BBOX.east});
  way["amenity"="cafe"]
    (${MUMBAI_BBOX.south},${MUMBAI_BBOX.west},${MUMBAI_BBOX.north},${MUMBAI_BBOX.east});
);
out center tags;
`;

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Mumbai neighbourhood map based on approximate lat/lon buckets
function detectArea(lat, lon) {
  if (lat > 19.05 && lon < 72.85) return "Bandra West";
  if (lat > 19.05 && lon >= 72.85) return "Bandra East / BKC";
  if (lat > 19.10 && lon < 72.84) return "Andheri West";
  if (lat > 19.10 && lon >= 72.84) return "Andheri East";
  if (lat > 19.14) return "Goregaon / Malad";
  if (lat > 19.07 && lat <= 19.10) return "Juhu / Vile Parle";
  if (lat > 18.99 && lat <= 19.05 && lon < 72.84) return "Bandra West";
  if (lat > 18.99 && lat <= 19.05) return "Dharavi / Sion";
  if (lat > 18.96 && lat <= 18.99 && lon > 72.87) return "Powai";
  if (lat > 18.96 && lat <= 18.99) return "Dadar / Matunga";
  if (lat > 18.93 && lat <= 18.96 && lon < 72.84) return "Worli / Lower Parel";
  if (lat > 18.93 && lat <= 18.96) return "Parel / Sewri";
  if (lat > 18.90 && lat <= 18.93) return "Prabhadevi / Elphinstone";
  if (lon < 72.82) return "Malad / Borivali";
  return "South Mumbai";
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

const seatNames = [
  "Window 1", "Window 2", "Window 3",
  "Community 1", "Community 2", "Community 3",
  "Bar 1", "Bar 2",
  "Nook 1", "Nook 2"
];

const makeSeats = (offset = 0) =>
  seatNames.map((name, i) => ({
    id: `s${i + 1}`,
    name,
    type: name.split(" ")[0] ?? "Seat",
    status: (i + offset) % 5 === 2 ? "unavailable" : (i + offset) % 7 === 4 ? "not-offered" : "available",
    x: 12 + (i % 3) * 31,
    y: 12 + Math.floor(i / 3) * 25,
  }));

// Map position on the mock map (as percentage) from real lat/lon
function toMarker(lat, lon) {
  const x = Math.round(((lon - MUMBAI_BBOX.west) / (MUMBAI_BBOX.east - MUMBAI_BBOX.west)) * 100);
  const y = Math.round(((MUMBAI_BBOX.north - lat) / (MUMBAI_BBOX.north - MUMBAI_BBOX.south)) * 100);
  return { x: Math.min(95, Math.max(5, x)), y: Math.min(95, Math.max(5, y)) };
}

// Placeholder images (Unsplash, royalty-free café interiors)
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
];

function pickImage(index) {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}

async function fetchMumbaiCafes() {
  console.log("🗺️  Querying OpenStreetMap Overpass API for Mumbai cafés...");
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.elements;
}

async function seed() {
  console.log("🚀 WorkSpot — Mumbai Real Café Seeder (OpenStreetMap)\n");

  let elements;
  try {
    elements = await fetchMumbaiCafes();
  } catch (err) {
    console.error("Failed to fetch from Overpass API:", err.message);
    process.exit(1);
  }

  console.log(`📦 Raw results from OpenStreetMap: ${elements.length} entries`);

  // Filter: must have a real name and coordinates
  const valid = elements.filter((el) => {
    const name = el.tags?.name;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    return name && name.trim().length > 1 && lat && lon;
  });

  console.log(`✅ Valid cafés with names and coordinates: ${valid.length}`);

  // Deduplicate by slug
  const seen = new Set();
  const unique = [];
  for (const el of valid) {
    const slug = slugify(el.tags.name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    unique.push({ el, slug });
  }

  console.log(`🗃️  Unique cafés to seed: ${unique.length}\n`);
  console.log(`📡 Uploading to Firestore project: ${firebaseConfig.projectId}...\n`);

  let seeded = 0;
  let failed = 0;

  for (let i = 0; i < unique.length; i++) {
    const { el, slug } = unique[i];
    const tags = el.tags;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;

    const name = tags.name.trim();
    const area = detectArea(lat, lon);
    const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(", ");
    const address = street
      ? `${street}, ${area}, Mumbai`
      : `${area}, Mumbai`;

    // Distance from BKC (geographic center of Mumbai's business district)
    const BKC_LAT = 19.0596;
    const BKC_LON = 72.8656;
    const dLat = lat - BKC_LAT;
    const dLon = lon - BKC_LON;
    const distance = Math.round(Math.sqrt(dLat * dLat + dLon * dLon) * 111 * 10) / 10;

    const cafeDoc = {
      name,
      area,
      address,
      distance,
      rating: parseFloat((4.0 + Math.random() * 0.9).toFixed(1)),
      reviews: Math.floor(20 + Math.random() * 500),
      price: 0, // hidden for now
      image: pickImage(i),
      amenities: ["Wi-Fi", "Power", ...(Math.random() > 0.5 ? ["AC"] : []), ...(Math.random() > 0.5 ? ["Food"] : []), ...(Math.random() > 0.7 ? ["Quiet"] : [])],
      availability: `${Math.floor(2 + Math.random() * 8)} seats open`,
      vibe: ["Bright & social", "Calm & focused", "Warm & lively", "Creative & quiet", "Friendly & relaxed", "Premium & professional"][i % 6],
      description: tags.description || `A work-friendly café in ${area}, Mumbai. ${tags.opening_hours ? `Open ${tags.opening_hours}.` : ""}`.trim(),
      hours: tags.opening_hours || "8:00 AM – 9:00 PM IST",
      marker: toMarker(lat, lon),
      seats: makeSeats(i),
      osmId: el.id,
      osmType: el.type,
      lat,
      lon,
    };

    try {
      const ref = doc(db, "cafes", slug);
      await setDoc(ref, cafeDoc, { merge: true });
      seeded++;
      if (seeded % 10 === 0 || seeded <= 5) {
        console.log(`  ✓ [${seeded}/${unique.length}] ${name} — ${area}`);
      }
    } catch (err) {
      failed++;
      console.warn(`  ✗ Failed to seed: ${name} — ${err.message}`);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   ${seeded} cafés seeded into Firestore`);
  if (failed > 0) console.log(`   ${failed} failed`);
  console.log(`\n🎉 WorkSpot Mumbai is live with real OpenStreetMap data!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
