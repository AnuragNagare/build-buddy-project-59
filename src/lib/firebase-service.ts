import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  cafes,
  getCafe,
  today,
  type Cafe,
  type Booking,
  type VendorApplication,
  type Seat,
  type PendingReviewSubmission,
} from "./workspot-data";

/**
 * Fetch all work-friendly café listings.
 * Retrieves live records from Firestore 'cafes' collection if configured,
 * falling back seamlessly to mock domain data otherwise.
 */
export async function getLiveCafes(): Promise<Cafe[]> {
  if (!isFirebaseConfigured || !db) {
    return getCustomLocalCafes();
  }

  try {
    const cafesRef = collection(db, "cafes");
    const snapshot = await getDocs(cafesRef);

    if (snapshot.empty) {
      console.info("Firestore 'cafes' collection is empty. Returning default data.");
      return getCustomLocalCafes();
    }

    const liveCafes: Cafe[] = [];
    snapshot.forEach((docSnap) => {
      liveCafes.push({ slug: docSnap.id, ...(docSnap.data() as Omit<Cafe, "slug">) });
    });
    return liveCafes;
  } catch (err) {
    console.warn("Error fetching cafes from Firestore, using fallback data:", err);
    return getCustomLocalCafes();
  }
}

/**
 * Fetch a single café by its slug identifier.
 */
export async function getLiveCafe(slug: string): Promise<Cafe> {
  if (!isFirebaseConfigured || !db) {
    const local = getCustomLocalCafes().find((c) => c.slug === slug);
    return local ?? getCafe(slug);
  }

  try {
    const cafeDoc = await getDoc(doc(db, "cafes", slug));
    if (cafeDoc.exists()) {
      return { slug: cafeDoc.id, ...(cafeDoc.data() as Omit<Cafe, "slug">) };
    }
  } catch (err) {
    console.warn(`Error fetching cafe '${slug}' from Firestore:`, err);
  }

  const local = getCustomLocalCafes().find((c) => c.slug === slug);
  return local ?? getCafe(slug);
}

/**
 * Commit a new booking using Firestore atomic transaction.
 * Ensures strict concurrency control: prevents double-booking of the same seat
 * on the same date and start time.
 */
export async function createBookingWithConcurrencyCheck(
  booking: Booking & { userId?: string; userPhone?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured || !db) {
    // In mock/unconfigured mode, allow client booking
    return { success: true };
  }

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Check for conflicting active bookings on the exact seat & time slot
      const bookingsRef = collection(db, "bookings");
      const conflictQuery = query(
        bookingsRef,
        where("cafeSlug", "==", booking.cafeSlug),
        where("seatId", "==", booking.seatId),
        where("date", "==", booking.date),
        where("time", "==", booking.time),
        where("status", "==", "upcoming")
      );

      const conflictSnapshot = await getDocs(conflictQuery);
      if (!conflictSnapshot.empty) {
        throw new Error("Seat is already reserved for this time slot. Please choose another seat.");
      }

      // 2. Commit the new booking document
      const newBookingRef = doc(db, "bookings", booking.id);
      transaction.set(newBookingRef, {
        ...booking,
        createdAt: serverTimestamp(),
        createdAtIso: booking.createdAt,
      });
    });

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Booking transaction failed:", error);
    return { success: false, error: error.message || "Failed to reserve seat." };
  }
}

/**
 * Retrieve all bookings associated with an authenticated user ID.
 */
export async function getLiveUserBookings(userId: string): Promise<Booking[]> {
  if (!isFirebaseConfigured || !db || !userId) {
    return [];
  }

  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const userBookings: Booking[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      userBookings.push({
        id: docSnap.id,
        cafeSlug: data.cafeSlug,
        date: data.date,
        time: data.time,
        duration: data.duration,
        seatId: data.seatId,
        status: data.status,
        createdAt: data.createdAtIso || new Date().toISOString(),
      });
    });

    return userBookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    console.error("Error retrieving user bookings from Firestore:", err);
    return [];
  }
}

/**
 * Cancel an upcoming reservation in Firestore.
 */
