# WorkSpot — Real Data & Free Reservation Architecture Plan

## 1. Objectives & Requirements

1. **Real Mumbai Cafés & Live Data**:
   - Replace fictional placeholder cafés with authentic, well-known work-friendly Mumbai cafés (e.g., Subko Coffee Craft House Bandra, Blue Tokai Coffee Roasters Bandra/Fort, Third Wave Coffee Khar, KCROASTERS Chuim Village, Doolally Taproom Khar, KMC Mumbai Fort) in `src/lib/workspot-data.ts`.
   - Populate real street addresses, exact neighborhood mappings, authentic amenities (fiber Wi-Fi, abundant plugs, AC, quiet zones), real operational hours, accurate visual map markers, and high-quality photography.
   - Run/integrate the OpenStreetMap seeder (`scripts/seed-firestore.mjs`) to sync live Mumbai venues into the connected Firestore project (`live-farmaish`).
   - Dynamic & realistic review dates and reservation timestamps reflecting current dates.

2. **Remove User-Side Payments (Free Reservation, Pay at Café Counter)**:
   - **Zero payment collected from users online**: Remove the payment gateway / payment method selector (UPI, Card, Net banking) from the customer booking flow.
   - **Reserve Online, Pay at Venue**: Customer reserves their exact seat and time slot for free online. The booking pass specifies *"Pay at café counter upon arrival"* for their hourly booking or food/beverages.
   - **Retain Café Partner Fee**: Keep the ₹49 fee on the café partner self-registration page (`/partner/register`), because venues pay the platform for onboarding / Pro Tier verification, whereas remote workers reserve for free.

---

## 2. Component & Flow Architecture Changes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CUSTOMER RESERVATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘
  /explore & /                                 /cafes/:slug
  Real Mumbai Cafés (Subko,        ───►        Interactive Seat Map
  Blue Tokai, Third Wave, etc.)                Date, Time, Duration
                                                        │
                                                        ▼
                                                  /checkout
                                         • Phone OTP Verification
                                         • REMOVED: UPI / Card / Netbanking
                                         • ADDED: "Free Online Reservation"
                                                  "Pay at Café Counter"
                                         • Action: "Confirm Free Reservation"
                                                        │
                                                        ▼
                                            /booking/:id/confirmed
                                         Pass with QR + "Pay at Counter"

┌─────────────────────────────────────────────────────────────────────────────┐
│                    PARTNER & ADMIN FLOW (FEE RETAINED)                      │
└─────────────────────────────────────────────────────────────────────────────┘
  /partner/register                ───►  ₹49 Pro Tier Fee Retained for Cafés
  /manager                         ───►  Venue Manager Views Reservations
  /admin                           ───►  Super Admin (Approves Vendors,
                                         Inspects Reservations, Manages Layouts)
```

---

## 3. Detailed Step-by-Step Implementation Tasks

### Phase 1: Real Mumbai Café Data & Dynamic Dates
- [ ] **Task 1.1: Curate Real Work-Friendly Mumbai Cafés in `src/lib/workspot-data.ts`**
  - **Subko Coffee Craft House** (Ranwar Village, Bandra West)
  - **Blue Tokai Coffee Roasters** (Perry Cross Rd, Bandra West & Kala Ghoda, Fort)
  - **Third Wave Coffee** (Linking Road / Khar West & Powai)
  - **KMC Mumbai** (Kitab Mahal, Fort)
  - **KCROASTERS by Curators** (Chuim Village, Khar West)
  - **Doolally Taproom** (Khar West & Andheri)
  - Provide accurate addresses, real operational hours, accurate Mumbai map coordinates (`marker: { x, y }`), curated amenities, and realistic customer reviews with dynamic dates.
- [ ] **Task 1.2: Sync OpenStreetMap Seeder with Firestore**
  - Verify and run `scripts/seed-firestore.mjs` against `live-farmaish` Firestore instance.
  - Ensure fallback `getCustomLocalCafes()` and `getLiveCafes()` render the rich authentic dataset seamlessly whether online or offline.
- [ ] **Task 1.3: Update Landing Page & Explore Copy**
  - Replace any legacy placeholder references in `src/routes/index.tsx` and `src/routes/explore.tsx` with authentic venue highlights.

### Phase 2: Customer Checkout & Booking Flow Refactoring
- [ ] **Task 2.1: Redesign `src/routes/checkout.tsx`**
  - Remove payment method radio selector (UPI, Card, Net banking).
  - Update page header from "Review and pay" to "Review & Confirm Reservation".
  - Add prominent notice banner:
    > **Free Online Seat Reservation**
    > No payment is required right now. Your seat will be held for your selected time. Any venue hourly fee (₹XX) or café orders will be settled directly at the café counter upon arrival.
  - Change submit button:
    - From: `Confirm booking <LockKeyhole />`
    - To: `Confirm Free Reservation <CheckCircle2 />`
  - Update booking payload:
    - `paymentMethod: "Pay at counter"`
    - `paymentStatus: "pay_at_venue"`
- [ ] **Task 2.2: Update Venue Details Page (`src/routes/cafes.$slug.tsx`)**
  - Update sticky booking sidebar copy:
    - Change button from "Continue to book" to "Reserve Seat (Pay at Café)".
    - Change "Secure checkout" note to "Free reservation · Instant confirmation".
- [ ] **Task 2.3: Update Booking Confirmation Pass (`src/routes/booking.$id.confirmed.tsx`)**
  - Display "Pay at Counter on Arrival" badge and clear arrival instructions on the digital pass.
- [ ] **Task 2.4: Update Account Bookings (`src/routes/account.bookings.tsx`)**
  - Display "Pay at counter" status badge and details in the customer's reservation history.

### Phase 3: Partner Onboarding & Admin Retainment
- [ ] **Task 3.1: Maintain ₹49 Onboarding Fee in `src/routes/partner.register.tsx`**
  - Ensure the Pro Tier ₹49 fee and simulated payment modal remain intact for café partners as requested.
- [ ] **Task 3.2: Update Admin Dashboard (`src/routes/admin.tsx`)**
  - In "Bookings & Finances", update table columns and tooltips to distinguish between "Counter Collection (Expected)" for customer bookings vs. "Platform Vendor Fees" collected from café partners.
- [ ] **Task 3.3: Update Café Manager Dashboard (`src/routes/manager.tsx`)**
  - Show counter check-ins and expected on-arrival collections.

### Phase 4: Verification & End-to-End Validation
- [ ] **Task 4.1: Test Booking Journey**
  - Explore -> Select Seat -> Checkout without payment -> Confirmed pass with QR -> Verify in "My Bookings".
- [ ] **Task 4.2: Test Partner Registration Journey**
  - Verify partner application with ₹49 Pro fee works as expected and appears in the Super Admin queue.
- [ ] **Task 4.3: Test Admin Operations**
  - Verify bookings table displays the updated "Pay at counter" status correctly.
- [ ] **Task 4.4: Automated Test Suite**
  - Run `bun test` / Vitest to ensure routing and page matching tests pass with zero regressions.
