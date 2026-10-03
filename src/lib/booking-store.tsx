import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Booking, BookingSelection } from "./workspot-data";

type BookingContextValue = {
  selection: BookingSelection | null; setSelection: (value: BookingSelection | null) => void;
  bookings: Booking[]; addBooking: (booking: Booking) => void; cancelBooking: (id: string) => void; hydrated: boolean;
};
const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] = useState<BookingSelection | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const selected = window.localStorage.getItem("workspot-selection");
      const saved = window.localStorage.getItem("workspot-bookings");
      if (selected) setSelectionState(JSON.parse(selected));
      if (saved) setBookings(JSON.parse(saved));
    } catch { /* ignore malformed demo storage */ }
    setHydrated(true);
  }, []);
  const setSelection = (value: BookingSelection | null) => {
    setSelectionState(value);
    if (value) window.localStorage.setItem("workspot-selection", JSON.stringify(value));
    else window.localStorage.removeItem("workspot-selection");
  };
  const addBooking = (booking: Booking) => setBookings((current) => {
    const next = [booking, ...current]; window.localStorage.setItem("workspot-bookings", JSON.stringify(next)); return next;
  });
  const cancelBooking = (id: string) => setBookings((current) => {
    const next = current.map((booking) => booking.id === id ? { ...booking, status: "cancelled" as const } : booking);
    window.localStorage.setItem("workspot-bookings", JSON.stringify(next)); return next;
  });
  const value = useMemo(() => ({ selection, setSelection, bookings, addBooking, cancelBooking, hydrated }), [selection, bookings, hydrated]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within BookingProvider");
  return context;
}