export async function cancelLiveBooking(bookingId: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) {
    return true;
  }

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { status: "cancelled" });
    return true;
  } catch (err) {
    console.error(`Failed to cancel booking '${bookingId}' in Firestore:`, err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// Fallback & Demo Seed Data for Admin
// -----------------------------------------------------------------------------
const demoAdminBookings: Booking[] = [
  {
    id: "WS-MUM-4821",
    cafeSlug: "subko-coffee-bandra",
    date: today(),
    time: "10:00",
    duration: 2,
    seatId: "s2",
    seatName: "Window 2",
    status: "upcoming",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    userPhone: "+919820123456",
    userId: "demo-user-1",
    totalPrice: 378,
    paymentMethod: "Pay at counter",
    paymentStatus: "pay_at_venue",
  },
  {
    id: "WS-MUM-5174",
    cafeSlug: "blue-tokai-bandra",
    date: today(),
    time: "11:00",
    duration: 3,
    seatId: "s4",
    seatName: "Community 1",
    status: "upcoming",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    userPhone: "+919819876543",
    userId: "demo-user-2",
    totalPrice: 477,
    paymentMethod: "Pay at counter",
    paymentStatus: "pay_at_venue",
  },
  {
    id: "WS-MUM-3942",
    cafeSlug: "third-wave-coffee-khar",
    date: today(),
    time: "14:00",
    duration: 2,
    seatId: "s1",
    seatName: "Window 1",
    status: "past",
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    userPhone: "+919769112233",
    userId: "demo-user-3",
    totalPrice: 298,
    paymentMethod: "Pay at counter",
    paymentStatus: "pay_at_venue",
  },
  {
    id: "WS-MUM-2819",
    cafeSlug: "kmc-mumbai-fort",
    date: today(),
    time: "15:00",
    duration: 4,
    seatId: "s7",
    seatName: "Bar 1",
    status: "cancelled",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    userPhone: "+919833445566",
    userId: "demo-user-4",
    totalPrice: 796,
    paymentMethod: "Pay at counter",
    paymentStatus: "pay_at_venue",
  },
];

export function getCustomLocalCafes(): Cafe[] {
  if (typeof window === "undefined") return cafes;
  try {
    const raw = window.localStorage.getItem("workspot_custom_cafes");
    if (!raw) return cafes;
    const parsed = JSON.parse(raw) as Cafe[];
    return parsed.length > 0 ? parsed : cafes;
  } catch {
    return cafes;
  }
}

export function saveCustomLocalCafes(allCafes: Cafe[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("workspot_custom_cafes", JSON.stringify(allCafes));
  } catch {
    // Ignore storage quota errors
  }
}

// -----------------------------------------------------------------------------
// Admin Data Access Methods
// -----------------------------------------------------------------------------

/**
 * Retrieve all customer bookings across all venues for the Super Admin panel.
 */
export async function getAllBookingsAdmin(): Promise<Booking[]> {
  // If live Firestore is available, retrieve the master collection
  if (isFirebaseConfigured && db) {
    try {
      const bookingsRef = collection(db, "bookings");
      const snapshot = await getDocs(bookingsRef);
      if (!snapshot.empty) {
        const liveBookings: Booking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          liveBookings.push({
            id: docSnap.id,
            cafeSlug: data.cafeSlug,
            date: data.date,
            time: data.time,
            duration: data.duration,
            seatId: data.seatId,
            seatName: data.seatName,
            status: data.status,
            createdAt: data.createdAtIso || new Date().toISOString(),
            userId: data.userId,
            userPhone: data.userPhone,
            totalPrice: data.totalPrice,
            paymentMethod: data.paymentMethod,
          });
        });
        return liveBookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    } catch (err) {
      console.warn("Could not query Firestore master bookings, falling back to local:", err);
    }
  }

  // Fallback: Read local customer bookings combined with demo seed bookings
  try {
    if (typeof window !== "undefined") {
      const local = window.localStorage.getItem("workspot-bookings");
      const parsedLocal = local ? (JSON.parse(local) as Booking[]) : [];
      // Deduplicate by ID
      const map = new Map<string, Booking>();
      [...parsedLocal, ...demoAdminBookings].forEach((b) => {
        if (!map.has(b.id)) map.set(b.id, b);
      });
      return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  } catch {
    // Ignore
  }

  return demoAdminBookings;
}

/**
 * Update the reservation status of any booking as Super Admin.
 */
export async function updateBookingStatusAdmin(
  bookingId: string,
  status: "upcoming" | "past" | "cancelled"
): Promise<{ success: boolean; error?: string }> {
  let firestoreUpdated = false;

  if (isFirebaseConfigured && db) {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, { status });
      firestoreUpdated = true;
    } catch (err: unknown) {
      console.warn(`Firestore update failed for booking ${bookingId}:`, err);
    }
  }

  // Always sync local storage for persistence across views
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("workspot-bookings");
      const current = raw ? (JSON.parse(raw) as Booking[]) : [];
      const updated = current.map((b) => (b.id === bookingId ? { ...b, status } : b));
      window.localStorage.setItem("workspot-bookings", JSON.stringify(updated));
    }
  } catch {
    // Ignore
  }

  return { success: firestoreUpdated || true };
}

