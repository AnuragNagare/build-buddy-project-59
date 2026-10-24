# WorkSpot — Super Admin Panel Implementation Plan

This document outlines the step-by-step roadmap to implement a comprehensive **Super Admin Panel** for WorkSpot. The admin panel empowers the platform administrator to monitor all customer bookings, analyze revenue, manage café profiles, edit images, adjust seating floor plans, and moderate reviews.

---

## 1. Authentication & Security Specifications

### Admin Credentials
* **Email**: `anuragnagare77@gmail.com`
* **Password**: `cafe@02`

### Authentication Architecture
* **Dedicated Admin Store** (`src/lib/admin-auth-store.tsx`):
  * Manages admin authentication state (`isAdmin`, `adminEmail`, `login()`, `logout()`).
  * **Dual-mode support**:
    * **Firebase Mode**: Uses Firebase `signInWithEmailAndPassword` if configured.
    * **Fallback/Demo Mode**: Direct verification of credentials with persistent session storage (`workspot_admin_token`).
* **Route Protection**:
  * Route `/admin` guards all views.
  * If unauthenticated, displays an aesthetically styled **Admin Login Screen**.
  * If authenticated, unlocks the full administrative workspace with quick logout in the header.

---

## 2. Core Functional Modules

### Module A: Bookings & Financial Monitor
* **Key Metrics Summary**:
  * Total Platform Revenue (₹ INR).
  * Total Bookings Count (Upcoming, Past, Cancelled).
  * Unique Users & Occupancy Overview.
* **Master Bookings Table**:
  * **Columns**:
    * Booking Reference (e.g. `WS-MUM-4821`).
    * User Contact (Verified phone number / User ID).
    * Café & Area (e.g. `Blue Door Coffee · Bandra West`).
    * Seat details (e.g. `Window 1 (Window Desk)`).
    * Date & Time slot (e.g. `16 Oct 2026 · 10:00 IST · 2 hrs`).
    * Amount Paid (Calculated hourly rate × duration + platform fee).
    * Payment Method (`UPI`, `Card`, `Net banking`).
    * Status Badge (`upcoming`, `past`, `cancelled`).
    * Timestamp of booking.
  * **Actions & Controls**:
    * Real-time search by user phone number or booking reference.
    * Filter dropdown by café venue.
    * Filter pills by status (`All`, `Upcoming`, `Past`, `Cancelled`).
    * Admin Override: Status toggle (Force Cancel / Mark Completed).

---

### Module B: Café Profile Management & Editor
* **Café Directory & Actions**:
  * Searchable table / grid of all partner cafés across Mumbai.
  * Quick status indicators: listed seats, active pricing, rating, locality.
  * "Add New Café" creation modal.
* **Full-Featured Café Editor**:
  * **Core Details**: Name, Area/Neighbourhood, Full Address, Distance from BKC/center.
  * **Operational Info**: Hours (e.g. `8:00 AM–8:00 PM IST`), Vibe, Description, House rules.
  * **Pricing**: Hourly rate in INR (₹).
  * **Amenities Selector**: Toggleable pills (`Wi-Fi`, `Power`, `AC`, `Quiet`, `Food`, `Ergonomic`).
  * **Media & Imagery**:
    * Cover image URL with live preview and fallback checker.
    * Additional gallery images.
  * **Interactive Map Position**:
    * Setting `marker: { x, y }` (0–100% coordinates) to position the café on the Mumbai explore map.

---

### Module C: Interactive Seating Floor Plan Manager
* **Seat Grid Configuration**:
  * List all seats for the selected café (`Window 1`, `Community 2`, `Bar 1`, etc.).
  * Add new seats or remove existing seats.
  * Update seat types (`Window`, `Desk`, `Community`, `Bar`, `Nook`).
  * Change status: `available`, `unavailable`, `not-offered`.
  * Adjust seat coordinates (`x`, `y` percentages) on the visual floor plan.

---

### Module D: Reviews & Ratings Moderation
* **Venue Reputation Management**:
  * Overall average rating score (e.g. `4.8 / 5.0`) and review count.
  * Detailed review records list:
    * Reviewer name
    * Star rating (1 to 5)
    * Date
    * Written review content
  * Add new verified reviews manually.
  * Edit or delete outdated/spam reviews.
  * Auto-recalculation of average rating upon review changes.

---

## 3. Data Flow & Service Layer

```
                        ┌───────────────────────────────┐
                        │      Admin Panel UI           │
                        │        (/admin)               │
                        └──────────────┬────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
     [admin-auth-store.tsx]                         [firebase-service.ts]
     - Email/Password check                         - getAllBookingsLive()
     - Session persistence                          - saveCafeLive()
                                                    - deleteCafeLive()
                                                    - updateBookingStatusAdmin()
                                                    - saveReviewsLive()
                                                              │
                                       ┌──────────────────────┴──────────────────────┐
                                       ▼                                             ▼
                          ┌────────────────────────┐                    ┌────────────────────────┐
                          │    Cloud Firestore     │                    │  Local Storage / State │
                          │  (When .env configured)│                    │     (Fallback Demo)    │
                          └────────────────────────┘                    └────────────────────────┘
```

---

## 4. Implementation Steps & Milestones

- [ ] **Step 1: Admin Authentication Layer**
  - Create `src/lib/admin-auth-store.tsx` with credentials check (`anuragnagare77@gmail.com` / `cafe@02`).
  - Provide reactive context `useAdminAuth()` and persistent token management.

- [ ] **Step 2: Service Layer Extensions**
  - Add admin data access methods to `src/lib/firebase-service.ts`:
    - `getAllBookingsAdmin()`
    - `updateBookingStatusAdmin(id, status)`
    - `upsertCafeAdmin(cafe)`
    - `deleteCafeAdmin(slug)`
  - Ensure fallback sync with local storage so changes persist seamlessly even in demo mode.

- [ ] **Step 3: Admin Route & Navigation**
  - Create `src/routes/admin.tsx`.
  - Add route link in footer / header for admin navigation.
  - Render login screen if unauthenticated; render full dashboard if logged in.

- [ ] **Step 4: Bookings & Financial Analytics Dashboard**
  - Implement metrics cards (Revenue, Bookings, Active Venues).
  - Build searchable, filterable master bookings table with user phone numbers, dates, times, and amounts.
  - Add status override controls (cancel / complete).

- [ ] **Step 5: Café Manager & Profile Editor**
  - Implement café list table with quick actions.
  - Build edit modal / drawer for all café fields (name, pricing, address, hours, amenities, image URLs).
  - Add new venue creation modal.

- [ ] **Step 6: Seat Layout & Reviews Management**
  - Integrate interactive seat status toggles and floor plan coordinate updates.
  - Build review moderation and custom review creation tool with rating recalculation.

- [ ] **Step 7: Verification & Testing**
  - Validate admin login, session persistence across page reloads, booking status updates, and café edits.
  - Ensure zero regressions to customer explore, booking, and checkout flows.
