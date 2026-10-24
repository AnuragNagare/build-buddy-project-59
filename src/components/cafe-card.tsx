import { Link } from "@tanstack/react-router";
import { Crown, MapPin, Star, Wifi, Zap } from "lucide-react";
import type { Cafe } from "@/lib/workspot-data";
import { cn } from "@/lib/utils";

export function CafeCard({ cafe, selected, onSelect }: { cafe: Cafe; selected?: boolean; onSelect?: () => void }) {
  return (
    <article
      onClick={onSelect}
      className={cn(
        "group overflow-hidden rounded-xl border-2 bg-card transition-all hover:-translate-y-1 hover:shadow-xl",
        selected ? "border-primary shadow-lg" : "border-transparent shadow-sm"
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={cafe.image}
          alt={`Workspace seating at ${cafe.name}`}
          loading="lazy"
          width={1200}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-available px-3 py-1 text-xs font-bold text-available-foreground">
          {cafe.availability}
        </span>
        {cafe.tier === "pro" && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-md">
            <Crown size={12} className="fill-white text-white" /> Pro
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-bold">{cafe.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin size={14} /> {cafe.area} · {cafe.distance} km
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold">
            <Star size={15} className="fill-sun text-sun-deep" />
            {cafe.rating}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {cafe.amenities.slice(0, 3).map((a) => (
            <span key={a} className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold">
              {a === "Wi-Fi" ? <Wifi className="mr-1 inline" size={12} /> : a === "Power" ? <Zap className="mr-1 inline" size={12} /> : null}
              {a}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-end">
          <Link
            to="/cafes/$slug"
            params={{ slug: cafe.slug }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Choose seat
          </Link>
        </div>
      </div>
    </article>
  );
}