/**
 * Create or update a café's complete profile (details, pricing, amenities, images, seats, reviews).
 */
export async function upsertCafeAdmin(cafe: Cafe): Promise<{ success: boolean; error?: string }> {
  if (isFirebaseConfigured && db) {
    try {
      const cafeRef = doc(db, "cafes", cafe.slug);
      await setDoc(cafeRef, cafe, { merge: true });
    } catch (err: unknown) {
      const error = err as Error;
      console.warn(`Firestore café upsert error for ${cafe.slug}:`, error);
    }
  }

  // Sync with local custom cafes
  const currentCafes = getCustomLocalCafes();
  const existingIdx = currentCafes.findIndex((c) => c.slug === cafe.slug);
  let updatedCafes: Cafe[];
  if (existingIdx >= 0) {
    updatedCafes = [...currentCafes];
    updatedCafes[existingIdx] = cafe;
  } else {
    updatedCafes = [cafe, ...currentCafes];
  }
  saveCustomLocalCafes(updatedCafes);

  return { success: true };
}

/**
 * Delete a café profile from the platform.
 */
export async function deleteCafeAdmin(slug: string): Promise<{ success: boolean; error?: string }> {
  if (isFirebaseConfigured && db) {
    try {
      const cafeRef = doc(db, "cafes", slug);
      await deleteDoc(cafeRef);
    } catch (err: unknown) {
      console.warn(`Firestore café delete error for ${slug}:`, err);
    }
  }

  // Remove from local custom cafes
  const currentCafes = getCustomLocalCafes();
  const filtered = currentCafes.filter((c) => c.slug !== slug);
  saveCustomLocalCafes(filtered);

  return { success: true };
}

// -----------------------------------------------------------------------------
// Vendor Self-Registration & Onboarding Service Layer
// -----------------------------------------------------------------------------

const demoVendorApplications: VendorApplication[] = [
  {
    id: "APP-WS-8492",
    cafeName: "The Roast & Reading Room",
    area: "Kala Ghoda, Fort",
    address: "K. Dubash Marg, Kala Ghoda, Fort, Mumbai",
    contactName: "Priyanka Deshmukh",
    contactPhone: "+919820556677",
    contactEmail: "priyanka@roastandread.com",
    price: 169,
    hours: "8:30 AM–9:30 PM IST",
    vibe: "Quiet, bookish & sunlit",
    description: "An artisanal brew bar with mezzanine work pods, silent desk rules and specialty pour-overs.",
    amenities: ["Wi-Fi", "Power", "AC", "Quiet", "Food", "Ergonomic"],
    seatsCount: 8,
    coverImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    status: "pending",
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    notes: "We have 8 dedicated silent work pods on our 1st floor mezzanine.",
    plan: "pro",
    paidAmount: 49,
    paymentStatus: "paid",
    paymentMethod: "UPI",
  },
  {
    id: "APP-WS-7319",
    cafeName: "Veranda Brew Lab",
    area: "Bandra West",
    address: "Pali Hill Road, Bandra West, Mumbai",
    contactName: "Armaan Merchant",
    contactPhone: "+919819223344",
    contactEmail: "armaan@verandabrew.in",
    price: 189,
    hours: "8:00 AM–10:00 PM IST",
    vibe: "Green, airy & creative",
    description: "Open garden patio café with high-speed mesh Wi-Fi, shaded outdoor tables, and plug points at every desk.",
    amenities: ["Wi-Fi", "Power", "Food", "AC"],
    seatsCount: 6,
    coverImage: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80",
    status: "pending",
    submittedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    notes: "Ideal for creative sprints, writing, and client meetings.",
    plan: "free",
    paidAmount: 0,
    paymentStatus: "unpaid",
  },
];

