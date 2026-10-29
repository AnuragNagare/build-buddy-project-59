import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, LoaderCircle, MapPin, QrCode, XCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { useBooking } from "@/lib/booking-store";
import { useAuth } from "@/lib/auth-store";
import { formatDate, getCafe, getCafeImage, today, type Booking } from "@/lib/workspot-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — WorkSpot" },
      { name: "description", content: "View and manage your upcoming and past WorkSpot reservations." },
      { property: "og:title", content: "My WorkSpot bookings" },
      { property: "og:description", content: "Your café workspace reservations in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Bookings,
});

const demo: Booking = {
  id: "WS-MUM-4318",
  cafeSlug: "subko-coffee-bandra",
  date: today(),
  time: "14:00",
  duration: 2,
  seatId: "s1",
  status: "upcoming",
  createdAt: new Date().toISOString(),
  paymentMethod: "Pay at counter",
  paymentStatus: "pay_at_venue",
};

function Bookings() {
  const { bookings, cancelBooking, loading } = useBooking();
  const { user } = useAuth();
  const [tab, setTab] = useState<Booking["status"]>("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const all = bookings.length ? bookings : user ? [] : [demo];
  const shown = all.filter((b) => b.status === tab);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    await cancelBooking(id);
    setCancellingId(null);
  };

  return (
    <div className="mx-auto min-h-[70vh] max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold uppercase text-primary">Your workdays</p>
          <h1 className="mt-2 font-display text-4xl font-bold">My bookings</h1>
        </div>
        {user?.phoneNumber && (
          <div className="rounded-lg bg-card border border-border px-4 py-2 text-xs font-semibold text-muted-foreground">
            Account: <b className="text-foreground">{user.phoneNumber}</b>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-2 border-b border-border">
        {(["upcoming", "past", "cancelled"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "min-h-12 border-b-2 px-4 text-sm font-bold capitalize transition-colors",
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-7 space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <LoaderCircle className="mx-auto animate-spin text-primary" size={28} />
            <p className="mt-3 text-sm text-muted-foreground">Syncing your reservations…</p>
          </div>
        ) : shown.length ? (
          shown.map((b) => {
            const cafe = getCafe(b.cafeSlug);
            const seat = cafe.seats.find((s) => s.id === b.seatId);
            return (
              <article
                key={b.id}
                className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:grid-cols-[150px_minmax(0,1fr)_auto]"
              >
                <img
                  src={getCafeImage(cafe)}
                  alt={cafe.name}
                  width={1200}
                  height={800}
                  className="aspect-[4/3] h-full w-full rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold capitalize",
                        b.status === "upcoming"
                          ? "bg-available/30 text-available-foreground"
                          : b.status === "cancelled"
                          ? "bg-coral/20 text-coral-deep"
                          : "bg-muted"
                      )}
                    >
                      {b.status}
                    </span>
                    <span className="rounded-full bg-secondary border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      Pay ₹{b.totalPrice || (cafe.price || 149) * b.duration} at counter
                    </span>
                  </div>
                  <h2 className="mt-3 truncate font-display text-xl font-bold">{cafe.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <MapPin className="mr-1 inline" size={14} />
                    {cafe.area}
                  </p>
                  <p className="mt-3 text-sm font-bold">
                    <CalendarDays className="mr-1 inline text-primary" size={15} />
                    {formatDate(b.date)} · {b.time} IST · {b.duration}h
                  </p>
                  <p className="text-sm text-muted-foreground">{b.seatName || seat?.name || "Reserved seat"}</p>
                </div>
                <div className="flex items-start gap-2 sm:flex-col">
                  <ButtonLink to="/booking/$id/confirmed" params={{ id: b.id }} variant="secondary">
                    <QrCode size={17} />
                    View pass
                  </ButtonLink>
                  {b.status === "upcoming" && (
                    <Button
                      variant="ghost"
                      disabled={cancellingId === b.id}
                      onClick={() => handleCancel(b.id)}
                    >
                      {cancellingId === b.id ? (
                        <LoaderCircle className="animate-spin" size={16} />
                      ) : (
                        <XCircle size={17} />
                      )}
                      Cancel
                    </Button>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
            <CalendarDays className="mx-auto text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl font-bold">Nothing here yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your {tab} bookings will appear here.</p>
            <ButtonLink to="/explore" className="mt-5">
              Find a WorkSpot
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}
