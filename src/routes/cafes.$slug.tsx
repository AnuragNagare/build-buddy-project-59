import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Armchair,
  Coffee,
  Crown,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Volume2,
  Wifi,
  Zap,
} from "lucide-react";
import {
  BookingSummary,
  PriceBreakdown,
  SeatGrid,
  SeatLegendRow,
  SeatingLegendCard,
  timeSlots,
} from "@/components/booking-ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { useBooking } from "@/lib/booking-store";
import { formatDate, getCafe, getCafeImage, isGenericCafeImage, timesOverlap, today } from "@/lib/workspot-data";
import { getLiveCafe, getSeatHolds } from "@/lib/firebase-service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cafes/$slug")({
  head: ({ params }) => {
    const cafe = getCafe(params.slug);
    return {
      meta: [
        { title: `${cafe.name}, ${cafe.area} — WorkSpot` },
        { name: "description", content: `Reserve a work-friendly seat at ${cafe.name} in ${cafe.area}, Mumbai.` },
        { property: "og:title", content: `Book ${cafe.name} — WorkSpot` },
        { property: "og:description", content: cafe.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CafeDetail,
});

const MAX_SEATS = 6;

function CafeDetail() {
  const { slug } = Route.useParams();
  const defaultCafe = getCafe(slug);

  const { data: cafe = defaultCafe } = useQuery({
    queryKey: ["cafe", slug],
    queryFn: () => getLiveCafe(slug),
    initialData: defaultCafe,
  });

  const nav = useNavigate();
  const { selection, setSelection } = useBooking();

  const [date, setDate] = useState(selection?.cafeSlug === slug ? selection.date : today());
  const [time, setTime] = useState(selection?.cafeSlug === slug ? selection.time : "10:00");
  const [duration, setDuration] = useState(selection?.cafeSlug === slug ? selection.duration : 2);
  const [seatIds, setSeatIds] = useState<string[]>(
    selection?.cafeSlug === slug ? (selection.seatIds ?? [selection.seatId]) : []
  );

  // Seats already booked for an overlapping time on the chosen date show as unavailable
  const { data: holds = [] } = useQuery({
    queryKey: ["seat-holds", slug, date],
    queryFn: () => getSeatHolds(slug, date),
  });
  const heldSeatIds = useMemo(
    () =>
      new Set(
        holds.filter((h) => timesOverlap(time, duration, h.time, h.duration)).flatMap((h) => h.seatIds)
      ),
    [holds, time, duration]
  );
  const pickedIds = seatIds.filter((id) => !heldSeatIds.has(id));
  const chosenSeats = cafe.seats.filter((s) => pickedIds.includes(s.id));
  const seatSummary = chosenSeats.map((s) => s.name).join(", ");

  const toggleSeat = (id: string) =>
    setSeatIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : current.length < MAX_SEATS ? [...current, id] : current
    );

  const continueBooking = () => {
    const [first] = pickedIds;
    if (!first) return;
    setSelection({
      cafeSlug: slug,
      date,
      time,
      duration,
      seatId: first,
      ...(pickedIds.length > 1 ? { seatIds: pickedIds } : {}),
    });
    nav({ to: "/checkout" });
  };

  return (
    <div className="pb-28 lg:pb-16">
      <div className="mx-auto max-w-7xl px-5 py-5">
        <ButtonLink to="/explore" search={{ q: undefined }} variant="ghost" className="px-0">
          <ArrowLeft size={18} />
          Back to explore
        </ButtonLink>
        <div className="mt-3 grid gap-3 lg:grid-cols-12">
          <img
            src={getCafeImage(cafe)}
            alt={`${cafe.name} interior`}
            width={1200}
            height={800}
            className="aspect-[16/10] h-full w-full rounded-xl object-cover lg:col-span-8"
          />
          <div className="grid grid-cols-2 gap-3 lg:col-span-4 lg:grid-cols-1">
            <img
              src={getCafeImage(cafe)}
              alt="Window work seats"
              loading="lazy"
              width={1200}
              height={800}
              className="h-full min-h-36 w-full rounded-xl object-cover object-left"
            />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.name} ${cafe.address}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open directions to ${cafe.name} in Google Maps`}
              aria-label={`Open directions to ${cafe.name} in Google Maps`}
              className="group relative block overflow-hidden rounded-xl bg-sky/30 transition-all hover:bg-sky/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage: "radial-gradient(var(--primary) 2px,transparent 2px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="relative grid h-full min-h-36 place-items-center p-3 text-center">
                <MapPin className="text-coral transition-transform group-hover:scale-110" />
                <p className="font-bold">
                  {cafe.area}
                  <br />
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline underline-offset-2 group-hover:text-primary-deep">
                    Open directions
                    <ExternalLink size={12} className="inline opacity-80" />
                  </span>
                </p>
              </div>
            </a>
          </div>
        </div>

        {isGenericCafeImage(cafe.image) && (
          <p className="mt-2 text-xs text-muted-foreground">
            Representative photos — {cafe.name} hasn't uploaded its own yet.
          </p>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-4xl font-bold">{cafe.name}</h1>
                  {cafe.tier === "pro" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <Crown size={13} className="fill-amber-500 text-amber-500" /> Verified Pro Partner
                    </span>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.name} ${cafe.address}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline transition-colors w-fit text-sm"
                  title="View address on Google Maps"
                >
                  <MapPin size={16} className="text-coral shrink-0" />
                  <span>{cafe.address}</span>
                </a>
              </div>
              <span className="h-fit shrink-0 rounded-full bg-sun px-3 py-1 text-sm font-bold">
                {cafe.reviews > 0 ? `★ ${cafe.rating}` : "New"}
              </span>
            </div>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              {cafe.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {cafe.amenities.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm font-bold shadow-sm"
                >
                  {a === "Wi-Fi" ? <Wifi size={16} /> : a === "Power" ? <Zap size={16} /> : <CheckCircle2 size={16} />}
                  {a}
                </span>
              ))}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Info icon={<Clock3 />} title="Work hours" text={cafe.hours} />
              <Info icon={<Volume2 />} title="Vibe" text={cafe.vibe} />
              <Info icon={<Coffee />} title="What's included" text="Reserved seat, Wi-Fi & workspace access" />
            </div>
            <section className="mt-12">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Armchair size={22} />
                </span>
                <div>
                  <h2 className="font-display text-3xl font-bold">Choose a seat</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tap one or more chairs (up to {MAX_SEATS}) that suit your work style. The layout matches a real café setup.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-border bg-card p-4 shadow-sm">
                <SeatLegendRow />
                <div className="mt-4">
                  <SeatGrid cafe={cafe} selected={pickedIds} onSelect={(s) => toggleSeat(s.id)} heldSeatIds={heldSeatIds} />
                </div>
              </div>
            </section>
            <section className="mt-10 rounded-xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                  <Armchair size={17} />
                </span>
                Café seating rules
              </h2>
              <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <li>• Each chair you select is one person; book several chairs for a group.</li>
                <li>• Please use headphones for calls and audio.</li>
                <li>• Outside food is not permitted.</li>
              </ul>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="rounded-xl border-2 border-foreground bg-card p-6 shadow-[8px_8px_0_var(--sky)]">
              <h2 className="font-display text-2xl font-bold">Reserve your seat</h2>
              <label className="mt-5 block text-sm font-bold">
                Date
                <input
                  type="date"
                  min={today()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
                />
              </label>
              <p className="mt-5 text-sm font-bold">Start time</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={cn(
                      "min-h-10 rounded-md border text-xs font-bold transition-colors",
                      time === t ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-5 text-sm font-bold">Duration</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDuration(n)}
                    className={cn(
                      "min-h-10 rounded-md border text-sm font-bold transition-colors",
                      duration === n ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}
                  >
                    {n} hr
                  </button>
                ))}
              </div>
              <div className="my-5 border-y border-border py-4">
                <BookingSummary
                  cafe={cafe}
                  date={formatDate(date)}
                  time={time}
                  duration={duration}
                  seatName={seatSummary || undefined}
                />
              </div>
              <PriceBreakdown cafe={cafe} duration={duration} />
              <Button onClick={continueBooking} disabled={pickedIds.length === 0} className="mt-5 w-full font-bold">
                Reserve seat (Pay at café)
              </Button>
              <p className="mt-3 flex justify-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck size={14} />
                Free reservation · Pay on arrival
              </p>
            </div>
            <div className="mt-6">
              <SeatingLegendCard />
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card p-3 shadow-2xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="font-bold">{cafe.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {seatSummary ? `${seatSummary} · ${time} IST` : "Select a seat above"}
            </p>
          </div>
          <Button disabled={pickedIds.length === 0} onClick={continueBooking} className="font-bold">
            Reserve
          </Button>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <span className="text-primary">{icon}</span>
      <p className="mt-3 text-sm font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