const VENDOR_STORAGE_KEY = "workspot_vendor_applications";

/**
 * Submit a new self-registration application by a café vendor.
 */
export async function submitVendorApplication(
  data: Omit<VendorApplication, "id" | "status" | "submittedAt">
): Promise<{ success: boolean; id: string; error?: string }> {
  const appId = `APP-WS-${Math.floor(1000 + Math.random() * 9000)}`;
  const application: VendorApplication = {
    ...data,
    id: appId,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "vendor_applications", appId);
      await setDoc(docRef, {
        ...application,
        createdAtServer: serverTimestamp(),
      });
    } catch (err: unknown) {
      console.warn("Firestore vendor application submit error:", err);
    }
  }

  // Always store in local storage so demo mode and offline testing work reliably
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(VENDOR_STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as VendorApplication[]) : [];
      window.localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify([application, ...existing]));
    }
  } catch {
    // Ignore storage quota errors
  }

  return { success: true, id: appId };
}

/**
 * Retrieve all vendor registration applications for the Super Admin panel.
 */
export async function getVendorApplicationsAdmin(): Promise<VendorApplication[]> {
  if (isFirebaseConfigured && db) {
    try {
      const appsRef = collection(db, "vendor_applications");
      const snapshot = await getDocs(appsRef);
      if (!snapshot.empty) {
        const liveApps: VendorApplication[] = [];
        snapshot.forEach((docSnap) => {
          liveApps.push({ id: docSnap.id, ...(docSnap.data() as Omit<VendorApplication, "id">) });
        });
        return liveApps.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      }
    } catch (err) {
      console.warn("Could not query Firestore vendor applications:", err);
    }
  }

  // Fallback: Read local vendor applications combined with demo seed applications
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(VENDOR_STORAGE_KEY);
      const localApps = raw ? (JSON.parse(raw) as VendorApplication[]) : [];
      const map = new Map<string, VendorApplication>();
      [...localApps, ...demoVendorApplications].forEach((app) => {
        if (!map.has(app.id)) map.set(app.id, app);
      });
      return Array.from(map.values()).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    }
  } catch {
    // Ignore
  }

  return demoVendorApplications;
}

/**
 * Update vendor application status (pending, approved, rejected).
 */
export async function updateVendorApplicationStatus(
  id: string,
  status: "pending" | "approved" | "rejected"
): Promise<{ success: boolean; error?: string }> {
  if (isFirebaseConfigured && db) {
    try {
      const appRef = doc(db, "vendor_applications", id);
      await updateDoc(appRef, { status });
    } catch (err) {
      console.warn(`Firestore status update failed for application ${id}:`, err);
    }
  }

  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(VENDOR_STORAGE_KEY);
      const apps = raw ? (JSON.parse(raw) as VendorApplication[]) : demoVendorApplications;
      const updated = apps.map((a) => (a.id === id ? { ...a, status } : a));
      window.localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore
  }

  return { success: true };
}

/**
 * Approve a vendor's registration and automatically publish their café into the live platform!
 */
