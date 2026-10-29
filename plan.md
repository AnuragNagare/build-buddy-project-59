# WorkSpot — Floor-Plan Seat Booking, Café Layout Editor & In-App Booking Alerts

Supersedes the earlier "Café List Fix & Generic Images" plan (done in commit `929d3db`, still in git history).

## 1. What was asked

1. The seat-picking section on `/cafes/$slug` looks boring. Make it look like the supplied design
   (`WorkSpot Café Seating Dashboard.png`) using the supplied top-down floor plan (`cafe-floor-plan-seating.jpg`).
2. When a café registers, it should see this same floor plan and be able to **add or remove seats** to match its real layout.
3. When a user books, check whether the café is **associated with WorkSpot** (a partner). If yes, send a **message/notification inside the app only** to that café.

## 2. What the design contains (analysis)

**Mockup page (`WorkSpot Café Seating Dashboard.png`, 1052×1494)**
- Same page skeleton we already have: hero + side photo + "Open directions" tile, title/rating/Pro badge, amenities, the
  booking sidebar, house rules. The hero is the generic "Representative photo" we already show, with its caption.
- **"Choose a seat" section:** icon + heading + one-line subtitle, then a card with a **status legend row**
  (Available / Unavailable / Selected / Not offered) and the **floor-plan image** with seat markers on top.
- **Sidebar, below the booking card:** a "Seating legend" card (status meanings) and a "Seating types" card
  (Single seat, 2-seater table, 4-seater table, Communal table, Booth).
- **Rules card:** "Café seating rules" with an icon, replacing today's plain "House rules" box.

