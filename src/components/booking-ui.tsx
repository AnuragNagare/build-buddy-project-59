import { Armchair, Check, Clock3, Columns2, Grid2x2, Sofa, Users, X, type LucideIcon } from "lucide-react";
import { floorPlan, seatKindLabels, type Cafe, type Seat, type SeatKind } from "@/lib/workspot-data";
import { cn } from "@/lib/utils";

export const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export const seatKindIcons: Record<SeatKind, LucideIcon> = {
  single: Armchair,
  table2: Columns2,
  table4: Grid2x2,
  communal: Users,
  booth: Sofa,
};

const statusLegend = [
  { label: "Available", dot: "bg-available" },
  { label: "Unavailable", dot: "bg-coral" },
  { label: "Selected", dot: "bg-primary" },
  { label: "Not offered", dot: "bg-muted-foreground/40" },
];

export function SeatLegendRow() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
      {statusLegend.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <i className={cn("size-3 rounded-full", item.dot)} /> {item.label}
        </span>
      ))}
    </div>
  );
}

/** Marker styling shared by the customer picker and the owner's layout editor. */
export const seatMarkerClass = (status: Seat["status"], selected: boolean) =>
  selected
    ? "border-primary-deep bg-primary text-primary-foreground ring-4 ring-primary/30 scale-125"
    : status === "available"
      ? "border-available-deep bg-available text-available-foreground hover:scale-125"
      : status === "unavailable"
        ? "border-coral bg-coral/70 text-primary-foreground"
        : "border-border bg-muted-foreground/40 text-primary-foreground";

export function FloorPlanCanvas({
  children,
  className,
  canvasRef,
  onPointerMove,
  onPointerUp,
}: {
  children: React.ReactNode;
  className?: string;
  canvasRef?: React.Ref<HTMLDivElement>;
  onPointerMove?: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp?: React.PointerEventHandler<HTMLDivElement>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl">
      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={cn("relative min-w-[640px] overflow-hidden rounded-xl border border-border", className)}
        style={{ aspectRatio: floorPlan.aspect }}
      >
        <img
          src={floorPlan.image}
          alt="Top-down café floor plan"
          width={1536}
          height={1024}
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
        {children}
      </div>
    </div>
  );
}

/**
 * Floor-plan seat picker. `heldSeatIds` are seats already booked for the chosen date and time;
 * they show as unavailable even though the café offers them.
 */
export function SeatGrid({
  cafe,
  selected,
  onSelect,
  heldSeatIds,
}: {
  cafe: Cafe;
  selected: string[];
  onSelect: (seat: Seat) => void;
  heldSeatIds?: ReadonlySet<string>;
}) {
  return (
    <FloorPlanCanvas>
      {cafe.seats.map((seat) => {
        const status: Seat["status"] =
          seat.status === "available" && heldSeatIds?.has(seat.id) ? "unavailable" : seat.status;
        const isSelected = selected.includes(seat.id) && status === "available";
        const disabled = status !== "available";
        const stateText = isSelected ? "Selected" : status.replace("-", " ");
        return (
          <button
            key={seat.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(seat)}
            aria-label={`${seat.name}: ${stateText}`}
            title={`${seat.name} — ${stateText}`}
            className={cn(
              "absolute grid aspect-square w-[3.1%] min-w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 shadow-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
              seatMarkerClass(status, isSelected),
              disabled && "cursor-not-allowed"
            )}
            style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
          >
            {isSelected ? <Check size={12} strokeWidth={3} /> : status === "unavailable" ? <X size={11} strokeWidth={3} /> : null}
          </button>
        );
      })}
    </FloorPlanCanvas>
  );
}

export function SeatingLegendCard() {
  const items = [
    { label: "Available seat", hint: "Free to book", dot: "bg-available" },
    { label: "Selected seat", hint: "Your chosen seat", dot: "bg-primary" },
    { label: "Unavailable seat", hint: "Already booked", dot: "bg-coral" },
    { label: "Not offered", hint: "Not available for booking", dot: "bg-muted-foreground/40" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-display text-lg font-bold">Seating legend</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-secondary">
              <i className={cn("size-4 rounded-full", item.dot)} />
            </span>
            <div>
              <p className="text-sm font-bold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 border-t border-border pt-5 font-display text-lg font-bold">Seating types</h2>
      <ul className="mt-4 space-y-3">
        {(Object.keys(seatKindLabels) as SeatKind[]).map((kind) => {
          const Icon = seatKindIcons[kind];
          return (
            <li key={kind} className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-secondary text-primary">
                <Icon size={17} />
              </span>
              <div>
                <p className="text-sm font-bold">{seatKindLabels[kind].label}</p>
                <p className="text-xs text-muted-foreground">{seatKindLabels[kind].hint}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Price breakdown — hidden for now, reserved for when pricing is configured per venue */
export function PriceBreakdown(_props: { cafe: Cafe; duration: number }) {
  return null;
}

export function BookingSummary({ cafe, date, time, duration, seatName }: { cafe: Cafe; date: string; time: string; duration: number; seatName?: string | undefined }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-lg font-bold">{cafe.name}</p>
        <p className="text-sm text-muted-foreground">{cafe.area}</p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Clock3 size={16} className="text-primary" />
        {date || "Choose a date"} · {time} IST · {duration}h
      </div>
      {seatName && <p className="rounded-lg bg-sky/15 px-3 py-2 text-sm font-bold">Seat: {seatName}</p>}
    </div>
  );
}