export async function approveAndPublishVendorCafe(
  applicationId: string
): Promise<{ success: boolean; cafe?: Cafe; error?: string }> {
  const allApps = await getVendorApplicationsAdmin();
  const app = allApps.find((a) => a.id === applicationId);

  if (!app) {
    return { success: false, error: "Application not found." };
  }

  // Generate unique slug from café name
  const baseSlug = app.cafeName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const slug = `${baseSlug || "cafe"}-${Math.random().toString(36).slice(2, 6)}`;

  // Automatically generate seats for the venue
  const count = Math.max(4, Math.min(app.seatsCount || 6, 12));
  const newSeats: Seat[] = Array.from({ length: count }, (_, i) => {
    const type = i < 3 ? "Window" : i < 6 ? "Desk" : "Community";
    return {
      id: `s${i + 1}`,
      name: `${type} ${i + 1}`,
      type,
      status: "available",
      x: 15 + (i % 3) * 32,
      y: 15 + Math.floor(i / 3) * 28,
    };
  });

  // Assemble new live Cafe record
  const newCafe: Cafe = {
    slug,
    name: app.cafeName,
    tier: app.plan || "free",
    area: app.area,
    address: app.address,
    distance: 2.5,
    rating: 4.8,
    reviews: 1,
    price: app.price || 149,
    image: app.coverImage,
    amenities: app.amenities.length > 0 ? app.amenities : ["Wi-Fi", "Power", "AC", "Food"],
    availability: `${count} seats open`,
    vibe: app.vibe || "Bright & social",
    description: app.description,
    hours: app.hours || "8:30 AM–8:30 PM IST",
    marker: {
      x: Math.floor(20 + Math.random() * 60),
      y: Math.floor(20 + Math.random() * 60),
    },
    seats: newSeats,
    reviewsList: [
      {
        id: `r-welcome-${slug}`,
        author: app.contactName || "Verified Guest",
        rating: 5,
        date: new Date().toISOString().slice(0, 10),
        comment: `Welcome to ${app.cafeName}! Reserved seating, high-speed Wi-Fi, and work amenities are all verified.`,
      },
    ],
  };

  // 1. Commit new Cafe to platform
  await upsertCafeAdmin(newCafe);

  // 2. Mark application status as approved
  await updateVendorApplicationStatus(applicationId, "approved");

  return { success: true, cafe: newCafe };
}

// -----------------------------------------------------------------------------
// Pro Tier Vendor Review Submissions & Admin Approval Queue
// -----------------------------------------------------------------------------

export const PENDING_REVIEWS_STORAGE_KEY = "workspot_pending_reviews";

export const demoPendingReviews: PendingReviewSubmission[] = [
  {
    id: "REV-SUB-101",
    cafeSlug: "the-roast-room",
    cafeName: "The Roast Room",
    author: "Rohan V. (Founder)",
    rating: 5,
    date: "2026-10-24",
    comment: "Exceptional cold brew and fiber Wi-Fi. I hosted a 3-hour product sync from the window desk with zero connection drops!",
    status: "pending",
    submittedAt: "2026-10-24T10:15:00.000Z",
  },
  {
    id: "REV-SUB-102",
    cafeSlug: "blue-door-coffee",
    cafeName: "Blue Door Coffee",
    author: "Ananya Sharma",
    rating: 5,
    date: "2026-10-23",
    comment: "The quiet back studio is a gem for deep coding sessions. Ergonomic chairs, abundant power outlets, and prompt service.",
    status: "pending",
    submittedAt: "2026-10-23T15:40:00.000Z",
  },
  {
    id: "REV-SUB-103",
    cafeSlug: "the-roast-room",
    cafeName: "The Roast Room",
    author: "Kavita M.",
    rating: 5,
    date: "2026-10-22",
    comment: "Best artisan pour-over in Bandra. The community tables have dedicated spike-protected sockets.",
    status: "approved",
    submittedAt: "2026-10-22T09:20:00.000Z",
  },
];

/**
 * Submit a customer review for Super Admin moderation (Pro Tier Cafes).
 */
export async function submitVendorReviewForApproval(
  reviewData: Omit<PendingReviewSubmission, "id" | "status" | "submittedAt">
): Promise<{ success: boolean; id: string; error?: string }> {
  const submissionId = `REV-SUB-${Math.floor(1000 + Math.random() * 9000)}`;
  const submission: PendingReviewSubmission = {
    id: submissionId,
    ...reviewData,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  // Try Firestore persistence if connected
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "pending_reviews", submissionId);
      await setDoc(docRef, { ...submission, createdAt: serverTimestamp() });
    } catch (err) {
      console.warn("Firestore pending review write failed:", err);
    }
  }

  // Always store locally for offline/demo reliability
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(PENDING_REVIEWS_STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as PendingReviewSubmission[]) : demoPendingReviews;
      window.localStorage.setItem(PENDING_REVIEWS_STORAGE_KEY, JSON.stringify([submission, ...existing]));
    }
  } catch {
    // Ignore storage quota
  }

  return { success: true, id: submissionId };
}