**Floor plan (`cafe-floor-plan-seating.jpg`, 542×434)**
- A top-down illustration with the Bar/Counter at the top, an Entrance on the left, and a Café Counter at the bottom.
- Seat markers are small circles at each chair: green = available, dark green with a ring = selected, grey = not offered, red = unavailable.
- Layout: 2 banquettes on the left (3 seats each), 2 long communal tables in the centre (8 seats each), 3 round tables on the right
  (4 seats each), 3 booths at the bottom (2 seats each), plus 2 lounge chairs. Roughly **40 individually bookable chairs**
  (today's default is 10 abstract seats on a plain grid).
- The markers in the file are part of the picture. The app has to draw its own live markers on top, so we need a clean version of the layout without baked-in dots (Q2).

**Current code (what we build on)**
- `SeatGrid` in `src/components/booking-ui.tsx` draws each seat as a labelled box at `x/y` percentages on a plain floor.
  `Seat` already has `id, name, type, status, x, y`, so positioning on an image needs no data-model change for x/y.
- Admin already has a seat editor (`AdminSeatsTab` in `admin.tsx`: add/rename/delete seats, Save Floor Plan).
- Manager "Seats & availability" has only on/off toggles that don't persist, and "Add seat" does nothing useful.
- Partner registration collects only a seat **count** (`seatsCount`). On approval, seats are auto-generated on a plain grid.
- Seat `status` is static data. It is **not** derived from existing bookings. Only a Firestore transaction blocks double-booking at confirm time.
- There is **no notification system**, no café-owner login (the manager page is a demo with a hardcoded café), and no link from a café to an owner.

## 3. Part A — Floor-plan seat picker (customer side)

- **A1. Assets.** Add the floor-plan image to `src/assets/` (replacing the baked-in dots, see Q2) as the default layout.
- **A2. Data model** (additive, in `workspot-data.ts`):
  - `Cafe.floorPlan?: { image: string; aspect: number }`. If missing, use the default plan.
  - `Seat.type` becomes a defined set: `single | table2 | table4 | communal | booth`. Add optional `tableId` and `capacity` for grouping.
  - Keep `x/y` as percentages of the plan image so layouts scale on any screen.
- **A3. New `FloorPlanSeatPicker`** (replaces the body of `SeatGrid`, same props so callers don't change): image as background,
  absolutely positioned circular markers, hover tooltip (name, type, status), keyboard focus + `aria-label`, selected ring,
  mobile: horizontal pinch/scroll container with a minimum width so markers stay tappable.
- **A4. Live availability.** Mark a seat Unavailable when an `upcoming` booking exists for the same café, seat, date and time
  window (overlapping duration), so the map reflects the date/time chosen in the sidebar. Today it ignores bookings.
- **A5. Page layout.** On `/cafes/$slug`: new "Choose a seat" header, status legend row inside the card, sidebar gets "Seating legend"
  and "Seating types" cards, "Café seating rules" card. Keep the existing sticky reserve card and mobile bottom bar.
- **A6. Cafés without a custom layout** (OSM-seeded, new partners) show the default floor plan with the default seat set, plus a small note
  that the layout is representative until the café customises it.

## 4. Part B — Café layout editor (partner side)

- **B1. Editor component** `FloorPlanEditor`, shared by `/manager` (Seats tab) and `/admin` (Seats tab):
  - Shows the café's floor plan with draggable seat markers.
  - **Add seat** (choose type, drops onto the plan), **remove seat**, rename, change type, toggle "offered / not offered".
  - Seat count and "N seats open" update on save. Auto-numbered names ("Table 3 · Seat 2").
  - Validation: at least 1 offered seat, unique ids, and a warning when removing a seat that has upcoming bookings (not deleting those bookings).
  - Save writes `seats` to the café (Firestore `cafes/{slug}` + localStorage fallback via `upsertCafeAdmin`).
- **B2. Registration.** On `/partner/register` replace the plain "seats count" with a layout step: start from the default plan, add/remove seats,
  and save it as `layoutSeats` on the `VendorApplication`. On approval, `approveAndPublishVendorCafe` uses those seats instead of generating a plain grid.
- **B3. Manager Seats tab** gets the editor in place of the non-working toggle list. Pricing/availability panel stays.
- **B4. Own floor-plan upload** (a café's real plan image) is **out of scope** for now. The default plan is used until a later upload feature (Q3).

## 5. Part C — In-app booking notifications to partner cafés

- **C1. "Associated with us" check.** A café is a partner if it is not OSM-only (`source !== "osm"`) and it is either a curated café or was
  created through an approved `VendorApplication`. Add an explicit `partner: true` and `ownerId`/`contactEmail` to `Cafe` and set them on approval and for the curated list.
- **C2. Notification record** (Firestore `notifications` collection, localStorage fallback like the rest of the app):
  `{ id, cafeSlug, type: "booking_created" | "booking_cancelled", bookingId, seatName, date, time, duration, guestPhone, createdAt, read }`.
- **C3. Trigger.** After `addBooking` succeeds in `booking-store.tsx` (and after `cancelBooking`), if the café is a partner, create the notification.
  Non-partner (OSM) cafés: booking still works, but no notification is sent and the confirmation page says
  "This café isn't on WorkSpot yet — we'll let them know" or similar copy (Q5).
- **C4. Where cafés see it.** New "Notifications" area in `/manager`: bell + unread count in the sidebar, a list (newest first),
  mark as read, and a toast when a new one arrives while the page is open (Firestore realtime listener when configured, polling/`storage` event in demo mode).
- **C5. Admin visibility.** Optional: admin Bookings tab shows whether each booking triggered a notification.
- **Limits of "in-app only".** The café only sees the alert when someone opens the manager page. There is no email/SMS/push (Q4).

## 6. Order of work and verification

1. Part A (picker + page layout + live availability), then check visually against the mockup at desktop and mobile widths.
2. Part B (editor, then registration, then manager tab).
3. Part C (data + trigger + manager UI).
4. Checks per part: `bun run test` (add tests for availability overlap, partner check and notification creation), lint,
   and a browser pass: book a seat as a customer, see the seat turn red, see the notification in `/manager` for a partner café and none for an OSM café.
- Commit per part so each can be pushed and reverted on its own (the repo is synced to Lovable; no history rewriting).

## 7. Out of scope

Real café-owner login/accounts, email/SMS/WhatsApp/push notifications, per-café floor-plan image upload, drag-to-draw custom floor plans,
table-level (group) booking and payments.

## 8. Decisions (from the answers) and build status

- Q1: book one or **several single chairs** in one reservation (max 6); no whole-table booking. One booking holds a `seatIds` list.
- Q2: floor plan = `Modern Café Floor Plan with Greenery.png`, saved as `src/assets/workspot-floor-plan.jpg`; 42 chair positions checked against the image.
- Q3: every café uses this one layout for now (legacy 10-seat cafés are swapped to it when loaded).
- Q4: in-app notifications only; simple owner login = registered phone + 4-digit PIN (stored as a SHA-256 hash).
- Q5: non-partner (OSM) cafés stay bookable; the confirmation page text is unchanged.
- Q6: partner = any café not tagged `source: "osm"` (to be tightened later).
- Q7: seats show unavailable only when an upcoming booking overlaps the chosen date and time.

Built: Part A (picker, legend and types cards, live availability), Part B (editor in registration, `/manager`, admin),
Part C (notifications and owner login). Not done: removing a seat that has upcoming bookings gives no warning yet;
browser visual check of the new page layout is still pending.

## 9. Open questions (answered above)

- **Q1. Book a chair or a whole table?** The current rule is one booking = one person = one seat, so the plan above books individual chairs.
  Do you also want "book the whole table" (e.g. 4-seater for a team)?
- **Q2. Floor-plan file.** The supplied JPG (542×434) is low resolution and has green/grey dots painted into the picture. Do you have a larger version **without** the dots?
  If not, I can use it as is and cover/replace the dots with live markers, but it will look soft on big screens.
- **Q3. One layout for all cafés?** For now every café shows this same plan and only the number/types of seats differ. Is that acceptable until cafés can upload their own plan,
  or must the real-café entries (Third Wave, Subko, etc.) each get a different layout?
- **Q4. Notifications.** Is in-app only (shown inside `/manager`) enough for now? And since there is no café login yet, should `/manager` keep a café selector for the demo,
  or do you want a simple owner login (e.g. the phone/email from registration) in this round?
- **Q5. Non-partner (OSM) cafés.** Should customers still be able to book them? If yes, what should the confirmation page say about the café not being notified?
- **Q6. Which cafés are "associated with us"?** My proposal: the 12 curated cafés plus anything approved from `/partner/register`. Is that right, or should only paid Pro partners get notifications?
- **Q7. Seat availability by time.** OK to show a seat as unavailable only if it is booked for an overlapping time on the chosen date (needs the booking list loaded from Firestore on the café page)?
