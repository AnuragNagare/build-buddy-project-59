import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Armchair,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  IndianRupee,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Send,
  Settings2,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cafes, getCafe, type Cafe, type PendingReviewSubmission } from "@/lib/workspot-data";
import { cn } from "@/lib/utils";
import {
  getLiveCafes,
  submitVendorReviewForApproval,
  getPendingReviewsForCafe,
} from "@/lib/firebase-service";

export const Route = createFileRoute("/manager")({
  head: () => ({
    meta: [
      { title: "Café Manager Dashboard — WorkSpot" },
      {
        name: "description",
        content: "Manage café bookings, reviews, seats, hours and pricing in the WorkSpot operator portal.",
      },
    ],
  }),
  component: Manager,
});

type Tab = "Overview" | "Bookings" | "Venue" | "Seats & availability" | "Reviews & Reputation";

function Manager() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [cafeSlug, setCafeSlug] = useState<string>("subko-coffee-bandra");
  const [currentCafe, setCurrentCafe] = useState<Cafe>(getCafe("subko-coffee-bandra"));
  const [tier, setTier] = useState<"free" | "pro">("pro"); // Demo default to Pro so reviews curation is immediately testable

  const [seats, setSeats] = useState(
    (currentCafe?.seats ?? []).map((s) => ({ ...s, active: s.status !== "not-offered" }))
  );
  const [modal, setModal] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);

  // Load live cafe data if available
  useEffect(() => {
    let isMounted = true;
    getLiveCafes().then((all) => {
      if (!isMounted) return;
      const found = all.find((c) => c.slug === cafeSlug);
      if (found) {
        setCurrentCafe(found);
        if (found.tier) setTier(found.tier);
        setSeats((found.seats ?? []).map((s) => ({ ...s, active: s.status !== "not-offered" })));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [cafeSlug]);

  const nav: [Tab, typeof LayoutDashboard][] = [
    ["Overview", LayoutDashboard],
    ["Bookings", CalendarDays],
    ["Venue", MapPin],
    ["Seats & availability", Armchair],
    ["Reviews & Reputation", MessageSquare],
  ];

  return (
    <div className="min-h-[85vh] bg-card">
      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[280px_1fr]">
        {/* Left Sidebar */}
        <aside className="border-b border-border bg-foreground p-5 text-primary-foreground lg:min-h-[calc(100vh-72px)] lg:border-b-0 lg:border-r">
          <div className="border-b border-primary-foreground/15 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">
              Host Venue
            </span>
            <h2 className="mt-1 font-display text-lg font-bold text-primary-foreground">
              {currentCafe?.name || "Subko Coffee Craft House"}
            </h2>
            <div className="mt-2 flex items-center justify-between">
              {tier === "pro" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/40">
                  <Crown size={12} className="fill-amber-400 text-amber-400" /> Pro Tier (Verified)
                </span>
              ) : (
                <span className="inline-block rounded-full bg-primary-foreground/10 px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground/70">
                  Free Tier (₹0)
                </span>
              )}

              {/* Simulation Mode Switch */}
              <button
                type="button"
                onClick={() => setTier((t) => (t === "pro" ? "free" : "pro"))}
                className="text-[10px] font-semibold text-primary underline hover:text-primary/80"
                title="Switch tier to test both free and pro operator views"
              >
                Switch to {tier === "pro" ? "Free" : "Pro"}
              </button>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pt-4 lg:block lg:space-y-1.5">
            {nav.map(([name, Icon]) => (
              <button
                key={name}
                onClick={() => setTab(name)}
                className={cn(
                  "flex min-h-11 shrink-0 items-center justify-between rounded-xl px-3.5 text-xs font-bold transition-colors lg:w-full",
                  tab === name
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/10"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={17} />
                  {name}
                </span>
                {name === "Reviews & Reputation" && (
                  <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                    Pro
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-8 hidden rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-3.5 text-xs lg:block">
            <p className="font-bold text-primary-foreground">Super Admin Link</p>
            <p className="mt-1 text-[11px] text-primary-foreground/60 leading-relaxed">
              Reviews submitted here will immediately appear in the Super Admin queue for moderation.
            </p>
            <Link
              to="/admin"
              className="mt-2.5 inline-flex items-center gap-1 font-bold text-primary hover:underline"
            >
              Open Admin Approval Queue →
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 p-5 sm:p-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold tracking-wider text-primary uppercase">
                  Operator Dashboard
                </p>
                {tier === "pro" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    <Crown size={11} className="fill-amber-500 text-amber-500" /> ₹49 Pro Tier
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    Free Standard Tier
                  </span>
                )}
              </div>
              <h1 className="mt-1 truncate font-display text-2xl font-bold sm:text-3xl">{tab}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded-full bg-available/20 border border-available/30 px-3 py-1 text-xs font-bold text-available-foreground">
                ● Venue Open
              </span>
            </div>
          </div>

          {tab === "Overview" && <Overview checked={checked.length} />}
          {tab === "Bookings" && <Bookings checked={checked} setChecked={setChecked} />}
          {tab === "Venue" && <Venue cafe={currentCafe} />}
          {tab === "Seats & availability" && (
            <Seats seats={seats} setSeats={setSeats} setModal={setModal} />
          )}
          {tab === "Reviews & Reputation" && (
            <ReviewsReputationTab
              cafe={currentCafe}
              tier={tier}
              onUpgrade={() => setTier("pro")}
            />
          )}
        </main>
      </div>

      {/* Add Seat Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSeats((s) => [
                ...s,
                {
                  id: `s${s.length + 1}`,
                  name: `Desk ${s.length + 1}`,
                  type: "Desk",
                  status: "available",
                  x: 30,
                  y: 30,
                  active: true,
                },
              ]);
              setModal(false);
            }}
            className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border"
          >
            <div className="flex justify-between">
              <h2 className="font-display text-2xl font-bold">Add a seat</h2>
              <button type="button" aria-label="Close" onClick={() => setModal(false)}>
                <X />
              </button>
            </div>
            <label className="mt-6 block text-sm font-bold">
              Seat name
              <input
                required
                defaultValue={`Desk ${seats.length + 1}`}
                className="mt-2 min-h-12 w-full rounded-lg border border-border px-4"
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Seat type
              <select className="mt-2 min-h-12 w-full rounded-lg border border-border px-4">
                <option>Desk</option>
                <option>Window</option>
                <option>Community</option>
              </select>
            </label>
            <Button className="mt-6 w-full" type="submit">
              <Plus size={17} />
              Add seat
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-Components
// -----------------------------------------------------------------------------

function Overview({ checked }: { checked: number }) {
  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [CalendarDays, "Today's bookings", 12],
          [IndianRupee, "Est. revenue", "₹8,940"],
          [Armchair, "Seats listed", 10],
          [BarChart3, "Occupancy", "64%"],
        ].map(([Icon, label, value]) => {
          const I = Icon as typeof CalendarDays;
          return (
            <article key={String(label)} className="rounded-xl border border-border bg-background p-5">
              <I className="text-primary" />
              <p className="mt-5 text-sm text-muted-foreground">{String(label)}</p>
              <p className="mt-1 font-display text-3xl font-bold">{String(value)}</p>
            </article>
          );
        })}
      </div>
      <div className="mt-6 rounded-xl border border-border bg-background p-6">
        <h2 className="font-display text-xl font-bold">Today at a glance</h2>
        <div className="mt-5 grid gap-3">
          {["10:00 · Window 1 · Aanya S.", "11:00 · Community 2 · Rohan K.", "14:00 · Bar 1 · Neha M."].map(
            (x, i) => (
              <div
                key={x}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border py-3 last:border-0"
              >
                <span className={cn("min-w-0 truncate text-sm font-semibold", checked > i && "line-through opacity-50")}>
                  {x}
                </span>
                <span className="text-xs font-bold text-primary">
                  {checked > i ? "Checked in" : "Expected"}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

function Bookings({ checked, setChecked }: { checked: string[]; setChecked: (v: string[]) => void }) {
  const rows = [
    "WS-4821 · Aanya Shah",
    "WS-5174 · Rohan Khanna",
    "WS-5208 · Neha Mehta",
    "WS-5301 · Kabir Rao",
  ];
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-border bg-background">
      <div className="grid grid-cols-[1fr_auto] bg-secondary p-4 text-xs font-bold uppercase">
        <span>Guest & booking</span>
        <span>Action</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-border p-4"
        >
          <div className="min-w-0">
            <p className="truncate font-bold">{r}</p>
            <p className="text-xs text-muted-foreground">
              {10 + i}:00 IST · {i + 1} hour · Seat {i + 1}
            </p>
          </div>
          <Button
            variant={checked.includes(r) ? "ghost" : "secondary"}
            onClick={() =>
              setChecked(checked.includes(r) ? checked.filter((x) => x !== r) : [...checked, r])
            }
          >
            {checked.includes(r) ? (
              <>
                <Check size={16} />
                Checked in
              </>
            ) : (
              "Check in"
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}

function Venue({ cafe }: { cafe?: Cafe }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="mt-8 max-w-2xl rounded-xl border border-border bg-background p-6">
      <h2 className="font-display text-xl font-bold">Venue profile</h2>
      <label className="mt-5 block text-sm font-bold">
        Work-friendly description
        <textarea
          defaultValue={cafe?.description || getCafe("subko-coffee-bandra").description}
          className="mt-2 min-h-28 w-full rounded-lg border border-border p-3"
        />
      </label>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">
          Opening time
          <input
            type="time"
            defaultValue="08:00"
            className="mt-2 min-h-11 w-full rounded-lg border border-border px-3"
          />
        </label>
        <label className="text-sm font-bold">
          Closing time
          <input
            type="time"
            defaultValue="20:00"
            className="mt-2 min-h-11 w-full rounded-lg border border-border px-3"
          />
        </label>
      </div>
      <Button
        onClick={() => {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1800);
        }}
        className="mt-6"
      >
        <Save size={17} />
        {saved ? "Saved" : "Save venue"}
      </Button>
    </div>
  );
}

function Seats({
  seats,
  setSeats,
  setModal,
}: {
  seats: (typeof cafes)[number]["seats"][number][] & { active?: boolean }[];
  setSeats: React.Dispatch<React.SetStateAction<any[]>>;
  setModal: (v: boolean) => void;
}) {
  const [price, setPrice] = useState(149);
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Seats</h2>
          <Button onClick={() => setModal(true)}>
            <Plus size={16} />
            Add seat
          </Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {seats.map((s: any) => (
            <div
              key={s.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-bold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.type}</p>
              </div>
              <button
                aria-label={`Toggle ${s.name}`}
                onClick={() =>
                  setSeats((v: any[]) =>
                    v.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x))
                  )
                }
                className={cn(
                  "h-7 w-12 rounded-full p-1 transition-colors",
                  s.active ? "bg-available" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "block size-5 rounded-full bg-card transition-transform",
                    s.active && "translate-x-5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="font-display text-xl font-bold">Availability</h2>
        <label className="mt-5 block text-sm font-bold">
          Off-peak start
          <input
            type="time"
            defaultValue="10:00"
            className="mt-2 min-h-11 w-full rounded-lg border border-border px-3"
          />
        </label>
        <label className="mt-5 block text-sm font-bold">
          Off-peak end
          <input
            type="time"
            defaultValue="17:00"
            className="mt-2 min-h-11 w-full rounded-lg border border-border px-3"
          />
        </label>
        <label className="mt-5 block text-sm font-bold">
          Hourly price <span className="float-right text-primary">₹{price}</span>
          <input
            type="range"
            min="99"
            max="299"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-3 w-full accent-primary"
          />
        </label>
        <Button className="mt-6 w-full">
          <Settings2 size={17} />
          Update availability
        </Button>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Pro Reviews & Reputation Tab with Super Admin Moderation
// -----------------------------------------------------------------------------

function ReviewsReputationTab({
  cafe,
  tier,
  onUpgrade,
}: {
  cafe: Cafe;
  tier: "free" | "pro";
  onUpgrade: () => void;
}) {
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<PendingReviewSubmission[]>([]);

  // Load reviews submitted for this cafe
  useEffect(() => {
    let isMounted = true;
    getPendingReviewsForCafe(cafe.slug).then((subs) => {
      if (isMounted) setSubmissions(subs);
    });
    return () => {
      isMounted = false;
    };
  }, [cafe.slug, successMsg]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) {
      setErrorMsg("Please provide both author name and review text.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await submitVendorReviewForApproval({
        cafeSlug: cafe.slug,
        cafeName: cafe.name,
        author: author.trim(),
        rating,
        date: new Date().toISOString().slice(0, 10),
        comment: comment.trim(),
      });

      setSubmitting(false);
      if (res.success) {
        setSuccessMsg(
          `Review submitted for Super Admin approval (ID: ${res.id}). Once approved, it will be automatically published to your live café page!`
        );
        setAuthor("");
        setComment("");
        setRating(5);
      } else {
        setErrorMsg(res.error || "Failed to submit review.");
      }
    } catch (err: unknown) {
      setSubmitting(false);
      const e = err as Error;
      setErrorMsg(e.message || "An unexpected error occurred.");
    }
  };

  // If Free Tier, show upgrade teaser
  if (tier === "free") {
    return (
      <div className="mt-8 max-w-3xl">
        <div className="overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-background p-8 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-600">
              <Crown size={22} className="fill-amber-500 text-amber-500" />
            </span>
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pro Feature • ₹49 INR
              </span>
              <h2 className="font-display text-2xl font-extrabold text-foreground">
                Unlock Custom Review Curation
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Your café is currently on the <strong className="text-foreground">Free Tier</strong>.
            While free listings are visible on the map, only{" "}
            <strong className="text-foreground">Pro Tier Partners (₹49)</strong> can submit and
            curate verified guest reviews, ratings, and customer testimonials.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 text-xs">
            <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-3.5">
              <Star size={16} className="text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Submit Guest Reviews</p>
                <p className="text-muted-foreground mt-0.5">
                  Showcase real customer stories, Wi-Fi speed feedback, and seating praise.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-3.5">
              <Crown size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Verified Pro Badge</p>
                <p className="text-muted-foreground mt-0.5">
                  Stand out with the golden Pro badge on your café card and search results.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              onClick={onUpgrade}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-6 min-h-11 shadow-sm"
            >
              <Crown size={15} className="fill-white" />
              Activate Pro Tier Now (₹49)
            </Button>
            <Link
              to="/partner/register"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-xs font-bold hover:bg-muted"
            >
              View All Tier Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pro Tier: Review Submission Form & Moderation History
  return (
    <div className="mt-8 max-w-4xl space-y-8">
      {/* Top Pro Notice */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={18} className="fill-amber-500 text-amber-500 flex-shrink-0" />
            <p className="font-bold text-foreground">
              Pro Partner Feature: Customer Reviews & Reputation Curation
            </p>
          </div>
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
            Admin Moderated
          </span>
        </div>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          As a Pro Partner, you can submit authentic customer reviews and ratings for your café.
          To maintain platform credibility and trust for all remote workers, all submissions are
          verified and approved by the Super Admin before appearing on your live listing.
        </p>
      </div>

      {/* Review Submission Form */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-display text-lg font-bold">Submit a Customer Review for Approval</h2>
            <p className="text-xs text-muted-foreground">
              Add a customer testimonial from your guestbook or Google review.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-mono font-bold text-muted-foreground">
            Venue: {cafe.name}
          </span>
        </div>

        {successMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-available/30 bg-available/10 p-4 text-xs font-semibold text-available-foreground">
            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-available-deep" />
            <div>
              <p>{successMsg}</p>
              <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                Tip: You can switch to the Super Admin tab to approve this submission right away.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Customer / Guest Name *
              </label>
              <input
                required
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Siddharth M. (Full-Stack Dev)"
                className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-4 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Star Rating
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
                      className={cn(
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30 hover:text-amber-400"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 font-mono text-xs font-bold text-foreground">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground">
              Customer Feedback / Testimonial *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. High-speed Wi-Fi, comfortable ergonomic chairs, and calm vibes during daytime work hours."
              className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-primary leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6 min-h-11"
            >
              <Send size={15} />
              {submitting ? "Submitting for Approval…" : "Submit Review for Super Admin Approval"}
            </Button>
          </div>
        </form>
      </section>

      {/* Submitted Reviews Queue for this Venue */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-display text-lg font-bold">Your Review Submissions & Status</h2>
            <p className="text-xs text-muted-foreground">
              Track the moderation status of customer reviews you've submitted.
            </p>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-foreground">
            {submissions.length} Submissions
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <MessageSquare size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p>No custom reviews submitted yet for this café.</p>
            <p className="mt-1">Use the form above to submit your first guest testimonial!</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {submissions.map((sub) => (
              <div key={sub.id} className="py-4 first:pt-2 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{sub.author}</span>
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: sub.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground">· {sub.date}</span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {sub.status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        <Clock size={11} /> Pending Super Admin Approval
                      </span>
                    )}
                    {sub.status === "approved" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-available/20 border border-available/40 px-2.5 py-0.5 text-[11px] font-bold text-available-foreground">
                        <CheckCircle2 size={11} /> Approved & Live on Venue Page
                      </span>
                    )}
                    {sub.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
                        <X size={11} /> Rejected by Admin
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed italic">
                  "{sub.comment}"
                </p>

                <p className="mt-1.5 text-[10px] font-mono text-muted-foreground">
                  Submission ID: {sub.id} · Submitted at {new Date(sub.submittedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Currently Live Reviews on Cafe Profile */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold">Currently Published Reviews on WorkSpot</h2>
        <p className="text-xs text-muted-foreground">
          These reviews are currently visible to all customers booking at {cafe.name}.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {cafe.reviewsList?.map((rev) => (
            <div key={rev.id} className="rounded-xl border border-border bg-background p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{rev.author}</span>
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-muted-foreground leading-relaxed line-clamp-3">
                "{rev.comment}"
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">{rev.date}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}