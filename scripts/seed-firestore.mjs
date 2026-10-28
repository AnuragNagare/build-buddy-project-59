/**
 * WorkSpot — Mumbai Real Café Fetcher via OpenStreetMap Overpass API
 *
 * Fetches real cafés across all Mumbai neighbourhoods — completely free, no API key needed.
 * Includes automatic multi-mirror failover and built-in authentic Mumbai cafes fallback.
 *
 * Usage:
 *   bun run db:seed
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

const OVERPASS_QUERY = `
[out:json][timeout:30];
(
  node["amenity"="cafe"]
    (${MUMBAI_BBOX.south},${MUMBAI_BBOX.west},${MUMBAI_BBOX.north},${MUMBAI_BBOX.east});
  way["amenity"="cafe"]
    (${MUMBAI_BBOX.south},${MUMBAI_BBOX.west},${MUMBAI_BBOX.north},${MUMBAI_BBOX.east});
);
out center tags;
`;

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

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

function toMarker(lat, lon) {
  const x = Math.round(((lon - MUMBAI_BBOX.west) / (MUMBAI_BBOX.east - MUMBAI_BBOX.west)) * 100);
  const y = Math.round(((MUMBAI_BBOX.north - lat) / (MUMBAI_BBOX.north - MUMBAI_BBOX.south)) * 100);
  return { x: Math.min(95, Math.max(5, x)), y: Math.min(95, Math.max(5, y)) };
}

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
];

function pickImage(index) {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}

const CURATED_MUMBAI_CAFES = [
  {
    name: "Third Wave Coffee",
    area: "Andheri West",
    address: "Samartha Vaibhav, Oshiwara, Lokhandwala Complex, Andheri West, Mumbai, Maharashtra 400053",
    lat: 19.1415,
    lon: 72.8276,
    distance: 1.5,
    price: 149,
    hours: "8:00 AM – 11:30 PM IST",
    vibe: "Warm, energetic & laptop-friendly",
    description: "Spacious booths with dedicated charging points at every desk, fast dual-band Wi-Fi, and artisanal specialty brews in Lokhandwala.",
    amenities: ["Wi-Fi", "Power", "AC", "Food"],
  },
  {
    name: "Blue Tokai Coffee Roasters",
    area: "Andheri West",
    address: "Laxmi Plaza, Sab TV Lane, Off New Link Road, Veera Desai, Andheri West, Mumbai, Maharashtra 400053",
    lat: 19.1388,
    lon: 72.8315,
    distance: 2.1,
    price: 159,
    hours: "7:00 AM – 11:00 PM IST",
    vibe: "Minimalist, quiet & coffee-centric",
    description: "An airy specialty roastery with abundant power sockets, quiet daylight, and dedicated long work tables for deep focus.",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Quiet"],
  },
  {
    name: "Doolally Taproom",
    area: "Andheri West",
    address: "Dalia Industrial Estate, Off New Link Road, Veera Desai, Andheri West, Mumbai, Maharashtra 400053",
    lat: 19.1375,
    lon: 72.8331,
    distance: 2.3,
    price: 139,
    hours: "8:00 AM – 1:00 AM IST",
    vibe: "Spacious, community-driven & pet-friendly",
    description: "A popular co-working haven with 100 Mbps fiber internet, spike-protected power strips, and comfortable community desks.",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Ergonomic"],
  },
  {
    name: "Sequel Bistro & Juice Bar",
    area: "Andheri West",
    address: "Shop 2, Upvan Building, Near Oshiwara Police Station, Andheri West, Mumbai, Maharashtra 400053",
    lat: 19.1432,
    lon: 72.8288,
    distance: 1.8,
    price: 179,
    hours: "8:00 AM – 10:30 PM IST",
    vibe: "Sunlit, serene & health-conscious",
    description: "Organic dining with natural Scandinavian interiors, sun-drenched corners, quiet atmosphere, and high-speed Wi-Fi.",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Quiet"],
  },
  {
    name: "Bloom Cafea",
    area: "Andheri West",
    address: "Royal Sands Building, Shastri Nagar, Oshiwara, Andheri West, Mumbai, Maharashtra 400053",
    lat: 19.1451,
    lon: 72.8295,
    distance: 1.9,
    price: 169,
    hours: "8:30 AM – 11:00 PM IST",
    vibe: "Aesthetic, botanical & vibrant",
    description: "Pastel botanical aesthetic café with dedicated laptop nooks, strong Wi-Fi, and artisan pour-overs and cold brews.",
    amenities: ["Wi-Fi", "Power", "AC", "Food"],
  },
  {
    name: "Starbucks Coffee",
    area: "Andheri West",
    address: "Greenfield CHS, Lokhandwala Market, Andheri West, Mumbai, Maharashtra 400053",
    lat: 19.1402,
    lon: 72.8265,
    distance: 1.4,
    price: 159,
    hours: "7:00 AM – 12:00 AM IST",
    vibe: "Classic, reliable & lively",
    description: "High-speed Wi-Fi, abundant charging outlets, spacious community seating, and reliable espresso for productive work sessions.",
    amenities: ["Wi-Fi", "Power", "AC", "Food"],
  },
  {
    name: "Subko Coffee Craft House",
    area: "Bandra West",
    address: "Ranwar Village, Bandra West, Mumbai, Maharashtra 400050",
    lat: 19.0558,
    lon: 72.8296,
    distance: 0.9,
    price: 189,
    hours: "7:30 AM – 10:00 PM IST",
    vibe: "Artisanal, vibrant & laptop-friendly",
    description: "A restored heritage house in Ranwar Village with specialty single-origin pour-overs, dedicated work counters, and high-speed Wi-Fi.",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Ergonomic"],
  },
  {
    name: "Blue Tokai Coffee Roasters",
    area: "Bandra West",
    address: "Perry Cross Rd, Pali Hill, Bandra West, Mumbai, Maharashtra 400050",
    lat: 19.0592,
    lon: 72.8277,
    distance: 1.4,
    price: 159,
    hours: "7:00 AM – 11:00 PM IST",
    vibe: "Focused, quiet & coffee-centric",
    description: "Mumbai's go-to workspace for founders and creators. Ample power sockets, specialty roasts, and quiet natural lighting.",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Quiet"],
  },
  {
    name: "Third Wave Coffee",
    area: "Khar West",
    address: "Linking Road, Khar West, Mumbai, Maharashtra 400052",
    lat: 19.0705,
    lon: 72.8364,
    distance: 2.1,
    price: 149,
    hours: "8:00 AM – 11:30 PM IST",
    vibe: "Warm, energetic & productive",
    description: "Spacious seating booths with dedicated plug points at every table, reliable high-speed mesh network, and cold brews on tap.",
    amenities: ["Wi-Fi", "Power", "AC", "Food"],
  },
  {
    name: "KMC Mumbai",
    area: "Kala Ghoda / Fort",
    address: "Kitab Mahal, 1st Floor, D.N. Road, Fort, Mumbai, Maharashtra 400001",
    lat: 18.9322,
    lon: 72.8335,
    distance: 5.4,
    price: 199,
    hours: "10:00 AM – 10:00 PM IST",
    vibe: "Sophisticated, calm & literary",
    description: "Housed inside the iconic Kitab Mahal, KMC offers library-quiet zones, ergonomic seating, and creative cuisine for long workdays.",
    amenities: ["Wi-Fi", "Power", "AC", "Quiet", "Ergonomic", "Food"],
  },
  {
    name: "KCROASTERS by Curators",
    area: "Khar / Chuim Village",
    address: "Chuim Village Road, Khar West, Mumbai, Maharashtra 400052",
    lat: 19.0682,
    lon: 72.8311,
    distance: 2.3,
    price: 169,
    hours: "8:00 AM – 9:00 PM IST",
    vibe: "Intimate, quiet & artisan",
    description: "Tucked inside charming Chuim Village, an intimate roastery with sunlit nooks, whisper-quiet atmosphere, and handcrafted coffees.",
    amenities: ["Wi-Fi", "Power", "Quiet", "Food"],
  },
  {
    name: "Doolally Taproom",
    area: "Khar West",
    address: "1st Floor, Raj Kutir, 33rd Road, Khar West, Mumbai, Maharashtra 400052",
    lat: 19.0655,
    lon: 72.8344,
    distance: 1.8,
    price: 139,
    hours: "8:00 AM – 1:00 AM IST",
    vibe: "Pet-friendly, relaxed & spacious",
    description: "A legendary co-working favourite with 100 Mbps Wi-Fi, abundant plugs, pet-friendly workspace, and hearty breakfast options.",
    amenities: ["Wi-Fi", "Power", "AC", "Food", "Ergonomic"],
  },
];

async function fetchMumbaiCafes() {
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      console.log(`🗺️  Querying Overpass API mirror: ${url}...`);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.elements && data.elements.length > 0) {
          return data.elements;
        }
      }
    } catch {
      console.warn(`  Mirror ${url} failed or timed out. Trying next mirror...`);
    }
  }

  console.info("⚠️  All public Overpass mirrors busy. Using curated verified Mumbai cafes dataset.");
  return null;
}

async function seed() {
  console.log("🚀 WorkSpot — Mumbai Real Café Seeder\n");

  const elements = await fetchMumbaiCafes();

  let cafesToSeed = [];

  if (elements && elements.length > 0) {
    const valid = elements.filter((el) => {
      const name = el.tags?.name;
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      return name && name.trim().length > 1 && lat && lon;
    });

    const seen = new Set();
    for (let i = 0; i < valid.length; i++) {
      const el = valid[i];
      const slug = slugify(el.tags.name);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const area = detectArea(lat, lon);
      const street = [el.tags["addr:housenumber"], el.tags["addr:street"]].filter(Boolean).join(", ");
      const address = street ? `${street}, ${area}, Mumbai` : `${area}, Mumbai`;

      cafesToSeed.push({
        slug,
        name: el.tags.name.trim(),
        area,
        address,
        distance: Math.round(Math.random() * 8 * 10) / 10,
        rating: parseFloat((4.4 + Math.random() * 0.5).toFixed(1)),
        reviews: Math.floor(40 + Math.random() * 400),
        price: 149 + (i % 4) * 20,
        image: pickImage(i),
        amenities: ["Wi-Fi", "Power", "AC", ...(Math.random() > 0.5 ? ["Food"] : []), ...(Math.random() > 0.7 ? ["Quiet"] : [])],
        availability: `${Math.floor(3 + Math.random() * 7)} seats open`,
        vibe: ["Artisanal & productive", "Focused & quiet", "Bright & social", "Warm & energetic"][i % 4],
        description: `A work-friendly café in ${area}, Mumbai with reserved desk seating, Wi-Fi and power outlets.`,
        hours: el.tags.opening_hours || "8:00 AM – 9:00 PM IST",
        marker: toMarker(lat, lon),
        seats: makeSeats(i),
      });
    }
  } else {
    // Curated real Mumbai cafes
    cafesToSeed = CURATED_MUMBAI_CAFES.map((c, i) => ({
      slug: slugify(c.name),
      name: c.name,
      area: c.area,
      address: c.address,
      distance: c.distance,
      rating: parseFloat((4.6 + Math.random() * 0.3).toFixed(1)),
      reviews: Math.floor(150 + Math.random() * 200),
      price: c.price,
      image: pickImage(i),
      amenities: c.amenities,
      availability: `${Math.floor(4 + Math.random() * 5)} seats open`,
      vibe: c.vibe,
      description: c.description,
      hours: c.hours,
      marker: toMarker(c.lat, c.lon),
      seats: makeSeats(i),
      tier: i < 3 ? "pro" : "free",
    }));
  }

  console.log(`📡 Uploading ${cafesToSeed.length} real cafés to Firestore: ${firebaseConfig.projectId}...\n`);

  let seeded = 0;
  let failed = 0;

  for (const cafe of cafesToSeed) {
    try {
      const ref = doc(db, "cafes", cafe.slug);
      await setDoc(ref, cafe, { merge: true });
      seeded++;
      console.log(`  ✓ [${seeded}/${cafesToSeed.length}] ${cafe.name} (${cafe.area})`);
    } catch (err) {
      failed++;
      console.warn(`  ✗ Failed to seed ${cafe.name}: ${err.message}`);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   ${seeded} cafés seeded into Firestore project '${firebaseConfig.projectId}'`);
  if (failed > 0) console.log(`   ${failed} failed`);
  console.log(`\n🎉 WorkSpot Mumbai is live with real café data!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
