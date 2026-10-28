# WorkSpot — Café List Fix & Generic Café Images Plan

Supersedes the earlier "Real Data & Free Reservation" plan (still in git history).

## 1. Problems

1. **Explore shows only 2 cafés for "Andheri"** ("Citrus Corner", "Sequel"). Neither matches
   `src/lib/workspot-data.ts` (the code has 6 Andheri West cafés; "Citrus Corner" is a retired legacy slug).
2. **Café photos are Unsplash stock images** that do not look like the real venues. Real photos will come
   from cafés themselves when they register (`/partner/register`), so for now we need one consistent,
   honest fallback.

## 2. Root cause (hypothesis — verify in step A1 before changing code)

`getLiveCafes()` in `src/lib/firebase-service.ts` returns the Firestore `cafes` collection **as-is** whenever it
is non-empty. It never merges with the code list, and the legacy-slug cleanup only runs on the localStorage
path. A stale seed in Firestore (old placeholder cafés, different ratings/distances from the code) therefore
hides the current list. `Explore` then filters that list by name/area text, radius and amenities, so only
what is in Firestore can ever show up.

## 3. Part A — Fix the café list

- **A1. Verify (read-only).** List the docs in Firestore `cafes` (slug, name, area, distance, image) and confirm
  stale docs such as `citrus-corner` exist. No writes.
- **A2. Merge strategy in `getLiveCafes()` / `getLiveCafe()`.**
  - Base = code list (`cafes`), override per slug by the Firestore doc, plus any extra Firestore docs
    (admin-approved vendor cafés).
  - Drop legacy slugs (`LEGACY_SLUGS`) from the Firestore result too, not only from localStorage.
  - Keep the existing fallback to local data when Firestore is unconfigured or errors.
  - Keep mock domain data isolated from booking state (per AGENTS.md); the merge lives in the service layer.
- **A3. Clean the stale Firestore docs.** Delete legacy-slug docs and re-run `bun run db:seed` so Firestore matches
  the current list. Destructive and shared, so it needs explicit approval first (see Q2).
- **A4. More Andheri cafés.** Add more venues to the seed/data. The seed script currently has about 12 hand-picked
  cafés, and its OpenStreetMap fetch is capped at 60 results with random distances and no photos. Options in Q1.
- **A5. Search quality (small).** Make the text search match area synonyms ("Andheri" matches "Andheri West/East",
  "Lokhandwala", "Oshiwara") and confirm the 5 km default radius isn't hiding valid cafés.

## 4. Part B — Generic café images (interim)

Goal: every café without a real, café-supplied photo shows a neutral, consistent placeholder. No scraping of
Google or other sites.

- **B1. Image pool.** Use the 4 existing local assets (`src/assets/workspot-cafe-1..4.jpg`, currently imported
  but unused) as the generic set. Optionally add a few more licensed or free-to-use images.
- **B2. Resolver helper** (in `src/lib/workspot-data.ts`, next to the data): `getCafeImage(cafe)`.
  - Returns `cafe.image` if it's a real uploaded photo.
  - Otherwise picks a generic image deterministically from a hash of the slug, so a café always gets the same
    picture and neighbours don't all look identical.
- **B3. Data change.** Remove the Unsplash stock URLs from the hand-picked cafés (and from the seed script's
  fallback list), leaving `image` empty until a café uploads one. Add an optional `imageIsGeneric` flag if needed.
- **B4. Use the helper everywhere an image renders:** `cafe-card.tsx`, `cafes.$slug.tsx` (hero + side image),
  `checkout.tsx`, `account.bookings.tsx`, `index.tsx` hero, and the admin/manager previews.
- **B5. Honesty label.** A small "Representative photo" caption/badge on generic images, so users don't think they
  are the venue. Hidden once a real photo exists (see Q4).
- **B6. Hook for real photos (later).** The partner form already takes a cover image URL. Real uploads (Firebase
  Storage) are a separate task; this plan only makes sure `image` set on approval wins over the generic fallback.

## 5. Verification

- Explore with `Andheri` shows all Andheri cafés in code (6+), none of the legacy ones.
- Firestore unconfigured (demo mode) still works, and Firestore configured and empty still works.
- Admin-approved vendor café still appears and uses its uploaded `coverImage`.
- Every card, detail page, checkout, bookings and confirmation view shows an image or the generic fallback; no
  broken images.
- `bun run test` (routing tests) and `bun run lint` pass; check `/explore?q=Andheri` in the browser.

## 6. Out of scope

Google Places / Google Images fetching, real photo uploads and storage, a real map (Mapbox or Google), and
live seat availability from existing bookings.

## 7. Open questions

- **Q1. Where do the extra Andheri cafés come from?** (a) a list you give me, (b) the OpenStreetMap seeder
  (free, but names and addresses only, no photos or amenities, and quality varies), or (c) I add a curated set and
  you review it. Should this cover Andheri only, or all of Mumbai?
- **Q2. May I delete stale docs in your Firestore project and re-seed it?** If not, the merge in A2 hides them in
  the app but they stay in the database.
- **Q3. Should OSM-seeded cafés be bookable?** They have no real seat layouts or partner agreement, so the options
  are to mark them "Not yet partnered / listing only" or give them a default seat grid like today.
- **Q4. Generic photos:** replace all existing Unsplash photos, including on the hand-picked real cafés? Show a
  "Representative photo" label, or none?
- **Q5. Image source:** is using the 4 existing assets enough, or do you have your own generic images to add?
