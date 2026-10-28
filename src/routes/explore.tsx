import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { List, LocateFixed, Map as MapIcon, Search, SlidersHorizontal } from "lucide-react";
import { CafeCard } from "@/components/cafe-card";
import { Button } from "@/components/ui/button";
import { cafes as defaultCafes, matchesCafeSearch } from "@/lib/workspot-data";
import { getLiveCafes } from "@/lib/firebase-service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explore cafés — WorkSpot" },
      { name: "description", content: "Browse work-friendly cafés and available seats across Mumbai." },
      { property: "og:title", content: "Explore Mumbai WorkSpots" },
      { property: "og:description", content: "Compare nearby café workspaces, amenities and hourly prices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [radius, setRadius] = useState(50);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState<string[]>([]);

  // Fetch live cafes with default mock data as placeholder
  const { data: allCafes = defaultCafes } = useQuery({
    queryKey: ["cafes"],
    queryFn: getLiveCafes,
    initialData: defaultCafes,
  });

  const [selected, setSelected] = useState(allCafes[0]?.slug ?? "");

  const shown = useMemo(
    () =>
      allCafes.filter(
        (c) =>
          matchesCafeSearch(c, query) &&
          c.distance <= radius &&
          filters.every((f) => c.amenities.includes(f as never))
      ),
    [allCafes, query, radius, filters]
  );

  const toggle = (f: string) =>
    setFilters((v) => (v.includes(f) ? v.filter((x) => x !== f) : [...v, f]));

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <label className="flex min-w-0 items-center gap-2 rounded-lg border-2 border-foreground bg-card px-4">
          <Search size={19} />
          <span className="sr-only">Search areas or cafés</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bandra, Andheri, Lower Parel..."
            className="min-h-12 min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          aria-label="Search radius"
          className="min-h-12 rounded-lg border-2 border-foreground bg-card px-4 font-bold"
        >
          {[
            { label: "Within 3 km", val: 3 },
            { label: "Within 5 km", val: 5 },
            { label: "Within 10 km", val: 10 },
            { label: "Within 25 km", val: 25 },
            { label: "All Mumbai (50 km)", val: 50 },
          ].map(({ label, val }) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-lg border-2 border-foreground bg-card px-4">
          <span className="text-sm font-bold">Date</span>
          <input type="date" className="bg-transparent" />
        </label>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-card">
          <SlidersHorizontal size={18} />
        </span>
        {["Wi-Fi", "Power", "AC", "Quiet", "Food"].map((f) => (
          <button
            key={f}
            onClick={() => toggle(f)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors",
              filters.includes(f)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 rounded-full bg-foreground p-1 text-primary-foreground shadow-xl lg:hidden">
        <button
          onClick={() => setMobileView("list")}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold",
            mobileView === "list" && "bg-primary"
          )}
        >
          <List size={17} />
          List
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold",
            mobileView === "map" && "bg-primary"
          )}
        >
          <MapIcon size={17} />
          Map
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
        <div className={cn("space-y-4", mobileView === "map" && "hidden lg:block")}>
          <div>
            <h1 className="font-display text-3xl font-bold">WorkSpots near you</h1>
            <p className="text-sm text-muted-foreground">{shown.length} venues found · Prices in INR</p>
          </div>
          {shown.length ? (
            shown.map((c) => (
              <CafeCard
                key={c.slug}
                cafe={c}
                selected={selected === c.slug}
                onSelect={() => setSelected(c.slug)}
              />
            ))
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
              <Search className="mx-auto text-muted-foreground" />
              <h2 className="mt-4 font-display text-xl font-bold">No WorkSpots found</h2>
              <p className="mt-2 text-sm text-muted-foreground">Try a wider radius or clear a filter.</p>
              <Button
                className="mt-5"
                onClick={() => {
                  setRadius(10);
                  setFilters([]);
                  setQuery("");
                }}
              >
                Reset search
              </Button>
            </div>
          )}
        </div>

        <div
          className={cn(
            "sticky top-24 h-[calc(100vh-7rem)] overflow-hidden rounded-xl border-2 border-foreground bg-sky/20",
            mobileView === "list" && "hidden lg:block"
          )}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="absolute left-[20%] top-0 h-full w-5 rotate-12 bg-card/80" />
          <div className="absolute left-0 top-[55%] h-6 w-full -rotate-6 bg-card/80" />
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs font-bold shadow">
            <LocateFixed size={15} className="text-primary" />
            Mumbai
          </div>
          {shown.map((c, i) => (
            <button
              key={c.slug}
              onClick={() => setSelected(c.slug)}
              aria-label={`Select ${c.name} on map`}
              className={cn(
                "absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-foreground font-bold shadow-lg transition-transform hover:scale-110",
                selected === c.slug ? "scale-125 bg-coral" : "bg-primary text-primary-foreground"
              )}
              style={{ left: `${c.marker.x}%`, top: `${c.marker.y}%` }}
            >
              {i + 1}
            </button>
          ))}
          {selected && (
            <div className="absolute bottom-5 left-5 right-5 z-10 rounded-xl border-2 border-foreground bg-card p-4 shadow-xl">
              <p className="font-display text-lg font-bold">
                {allCafes.find((c) => c.slug === selected)?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {allCafes.find((c) => c.slug === selected)?.area}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}