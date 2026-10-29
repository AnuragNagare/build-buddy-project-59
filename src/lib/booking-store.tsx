import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Booking, BookingSelection } from "./workspot-data";
import { useAuth } from "./auth-store";
import {
  getLiveUserBookings,
  createBookingWithConcurrencyCheck,
  cancelLiveBooking,
  notifyCafeOfBooking,
} from "./firebase-service";

type BookingContextValue = {
  selection: BookingSelection | null;
  setSelection: (value: BookingSelection | null) => void;
  bookings: Booking[];
  addBooking: (booking: Booking) => Promise<{ success: boolean; error?: string }>;
  cancelBooking: (id: string) => Promise<boolean>;
  hydrated: boolean;
  loading: boolean;
};

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selection, setSelectionState] = useState<BookingSelection | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Initial hydration from local storage
  useEffect(() => {
    try {
      const selected = window.localStorage.getItem("workspot-selection");
      const saved = window.localStorage.getItem("workspot-bookings");
      if (selected) setSelectionState(JSON.parse(selected));
      if (saved) setBookings(JSON.parse(saved));
    } catch {
      /* ignore malformed demo storage */
    }
    setHydrated(true);
  }, []);

  // 2. Sync with Firestore when an authenticated user is available
  useEffect(() => {
    if (!user?.uid || user.isDemo) return;

    let isMounted = true;
    setLoading(true);

    getLiveUserBookings(user.uid)
      .then((remoteBookings) => {
        if (!isMounted) return;
        if (remoteBookings.length > 0) {
          setBookings(remoteBookings);
          window.localStorage.setItem("workspot-bookings", JSON.stringify(remoteBookings));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid, user?.isDemo]);

  const setSelection = (value: BookingSelection | null) => {
    setSelectionState(value);
    if (value) window.localStorage.setItem("workspot-selection", JSON.stringify(value));
    else window.localStorage.removeItem("workspot-selection");
  };

  const addBooking = async (
    booking: Booking
  ): Promise<{ success: boolean; error?: string }> => {
    // Attempt Firestore transactional commit if user is present
    const result = await createBookingWithConcurrencyCheck({
      ...booking,
      userId: user?.uid,
      userPhone: user?.phoneNumber ?? undefined,
    });

    if (!result.success) {
      return result;
    }

    setBookings((current) => {
      const next = [booking, ...current];
      window.localStorage.setItem("workspot-bookings", JSON.stringify(next));
      return next;
    });

    // Partner cafés get an in-app alert; a failed alert must never fail the booking itself
    notifyCafeOfBooking(
      { ...booking, userPhone: user?.phoneNumber ?? booking.userPhone ?? "" },
      "booking_created"
    ).catch((err) => console.warn("Could not notify café of booking:", err));

    return { success: true };
  };

  const cancelBooking = async (id: string): Promise<boolean> => {
    await cancelLiveBooking(id);
    const cancelled = bookings.find((b) => b.id === id);
    if (cancelled) {
      notifyCafeOfBooking(cancelled, "booking_cancelled").catch((err) =>
        console.warn("Could not notify café of cancellation:", err)
      );
    }

    setBookings((current) => {
      const next = current.map((booking) =>
        booking.id === id ? { ...booking, status: "cancelled" as const } : booking
      );
      window.localStorage.setItem("workspot-bookings", JSON.stringify(next));
      return next;
    });

    return true;
  };

  const value = useMemo(
    () => ({
      selection,
      setSelection,
      bookings,
      addBooking,
      cancelBooking,
      hydrated,
      loading,
    }),
    [selection, bookings, hydrated, loading]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within BookingProvider");
  return context;
}