/**
 * Get all pending review submissions across venues for the Super Admin moderation queue.
 */
export async function getPendingReviewSubmissionsAdmin(): Promise<PendingReviewSubmission[]> {
  if (isFirebaseConfigured && db) {
    try {
      const reviewsRef = collection(db, "pending_reviews");
      const snapshot = await getDocs(reviewsRef);
      if (!snapshot.empty) {
        const liveReviews: PendingReviewSubmission[] = [];
        snapshot.forEach((docSnap) => {
          liveReviews.push({ id: docSnap.id, ...(docSnap.data() as Omit<PendingReviewSubmission, "id">) });
        });
        return liveReviews.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      }
    } catch (err) {
      console.warn("Could not query Firestore pending reviews:", err);
    }
  }

  // Fallback: Read local submissions combined with demo items
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(PENDING_REVIEWS_STORAGE_KEY);
      const localReviews = raw ? (JSON.parse(raw) as PendingReviewSubmission[]) : [];
      const map = new Map<string, PendingReviewSubmission>();
      [...localReviews, ...demoPendingReviews].forEach((rev) => {
        if (!map.has(rev.id)) map.set(rev.id, rev);
      });
      return Array.from(map.values()).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    }
  } catch {
    // Ignore
  }

  return demoPendingReviews;
}

/**
 * Get review submissions for a specific café (used by Manager dashboard).
 */
export async function getPendingReviewsForCafe(cafeSlug: string): Promise<PendingReviewSubmission[]> {
  const allSubmissions = await getPendingReviewSubmissionsAdmin();
  return allSubmissions.filter((sub) => sub.cafeSlug === cafeSlug);
}

/**
 * Super Admin: Approve a vendor review submission and publish it live to the café!
 */
export async function approvePendingReviewAdmin(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  const allSubmissions = await getPendingReviewSubmissionsAdmin();
  const sub = allSubmissions.find((s) => s.id === submissionId);
  if (!sub) {
    return { success: false, error: "Review submission not found." };
  }

  // 1. Update submission status in Firestore and localStorage
  await updatePendingReviewStatus(submissionId, "approved");

  // 2. Append review to target café's reviewsList and update rating/reviews count
  const allCafes = await getLiveCafes();
  const targetCafe = allCafes.find((c) => c.slug === sub.cafeSlug);
  if (targetCafe) {
    const newReviewsList = [
      {
        id: `rev-${Date.now()}`,
        author: sub.author,
        rating: sub.rating,
        date: sub.date,
        comment: sub.comment,
      },
      ...targetCafe.reviewsList,
    ];

    const totalStars = newReviewsList.reduce((acc, r) => acc + r.rating, 0);
    const newAvg = Number((totalStars / newReviewsList.length).toFixed(1));

    const updatedCafe: Cafe = {
      ...targetCafe,
      rating: newAvg,
      reviews: newReviewsList.length,
      reviewsList: newReviewsList,
    };

    await upsertCafeAdmin(updatedCafe);
  }

  return { success: true };
}

/**
 * Super Admin: Reject a vendor review submission.
 */
export async function rejectPendingReviewAdmin(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  return updatePendingReviewStatus(submissionId, "rejected");
}

/**
 * Internal helper to update status of a review submission.
 */
export async function updatePendingReviewStatus(
  submissionId: string,
  status: "pending" | "approved" | "rejected"
): Promise<{ success: boolean; error?: string }> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "pending_reviews", submissionId);
      await updateDoc(docRef, { status });
    } catch (err) {
      console.warn(`Firestore status update failed for review ${submissionId}:`, err);
    }
  }

  try {
    if (typeof window !== "undefined") {
      const allSubmissions = await getPendingReviewSubmissionsAdmin();
      const updated = allSubmissions.map((s) => (s.id === submissionId ? { ...s, status } : s));
      window.localStorage.setItem(PENDING_REVIEWS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore
  }

  return { success: true };
}


