import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, Check, MapPin, Navigation, Store } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { useBooking } from "@/lib/booking-store";
import { formatDate, getCafe } from "@/lib/workspot-data";

export const Route = createFileRoute("/booking/$id/confirmed")({
  head: () => ({
    meta: [
      { title: "Reservation confirmed — WorkSpot" },
      { name: "description", content: "Your WorkSpot café seat is confirmed. Pay at the counter on arrival." },
      { property: "og:title", content: "Your WorkSpot seat is reserved" },
      { property: "og:description", content: "View your reservation pass, seat details and café directions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Confirmed,
});

function Confirmed() {
  const { id } = Route.useParams();
  const { bookings } = useBooking();
  const b = bookings.find((x) => x.id === id);
  const cafe = getCafe(b?.cafeSlug ?? "subko-coffee-bandra");
  const seat = cafe.seats.find((s) => s.id === b?.seatId);
  const totalAmount = (cafe.price || 149) * (b?.duration || 2);

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-available text-available-foreground">
        <Check size={34} />
      </span>
      <p className="mt-6 font-bold uppercase text-primary">Reservation confirmed</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Your seat is held.</h1>
      <p className="mt-3 text-muted-foreground">
        Show this pass when you arrive at the café counter to check in.
      </p>

      <div className="mx-auto mt-8 max-w-lg overflow-hidden rounded-xl border-2 border-foreground bg-card text-left shadow-[10px_10px_0_var(--sky)]">
        <div className="bg-foreground p-5 text-primary-foreground flex items-center justify-between">
          <div>
            <p className="text-xs opacity-60">RESERVATION REFERENCE</p>
            <p className="font-display text-2xl font-bold">{id}</p>
          </div>
          <span className="rounded-full bg-sun px-3 py-1 text-xs font-bold text-foreground">
            Pay at counter
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-[1fr_auto] gap-5">
            <div>
              <h2 className="font-display text-2xl font-bold">{cafe.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <MapPin className="mr-1 inline" size={14} />
                {cafe.area}
              </p>
              <p className="mt-5 font-bold">
                {b ? formatDate(b.date) : "Today"} · {b?.time ?? "10:00"} IST
              </p>
              <p className="text-sm text-muted-foreground">
                {b?.duration ?? 2} hours · {seat?.name ?? "Window 1"}
              </p>
            </div>
            <QR />
          </div>

          <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
            <Store size={16} className="shrink-0 text-primary mt-0.5" />
            <div>
              <b className="text-foreground block">Counter Check-in:</b>
              Online booking is 100% free. Settle your desk rate (₹{totalAmount}) or any food & beverages directly at the café register.
            </div>
          </div>

          <div className="mt-5 border-t border-dashed border-border pt-4 text-xs text-muted-foreground flex justify-between">
            <span>Free cancellation deadline:</span>
            <span className="font-bold text-foreground">Up to 2 hours before start</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={() => alert("Calendar event prepared — demo only")}>
          <CalendarPlus size={18} />
          Add to calendar
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.name} ${cafe.address}`)}`,
              "_blank"
            )
          }
        >
          <Navigation size={18} />
          Directions
        </Button>
        <ButtonLink to="/account/bookings">View my reservations</ButtonLink>
      </div>
    </div>
  );
}

function QR() {
  return (
    <div
      aria-label="QR-style booking code"
      className="grid size-28 shrink-0 grid-cols-7 gap-0.5 rounded-lg bg-background p-2 border border-border"
    >
      {Array.from({ length: 49 }, (_, i) => (
        <i
          key={i}
          className={
            (i * 7 + i * 3) % 5 < 2 || [0, 1, 7, 8, 40, 41, 47, 48].includes(i)
              ? "bg-foreground"
              : "bg-transparent"
          }
        />
      ))}
    </div>
  );
}