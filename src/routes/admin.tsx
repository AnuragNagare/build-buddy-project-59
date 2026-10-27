import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Armchair,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coffee,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  IndianRupee,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Trash2,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth, ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD } from "@/lib/admin-auth-store";
import {
  getAllBookingsAdmin,
  updateBookingStatusAdmin,
  getLiveCafes,
  upsertCafeAdmin,
  deleteCafeAdmin,
  getVendorApplicationsAdmin,
  updateVendorApplicationStatus,
  approveAndPublishVendorCafe,
  getPendingReviewSubmissionsAdmin,
  approvePendingReviewAdmin,
  rejectPendingReviewAdmin,
} from "@/lib/firebase-service";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  formatDate,
  type Amenity,
  type Cafe,
  type CafeReview,
  type Booking,
  type Seat,
  type VendorApplication,
  type PendingReviewSubmission,
} from "@/lib/workspot-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "WorkSpot — Super Admin Command Center" },
      {
        name: "description",
        content: "Master administration panel to monitor bookings, finances, café profiles, and customer reviews.",
      },
    ],
  }),
  component: AdminPage,
});

type AdminTab = "bookings" | "cafes" | "seats" | "reviews" | "vendors";

const ALL_AMENITIES: Amenity[] = ["Wi-Fi", "Power", "AC", "Quiet", "Food", "Ergonomic"];

function AdminPage() {
  const { admin, loading, login, logout } = useAdminAuth();

  if (loading) {
    return (
      <div className="grid min-h-[75vh] place-items-center">
        <LoaderCircle className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (!admin) {
    return <AdminLoginScreen onLogin={login} />;
  }

  return <AdminDashboard adminEmail={admin.email} onLogout={logout} />;
}

/* ========================================================================= */
/* 1. ADMIN LOGIN COMPONENT                                                  */
/* ========================================================================= */

function AdminLoginScreen({
  onLogin,
}: {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState(ADMIN_DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await onLogin(email, password);
    setBusy(false);
    if (!res.success) {
      setError(res.error || "Authentication failed. Check your admin credentials.");
    }
  };

  const handlePreFill = () => {
    setEmail(ADMIN_EMAIL);
    setPassword(ADMIN_DEFAULT_PASSWORD);
  };

  return (
    <div className="flex min-h-[82vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-card shadow-[10px_10px_0_var(--sun)]">
          <div className="bg-foreground p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                <ShieldCheck size={14} /> Master Access
              </span>
              <span className="text-xs text-primary-foreground/60">WorkSpot Admin</span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold">Admin Portal</h1>
            <p className="mt-1 text-xs text-primary-foreground/75">
              Sign in to manage venues, inspect bookings, and track platform revenue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground">
                  Admin Email
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@workspot.in"
                    className="min-h-12 w-full rounded-lg border-2 border-border bg-background pl-10 pr-4 text-sm font-semibold outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground">
                  Admin Password
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="min-h-12 w-full rounded-lg border-2 border-border bg-background pl-10 pr-10 text-sm font-semibold outline-none transition-colors focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button type="submit" disabled={busy} className="min-h-12 w-full text-sm font-bold">
                {busy ? (
                  <>
                    <LoaderCircle className="animate-spin" size={17} />
                    Authenticating…
                  </>
                ) : (
                  <>
                    <KeyRound size={17} />
                    Sign In as Administrator
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handlePreFill}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <Sparkles size={13} />
                Quick-fill configured credentials
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 2. ADMIN DASHBOARD WORKSPACE                                              */
/* ========================================================================= */

function AdminDashboard({
  adminEmail,
  onLogout,
}: {
  adminEmail: string;
  onLogout: () => void;
}) {
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState<AdminTab>("bookings");

  // Fetch all live bookings across the entire platform
  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: getAllBookingsAdmin,
  });

  // Fetch all venues
  const { data: cafes = [], isLoading: cafesLoading, refetch: refetchCafes } = useQuery({
    queryKey: ["admin", "cafes"],
    queryFn: getLiveCafes,
  });

  // Fetch all vendor registration applications
  const {
    data: vendorApps = [],
    isLoading: vendorAppsLoading,
    refetch: refetchVendorApps,
  } = useQuery({
    queryKey: ["admin", "vendorApps"],
    queryFn: getVendorApplicationsAdmin,
  });

  // Fetch all pending review submissions across Pro venues
  const {
    data: pendingReviews = [],
    isLoading: pendingReviewsLoading,
    refetch: refetchPendingReviews,
  } = useQuery({
    queryKey: ["admin", "pendingReviews"],
    queryFn: getPendingReviewSubmissionsAdmin,
  });

  const pendingAppsCount = useMemo(
    () => vendorApps.filter((a) => a.status === "pending").length,
    [vendorApps]
  );

  const pendingReviewsCount = useMemo(
    () => pendingReviews.filter((r) => r.status === "pending").length,
    [pendingReviews]
  );

  const handleRefreshAll = () => {
    refetchBookings();
    refetchCafes();
    refetchVendorApps();
    refetchPendingReviews();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Admin Control Bar */}
      <section className="border-b border-border bg-foreground px-4 py-3 text-primary-foreground sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold">WorkSpot Command Center</span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-primary">
                  Master
                </span>
              </div>
              <p className="text-xs text-primary-foreground/60">{adminEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold sm:inline-flex",
                isFirebaseConfigured
                  ? "bg-available/20 text-available"
                  : "bg-sun/20 text-sun"
              )}
            >
              <i className="size-2 rounded-full bg-current" />
              {isFirebaseConfigured ? "Firestore Live" : "Local Storage Demo"}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshAll}
              className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <RefreshCw size={15} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <a
              href="/explore"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-primary-foreground/20 px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Live App <ExternalLink size={13} />
            </a>

            <Button
              variant="destructive"
              size="sm"
              onClick={onLogout}
              className="h-8 gap-1 px-3 text-xs font-bold"
            >
              <LogOut size={14} />
              Exit
            </Button>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 sm:px-6">
          {[
            { id: "bookings", label: "Bookings & Finances", icon: IndianRupee, count: bookings.length },
            {
              id: "vendors",
              label: "Vendor Applications",
              icon: Store,
              count: pendingAppsCount,
              badgeHighlight: pendingAppsCount > 0,
            },
            { id: "cafes", label: "Café Profiles & Media", icon: Coffee, count: cafes.length },
            { id: "seats", label: "Seating Floor Plans", icon: Armchair },
            {
              id: "reviews",
              label: "Reviews & Reputation",
              icon: Star,
              count: pendingReviewsCount,
              badgeHighlight: pendingReviewsCount > 0,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as AdminTab)}
                className={cn(
                  "flex min-h-14 items-center gap-2.5 border-b-2 px-4 text-sm font-bold transition-colors whitespace-nowrap",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={17} />
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      tab.badgeHighlight
                        ? "bg-coral text-coral-foreground animate-pulse"
                        : active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {currentTab === "bookings" && (
          <AdminBookingsTab
            bookings={bookings}
            cafes={cafes}
            loading={bookingsLoading}
            onStatusChange={async (id, status) => {
              await updateBookingStatusAdmin(id, status);
              queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
            }}
          />
        )}

        {currentTab === "vendors" && (
          <AdminVendorsTab
            applications={vendorApps}
            loading={vendorAppsLoading}
            onApprove={async (appId) => {
              const res = await approveAndPublishVendorCafe(appId);
              if (res.success) {
                queryClient.invalidateQueries({ queryKey: ["admin", "vendorApps"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "cafes"] });
                queryClient.invalidateQueries({ queryKey: ["cafes"] });
              }
              return res;
            }}
            onStatusChange={async (appId, status) => {
              await updateVendorApplicationStatus(appId, status);
              queryClient.invalidateQueries({ queryKey: ["admin", "vendorApps"] });
            }}
          />
        )}

        {currentTab === "cafes" && (
          <AdminCafesTab
            cafes={cafes}
            loading={cafesLoading}
            onSaveCafe={async (cafe) => {
              await upsertCafeAdmin(cafe);
              queryClient.invalidateQueries({ queryKey: ["admin", "cafes"] });
              queryClient.invalidateQueries({ queryKey: ["cafes"] });
            }}
            onDeleteCafe={async (slug) => {
              await deleteCafeAdmin(slug);
              queryClient.invalidateQueries({ queryKey: ["admin", "cafes"] });
              queryClient.invalidateQueries({ queryKey: ["cafes"] });
            }}
          />
        )}

        {currentTab === "seats" && (
          <AdminSeatsTab
            cafes={cafes}
            onSaveSeats={async (cafe) => {
              await upsertCafeAdmin(cafe);
              queryClient.invalidateQueries({ queryKey: ["admin", "cafes"] });
              queryClient.invalidateQueries({ queryKey: ["cafes"] });
            }}
          />
        )}

        {currentTab === "reviews" && (
          <AdminReviewsTab
            cafes={cafes}
            pendingReviews={pendingReviews}
            loadingPendingReviews={pendingReviewsLoading}
            onApprovePendingReview={async (id) => {
              await approvePendingReviewAdmin(id);
              queryClient.invalidateQueries({ queryKey: ["admin", "pendingReviews"] });
              queryClient.invalidateQueries({ queryKey: ["admin", "cafes"] });
              queryClient.invalidateQueries({ queryKey: ["cafes"] });
            }}
            onRejectPendingReview={async (id) => {
              await rejectPendingReviewAdmin(id);
              queryClient.invalidateQueries({ queryKey: ["admin", "pendingReviews"] });
            }}
            onUpdateCafeReviews={async (cafe) => {
              await upsertCafeAdmin(cafe);
              queryClient.invalidateQueries({ queryKey: ["admin", "cafes"] });
              queryClient.invalidateQueries({ queryKey: ["cafes"] });
            }}
          />
        )}
      </main>
    </div>
  );
}

/* ========================================================================= */
/* 3. TAB A: BOOKINGS & FINANCIAL MONITOR                                    */
/* ========================================================================= */

function AdminBookingsTab({
  bookings,
  cafes,
  loading,
  onStatusChange,
}: {
  bookings: Booking[];
  cafes: Cafe[];
  loading: boolean;
  onStatusChange: (id: string, status: "upcoming" | "past" | "cancelled") => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [selectedCafe, setSelectedCafe] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Financial calculations
  const totalRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => {
        if (b.totalPrice) return sum + b.totalPrice;
        const cafe = cafes.find((c) => c.slug === b.cafeSlug);
        const rate = cafe?.price || 149;
        return sum + rate * (b.duration || 2);
      }, 0);
  }, [bookings, cafes]);

  const upcomingCount = useMemo(
    () => bookings.filter((b) => b.status === "upcoming").length,
    [bookings]
  );
  const completedCount = useMemo(
    () => bookings.filter((b) => b.status === "past").length,
    [bookings]
  );
  const cancelledCount = useMemo(
    () => bookings.filter((b) => b.status === "cancelled").length,
    [bookings]
  );

  // Filtered ledger
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !search ||
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        (b.userPhone && b.userPhone.includes(search)) ||
        (b.userId && b.userId.toLowerCase().includes(search.toLowerCase())) ||
        b.cafeSlug.toLowerCase().includes(search.toLowerCase());

      const matchCafe = selectedCafe === "all" || b.cafeSlug === selectedCafe;
      const matchStatus = selectedStatus === "all" || b.status === selectedStatus;

      return matchSearch && matchCafe && matchStatus;
    });
  }, [bookings, search, selectedCafe, selectedStatus]);

  const handleStatusToggle = async (
    bookingId: string,
    newStatus: "upcoming" | "past" | "cancelled"
  ) => {
    setActionBusyId(bookingId);
    await onStatusChange(bookingId, newStatus);
    setActionBusyId(null);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border-2 border-foreground bg-card p-5 shadow-[5px_5px_0_var(--sun)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Total Gross Revenue
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-sun/30 text-sun-deep">
              <IndianRupee size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-extrabold">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">From all active reservations</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Total Bookings
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <LayoutDashboard size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold">{bookings.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Recorded reservations</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Upcoming Active
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-available/20 text-available-foreground">
              <Clock3 size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-available-foreground">
            {upcomingCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Awaiting check-in</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Completed / Cancelled
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold">
            {completedCount} <span className="text-base text-coral font-normal">/ {cancelledCount}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Completed vs Cancelled</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by User Phone (+91...), Booking Ref, or Venue..."
            className="min-h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <select
          value={selectedCafe}
          onChange={(e) => setSelectedCafe(e.target.value)}
          aria-label="Filter by Venue"
          className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-semibold"
        >
          <option value="all">All Venues ({cafes.length})</option>
          {cafes.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter by Booking Status"
          className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-semibold"
        >
          <option value="all">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Completed (Past)</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Master Bookings Ledger */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-secondary/50 p-4">
          <h2 className="font-display text-lg font-bold">
            All Reservations Ledger ({filteredBookings.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete log of user reservations with financial breakdown and venue attribution.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <LoaderCircle className="mx-auto animate-spin text-primary" size={28} />
            <p className="mt-3 text-sm text-muted-foreground">Loading master bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <LayoutDashboard className="mx-auto text-muted-foreground" size={32} />
            <p className="mt-3 text-base font-bold">No reservations match the filter criteria</p>
            <p className="text-xs text-muted-foreground">Try clearing search or changing status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/30 text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">User & Contact</th>
                  <th className="px-4 py-3">Café Venue</th>
                  <th className="px-4 py-3">Seat</th>
                  <th className="px-4 py-3">Date & Slot</th>
                  <th className="px-4 py-3">Amount (₹)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.map((b) => {
                  const cafe = cafes.find((c) => c.slug === b.cafeSlug);
                  const rate = cafe?.price || 149;
                  const price = b.totalPrice ?? rate * (b.duration || 2);
                  const isBusy = actionBusyId === b.id;

                  return (
                    <tr key={b.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3.5 font-mono font-bold text-foreground">
                        {b.id}
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">
                          {b.userPhone || "Verified User"}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {b.userId ? `UID: ${b.userId.slice(0, 8)}…` : "Local Session"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">
                          {cafe?.name || b.cafeSlug}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {cafe?.area || "Mumbai"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded bg-sky/20 px-2 py-0.5 text-xs font-bold text-sky-deep">
                          {b.seatName || `Seat ${b.seatId}`}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-bold text-foreground">{formatDate(b.date)}</div>
                        <span className="text-muted-foreground">
                          {b.time} IST · {b.duration}h
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-foreground">
                        ₹{price}
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          {b.paymentMethod || "Pay at counter"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize",
                            b.status === "upcoming"
                              ? "bg-available/30 text-available-foreground"
                              : b.status === "cancelled"
                              ? "bg-coral/20 text-coral-deep"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <i className="size-1.5 rounded-full bg-current" />
                          {b.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === "upcoming" && (
                            <>
                              <button
                                disabled={isBusy}
                                onClick={() => handleStatusToggle(b.id, "past")}
                                title="Mark Completed / Attended"
                                className="rounded p-1.5 text-available-deep hover:bg-available/20"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                disabled={isBusy}
                                onClick={() => handleStatusToggle(b.id, "cancelled")}
                                title="Force Cancel Reservation"
                                className="rounded p-1.5 text-coral-deep hover:bg-coral/20"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {b.status === "cancelled" && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleStatusToggle(b.id, "upcoming")}
                              title="Reactivate Reservation"
                              className="rounded p-1.5 text-primary hover:bg-primary/10"
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}
                          {b.status === "past" && (
                            <span className="text-xs text-muted-foreground">Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 4. TAB B: CAFÉ PROFILE MANAGEMENT & EDITOR                                */
/* ========================================================================= */

function AdminCafesTab({
  cafes,
  loading,
  onSaveCafe,
  onDeleteCafe,
}: {
  cafes: Cafe[];
  loading: boolean;
  onSaveCafe: (cafe: Cafe) => Promise<void>;
  onDeleteCafe: (slug: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null);
  const [isNew, setIsNew] = useState(false);

  const filteredCafes = useMemo(() => {
    return cafes.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.area.toLowerCase().includes(search.toLowerCase())
    );
  }, [cafes, search]);

  const handleAddNew = () => {
    const newSlug = `workspot-cafe-${Date.now().toString(36)}`;
    const newVenue: Cafe = {
      slug: newSlug,
      name: "New Partner Café",
      area: "Bandra West",
      address: "Hill Road, Bandra West, Mumbai",
      distance: 1.5,
      rating: 4.8,
      reviews: 12,
      price: 149,
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
      amenities: ["Wi-Fi", "Power", "AC", "Food"],
      availability: "6 seats open",
      vibe: "Bright & social",
      description: "A comfortable work-friendly café with fast Wi-Fi and dedicated desks.",
      hours: "8:00 AM–8:00 PM IST",
      marker: { x: 30, y: 40 },
      seats: [
        { id: "s1", name: "Window 1", type: "Window", status: "available", x: 15, y: 15 },
        { id: "s2", name: "Window 2", type: "Window", status: "available", x: 45, y: 15 },
        { id: "s3", name: "Desk 1", type: "Desk", status: "available", x: 15, y: 50 },
        { id: "s4", name: "Desk 2", type: "Desk", status: "available", x: 45, y: 50 },
      ],
      reviewsList: [
        { id: "r1", author: "Aanya Shah", rating: 5, date: "2026-10-10", comment: "Great workspace and reliable connection." },
      ],
    };

    setIsNew(true);
    setEditingCafe(newVenue);
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[280px] flex-1">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venue by name or locality..."
            className="min-h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <Button onClick={handleAddNew} className="gap-1.5 font-bold">
          <Plus size={17} />
          Add New Café Venue
        </Button>
      </div>

      {/* Venues Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <LoaderCircle className="mx-auto animate-spin text-primary" size={28} />
          <p className="mt-3 text-sm text-muted-foreground">Loading café profiles...</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCafes.map((cafe) => (
            <div
              key={cafe.slug}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                <img
                  src={cafe.image}
                  alt={cafe.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-md bg-foreground/80 px-2 py-0.5 text-xs font-bold text-primary-foreground backdrop-blur">
                  ₹{cafe.price}/hr
                </span>
                <span className="absolute right-3 top-3 rounded-md bg-sun px-2 py-0.5 text-xs font-bold text-foreground">
                  ★ {cafe.rating}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold">{cafe.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={13} /> {cafe.area} · {cafe.distance} km
                    </p>
                  </div>
                </div>

                <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground">
                  {cafe.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {cafe.amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      {cafe.seats.length} seats · {cafe.reviews} reviews
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setIsNew(false);
                          setEditingCafe(cafe);
                        }}
                        className="h-8 text-xs font-bold"
                      >
                        Edit Profile
                      </Button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${cafe.name}?`)) {
                            onDeleteCafe(cafe.slug);
                          }
                        }}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete café"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Café Editor Modal */}
      {editingCafe && (
        <CafeEditModal
          cafe={editingCafe}
          isNew={isNew}
          onClose={() => setEditingCafe(null)}
          onSave={async (updated) => {
            await onSaveCafe(updated);
            setEditingCafe(null);
          }}
        />
      )}
    </div>
  );
}

function CafeEditModal({
  cafe,
  isNew,
  onClose,
  onSave,
}: {
  cafe: Cafe;
  isNew: boolean;
  onClose: () => void;
  onSave: (updated: Cafe) => Promise<void>;
}) {
  const [formData, setFormData] = useState<Cafe>({ ...cafe });
  const [busy, setBusy] = useState(false);

  const toggleAmenity = (amenity: Amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave(formData);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border-2 border-foreground bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl font-bold">
              {isNew ? "Add New Café Venue" : `Edit Profile: ${cafe.name}`}
            </h2>
            <p className="text-xs text-muted-foreground">Slug: {formData.slug}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Café Name
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Locality / Area
              </label>
              <input
                required
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground">
              Full Address
            </label>
            <input
              required
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Hourly Price (₹)
              </label>
              <input
                required
                type="number"
                min={0}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Operating Hours
              </label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="8:00 AM–8:00 PM IST"
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Vibe / Atmosphere
              </label>
              <input
                type="text"
                value={formData.vibe}
                onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                placeholder="Bright & social"
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Availability Badge
              </label>
              <input
                type="text"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder="6 seats open"
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground">
              Cover Image URL
            </label>
            <input
              type="url"
              required
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
            {formData.image && (
              <div className="mt-2 aspect-[16/8] w-48 overflow-hidden rounded-lg border border-border bg-muted">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground">
              Amenities
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALL_AMENITIES.map((amenity) => {
                const checked = formData.amenities.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Map Marker X Position ({formData.marker?.x ?? 50}%)
              </label>
              <input
                type="range"
                min={5}
                max={95}
                value={formData.marker?.x ?? 50}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    marker: { ...formData.marker, x: Number(e.target.value) },
                  })
                }
                className="mt-2 w-full accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Map Marker Y Position ({formData.marker?.y ?? 50}%)
              </label>
              <input
                type="range"
                min={5}
                max={95}
                value={formData.marker?.y ?? 50}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    marker: { ...formData.marker, y: Number(e.target.value) },
                  })
                }
                className="mt-2 w-full accent-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="animate-spin" size={16} />
                  Saving…
                </>
              ) : (
                "Save Profile Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 5. TAB C: SEATING FLOOR PLANS MANAGER                                     */
/* ========================================================================= */

function AdminSeatsTab({
  cafes,
  onSaveSeats,
}: {
  cafes: Cafe[];
  onSaveSeats: (cafe: Cafe) => Promise<void>;
}) {
  const [selectedSlug, setSelectedSlug] = useState(cafes[0]?.slug ?? "");
  const selectedCafe = cafes.find((c) => c.slug === selectedSlug) ?? cafes[0];
  const [seats, setSeats] = useState<Seat[]>(selectedCafe?.seats ?? []);
  const [busy, setBusy] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (selectedCafe) {
      setSeats(selectedCafe.seats);
      setSavedSuccess(false);
    }
  }, [selectedSlug, selectedCafe]);

  if (!selectedCafe) {
    return <p className="text-muted-foreground">No cafés available.</p>;
  }

  const handleAddSeat = () => {
    const nextId = `s${seats.length + 1}`;
    const newSeat: Seat = {
      id: nextId,
      name: `Desk ${seats.length + 1}`,
      type: "Desk",
      status: "available",
      x: 20 + ((seats.length * 20) % 60),
      y: 20 + Math.floor(seats.length / 3) * 20,
    };
    setSeats([...seats, newSeat]);
  };

  const handleUpdateSeat = (index: number, updates: Partial<Seat>) => {
    setSeats((prev) => {
      const copy = [...prev];
      const existing = copy[index];
      if (existing) {
        copy[index] = { ...existing, ...updates };
      }
      return copy;
    });
  };

  const handleDeleteSeat = (index: number) => {
    setSeats((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveFloorPlan = async () => {
    setBusy(true);
    await onSaveSeats({
      ...selectedCafe,
      seats,
      availability: `${seats.filter((s) => s.status === "available").length} seats open`,
    });
    setBusy(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Venue Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold">Select Café Venue:</label>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm font-bold"
          >
            {cafes.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.area})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleAddSeat} className="gap-1 font-bold">
            <Plus size={16} /> Add Seat
          </Button>
          <Button onClick={handleSaveFloorPlan} disabled={busy} className="gap-1 font-bold">
            {busy ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : savedSuccess ? (
              <Check size={16} />
            ) : null}
            {savedSuccess ? "Saved!" : "Save Floor Plan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Visual Floor Plan Preview */}
        <div className="rounded-xl border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--sky)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Interactive Floor Map Preview</h3>
            <span className="text-xs text-muted-foreground">{seats.length} total seats</span>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed border-foreground/30 bg-floor p-4">
            <div className="absolute inset-x-8 top-3 h-7 rounded bg-sky/20 text-center text-[11px] font-bold leading-7 text-sky-deep">
              WINDOW VIEW COUNTER
            </div>
            <div className="absolute bottom-4 left-6 right-6 h-7 rounded bg-foreground/10 text-center text-[11px] font-semibold leading-7">
              BARISTA BAR & COUNTER
            </div>

            {seats.map((seat) => (
              <div
                key={seat.id}
                className={cn(
                  "absolute grid h-11 w-18 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border-2 text-[10px] font-bold shadow-sm transition-all",
                  seat.status === "available"
                    ? "border-available-deep bg-available/30 text-foreground"
                    : seat.status === "unavailable"
                    ? "border-coral bg-coral/20 text-muted-foreground"
                    : "border-border bg-muted text-muted-foreground opacity-60"
                )}
                style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
              >
                <span>{seat.name}</span>
                <span className="text-[9px] font-normal text-muted-foreground capitalize">
                  {seat.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Seat Controls List */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold">Seats List & Status</h3>
          <p className="text-xs text-muted-foreground">
            Configure seat availability and coordinates for customers.
          </p>

          <div className="max-h-[500px] space-y-2.5 overflow-y-auto pr-1">
            {seats.map((seat, index) => (
              <div
                key={seat.id}
                className="rounded-lg border border-border bg-background p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={seat.name}
                    onChange={(e) => handleUpdateSeat(index, { name: e.target.value })}
                    className="font-bold outline-none bg-transparent border-b border-dashed border-muted-foreground/40 pb-0.5"
                  />
                  <button
                    onClick={() => handleDeleteSeat(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">
                      Status
                    </label>
                    <select
                      value={seat.status}
                      onChange={(e) =>
                        handleUpdateSeat(index, {
                          status: e.target.value as "available" | "unavailable" | "not-offered",
                        })
                      }
                      className="mt-1 w-full rounded border border-border bg-card p-1 text-xs font-semibold"
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                      <option value="not-offered">Not Offered</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">
                      Type
                    </label>
                    <select
                      value={seat.type}
                      onChange={(e) => handleUpdateSeat(index, { type: e.target.value })}
                      className="mt-1 w-full rounded border border-border bg-card p-1 text-xs font-semibold"
                    >
                      <option value="Window">Window</option>
                      <option value="Desk">Desk</option>
                      <option value="Community">Community</option>
                      <option value="Bar">Bar</option>
                      <option value="Nook">Nook</option>
                    </select>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    X%:
                    <input
                      type="number"
                      min={5}
                      max={95}
                      value={seat.x}
                      onChange={(e) => handleUpdateSeat(index, { x: Number(e.target.value) })}
                      className="w-12 rounded border border-border bg-card px-1 py-0.5 text-xs text-foreground"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    Y%:
                    <input
                      type="number"
                      min={5}
                      max={95}
                      value={seat.y}
                      onChange={(e) => handleUpdateSeat(index, { y: Number(e.target.value) })}
                      className="w-12 rounded border border-border bg-card px-1 py-0.5 text-xs text-foreground"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 6. TAB D: REVIEWS & REPUTATION MANAGEMENT                                 */
/* ========================================================================= */

function AdminReviewsTab({
  cafes,
  pendingReviews = [],
  loadingPendingReviews = false,
  onApprovePendingReview,
  onRejectPendingReview,
  onUpdateCafeReviews,
}: {
  cafes: Cafe[];
  pendingReviews?: PendingReviewSubmission[];
  loadingPendingReviews?: boolean;
  onApprovePendingReview?: (id: string) => Promise<void>;
  onRejectPendingReview?: (id: string) => Promise<void>;
  onUpdateCafeReviews: (cafe: Cafe) => Promise<void>;
}) {
  const [selectedSlug, setSelectedSlug] = useState(cafes[0]?.slug ?? "");
  const selectedCafe = cafes.find((c) => c.slug === selectedSlug) ?? cafes[0];
  const reviews = selectedCafe?.reviewsList ?? [];

  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [busySubId, setBusySubId] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"pending" | "all">("pending");

  const pendingList = pendingReviews.filter((r) => r.status === "pending");
  const displayedSubmissions =
    reviewFilter === "pending" ? pendingList : pendingReviews;

  const handleApproveSub = async (sub: PendingReviewSubmission) => {
    if (!onApprovePendingReview) return;
    setBusySubId(sub.id);
    try {
      await onApprovePendingReview(sub.id);
    } finally {
      setBusySubId(null);
    }
  };

  const handleRejectSub = async (sub: PendingReviewSubmission) => {
    if (!onRejectPendingReview) return;
    if (confirm(`Reject review submission from "${sub.author}" for ${sub.cafeName}?`)) {
      setBusySubId(sub.id);
      try {
        await onRejectPendingReview(sub.id);
      } finally {
        setBusySubId(null);
      }
    }
  };

  if (!selectedCafe) return null;

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    setBusy(true);
    const newReview: CafeReview = {
      id: `r${Date.now()}`,
      author: author.trim(),
      rating,
      date: new Date().toISOString().slice(0, 10),
      comment: comment.trim(),
    };

    const nextReviews = [newReview, ...reviews];
    const newRating = parseFloat(
      (nextReviews.reduce((sum, r) => sum + r.rating, 0) / nextReviews.length).toFixed(1)
    );

    await onUpdateCafeReviews({
      ...selectedCafe,
      reviewsList: nextReviews,
      rating: newRating,
      reviews: nextReviews.length,
    });

    setAuthor("");
    setComment("");
    setRating(5);
    setBusy(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    setBusy(true);
    const nextReviews = reviews.filter((r) => r.id !== reviewId);
    const newRating =
      nextReviews.length > 0
        ? parseFloat(
            (nextReviews.reduce((sum, r) => sum + r.rating, 0) / nextReviews.length).toFixed(1)
          )
        : 4.5;

    await onUpdateCafeReviews({
      ...selectedCafe,
      reviewsList: nextReviews,
      rating: newRating,
      reviews: nextReviews.length,
    });
    setBusy(false);
  };

  return (
    <div className="space-y-8">
      {/* 1. VENDOR REVIEWS MODERATION QUEUE (Pro Tier Venues) */}
      <section className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--sun)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-600">
              <Crown size={22} className="fill-amber-500 text-amber-500" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold">
                  Vendor Submitted Reviews Awaiting Approval
                </h2>
                {pendingList.length > 0 && (
                  <span className="rounded-full bg-coral px-2.5 py-0.5 text-xs font-bold text-coral-foreground animate-pulse">
                    {pendingList.length} Action Needed
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pro Tier venues (₹49) can submit customer reviews. Approving a review automatically publishes it to the live café card and recalculates its platform star rating.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReviewFilter("pending")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                reviewFilter === "pending"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              Pending ({pendingList.length})
            </button>
            <button
              onClick={() => setReviewFilter("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                reviewFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              All Submissions ({pendingReviews.length})
            </button>
          </div>
        </div>

        {/* List of Submissions */}
        <div className="mt-5">
          {displayedSubmissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              <CheckCircle2 size={24} className="mx-auto text-available mb-2" />
              <p className="font-bold text-foreground">All vendor reviews are up to date!</p>
              <p className="mt-1">
                When a Pro Tier café submits customer feedback for approval from the Manager portal, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayedSubmissions.map((sub) => {
                const isSubBusy = busySubId === sub.id;
                return (
                  <div
                    key={sub.id}
                    className={cn(
                      "flex flex-col justify-between rounded-xl border-2 p-4 transition-all bg-background",
                      sub.status === "pending"
                        ? "border-amber-500/50 shadow-sm"
                        : sub.status === "approved"
                        ? "border-available/30 opacity-80"
                        : "border-border opacity-60"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                          {sub.id} · {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            sub.status === "pending"
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                              : sub.status === "approved"
                              ? "bg-available/20 text-available-foreground"
                              : "bg-destructive/20 text-destructive"
                          )}
                        >
                          {sub.status}
                        </span>
                      </div>

                      <div className="mt-2">
                        <span className="text-xs font-bold text-primary">
                          Venue: {sub.cafeName}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-display font-bold text-sm text-foreground">
                            {sub.author}
                          </span>
                          <div className="flex items-center text-sun-deep">
                            {Array.from({ length: sub.rating }).map((_, i) => (
                              <Star key={i} size={12} className="fill-sun text-sun-deep" />
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-2.5 py-0.5">
                        "{sub.comment}"
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        Target slug: <code className="font-mono">{sub.cafeSlug}</code>
                      </span>

                      {sub.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSubBusy}
                            onClick={() => handleRejectSub(sub)}
                            className="h-8 text-xs text-muted-foreground hover:text-destructive"
                          >
                            <X size={13} /> Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={isSubBusy}
                            onClick={() => handleApproveSub(sub)}
                            className="h-8 gap-1 text-xs font-bold bg-available hover:bg-available/90 text-available-foreground"
                          >
                            {isSubBusy ? (
                              <LoaderCircle className="animate-spin" size={13} />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            Approve & Publish
                          </Button>
                        </div>
                      ) : sub.status === "approved" ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-available-foreground">
                          <CheckCircle2 size={13} /> Published on Café Card
                        </span>
                      ) : (
                        <span className="text-xs text-destructive font-bold">Rejected</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 2. LIVE REVIEWS DIRECT MANAGER */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold">Select Café Venue:</label>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm font-bold"
          >
            {cafes.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.area})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-display text-lg font-bold">
            <Star size={18} className="fill-sun text-sun-deep" />
            {selectedCafe.rating} / 5.0
          </span>
          <span className="text-xs text-muted-foreground">
            ({selectedCafe.reviews} verified reviews)
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Reviews List */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold">
            Live Reviews on Venue Profile ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <MessageSquare className="mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No reviews recorded yet for this venue.
              </p>
            </div>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold">{r.author}</span>
                    <span className="text-xs text-muted-foreground">· {r.date}</span>
                    <span className="flex items-center text-xs font-bold text-sun-deep">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-sun text-sun-deep" />
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {r.comment}
                  </p>
                </div>

                <button
                  disabled={busy}
                  onClick={() => handleDeleteReview(r.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Delete review"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Review Panel */}
        <div className="h-fit rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold">Add Verified Review</h3>
          <p className="text-xs text-muted-foreground">
            Post an authenticated guest review for {selectedCafe.name}.
          </p>

          <form onSubmit={handleAddReview} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Reviewer Name
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Star Rating
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-bold"
              >
                <option value={5}>★★★★★ (5 Stars)</option>
                <option value={4}>★★★★☆ (4 Stars)</option>
                <option value={3}>★★★☆☆ (3 Stars)</option>
                <option value={2}>★★☆☆☆ (2 Stars)</option>
                <option value={1}>★☆☆☆☆ (1 Star)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Review Comment
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share guest feedback on seating, Wi-Fi speed, and hospitality..."
                className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <Button type="submit" disabled={busy} className="mt-2 w-full font-bold">
              {busy ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Plus size={16} />
              )}
              Post Review & Update Rating
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 7. TAB E: VENDOR SELF-REGISTRATIONS & ONBOARDING                          */
/* ========================================================================= */

function AdminVendorsTab({
  applications,
  loading,
  onApprove,
  onStatusChange,
}: {
  applications: VendorApplication[];
  loading: boolean;
  onApprove: (id: string) => Promise<{ success: boolean; cafe?: Cafe; error?: string }>;
  onStatusChange: (id: string, status: "pending" | "approved" | "rejected") => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [inspectApp, setInspectApp] = useState<VendorApplication | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const registrationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/partner/register`
      : "https://workspot.in/partner/register";

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        !search ||
        a.cafeName.toLowerCase().includes(search.toLowerCase()) ||
        a.area.toLowerCase().includes(search.toLowerCase()) ||
        a.contactName.toLowerCase().includes(search.toLowerCase()) ||
        a.contactPhone.includes(search);

      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchPlan = planFilter === "all" || (a.plan || "free") === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [applications, search, statusFilter, planFilter]);

  const handleApproveClick = async (app: VendorApplication) => {
    setBusyId(app.id);
    const res = await onApprove(app.id);
    setBusyId(null);
    if (res.success && res.cafe) {
      setSuccessBanner(
        `🎉 Successfully approved "${app.cafeName}"! The café is now published to the live explore map with ${res.cafe.seats.length} seats.`
      );
      setTimeout(() => setSuccessBanner(null), 5000);
    }
  };

  const handleRejectClick = async (appId: string) => {
    if (confirm("Are you sure you want to reject this vendor application?")) {
      setBusyId(appId);
      await onStatusChange(appId, "rejected");
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sharable Vendor Link Banner */}
      <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-gradient-to-r from-sun/20 via-sky/20 to-primary/10 p-6 shadow-[6px_6px_0_var(--sun)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-primary-foreground">
              <Share2 size={13} /> Shareable Onboarding Link
            </span>
            <h2 className="mt-2.5 font-display text-2xl font-bold">
              Invite Café Owners to Register
            </h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Share this link via WhatsApp, Email, or DM with any café owner. They can fill in
              their venue details, photos, and video tours without you having to enter anything manually.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleCopyLink} className="gap-2 font-bold shadow-md">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Link Copied!" : "Copy Vendor Link"}
            </Button>
            <a
              href="/partner/register"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-bold transition-colors hover:bg-muted"
            >
              Preview Form <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card/90 px-4 py-2.5 font-mono text-xs font-semibold text-foreground">
          <span className="text-muted-foreground select-none">URL:</span>
          <span className="truncate">{registrationUrl}</span>
        </div>
      </div>

      {successBanner && (
        <div className="flex items-center justify-between rounded-xl border border-available-deep bg-available/20 p-4 text-sm font-bold text-available-foreground">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="rounded p-1 hover:bg-available/30">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">Total Applications</p>
          <p className="mt-1.5 font-display text-2xl font-bold">{applications.length}</p>
        </div>
        <div className="rounded-xl border-2 border-coral bg-card p-4 shadow-[4px_4px_0_var(--coral)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-coral-deep">Pending Review</p>
            {pendingCount > 0 && <span className="size-2 rounded-full bg-coral animate-ping" />}
          </div>
          <p className="mt-1.5 font-display text-2xl font-bold text-coral-deep">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">Approved & Live</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-available-foreground">
            {approvedCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">Rejected / Archived</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-muted-foreground">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search submitted venues by café name, locality, or contact person..."
            className="min-h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          aria-label="Filter Applications by Tier Plan"
          className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-semibold"
        >
          <option value="all">All Plans</option>
          <option value="pro">Pro Tier (₹49 Paid)</option>
          <option value="free">Free Standard Tier</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter Applications by Status"
          className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-semibold"
        >
          <option value="all">All Applications ({applications.length})</option>
          <option value="pending">Pending Review ({pendingCount})</option>
          <option value="approved">Approved ({approvedCount})</option>
          <option value="rejected">Rejected ({rejectedCount})</option>
        </select>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-16 text-center">
          <LoaderCircle className="mx-auto animate-spin text-primary" size={28} />
          <p className="mt-3 text-sm text-muted-foreground">Loading vendor registrations...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
          <Store className="mx-auto text-muted-foreground" size={32} />
          <h3 className="mt-3 font-display text-lg font-bold">No applications found</h3>
          <p className="text-xs text-muted-foreground">
            Share the vendor registration link to start onboarding café partners.
          </p>
          <Button onClick={handleCopyLink} className="mt-4 gap-2 font-bold" variant="secondary">
            <Copy size={15} /> Copy Registration Link
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredApps.map((app) => {
            const isBusy = busyId === app.id;
            return (
              <div
                key={app.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-2xl border-2 bg-card p-5 transition-all shadow-sm",
                  app.status === "pending"
                    ? "border-coral/60 shadow-[5px_5px_0_var(--coral)]"
                    : app.status === "approved"
                    ? "border-available/40"
                    : "border-border opacity-75"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {app.id} · {new Date(app.submittedAt).toLocaleDateString()}
                    </span>
                    <h3 className="truncate font-display text-xl font-bold">{app.cafeName}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={13} /> {app.area}
                      </span>
                      {app.plan === "pro" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                          <Crown size={11} className="fill-amber-500 text-amber-500" /> Pro Tier (₹49 Paid)
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          Free Tier (₹0)
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-bold capitalize",
                      app.status === "pending"
                        ? "bg-coral/20 text-coral-deep"
                        : app.status === "approved"
                        ? "bg-available/20 text-available-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {app.status === "pending" ? "Pending Review" : app.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-[120px_1fr] gap-3">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted border border-border">
                    <img
                      src={app.coverImage}
                      alt={app.cafeName}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="text-xs space-y-1">
                    <p>
                      <strong className="text-foreground">Contact:</strong> {app.contactName} (
                      <span className="text-muted-foreground">{app.contactPhone}</span>)
                    </p>
                    <p>
                      <strong className="text-foreground">Email:</strong> {app.contactEmail}
                    </p>
                    <p>
                      <strong className="text-foreground">Proposed Rate:</strong> ₹{app.price}/hr ·{" "}
                      {app.seatsCount} seats
                    </p>
                    <p>
                      <strong className="text-foreground">Hours:</strong> {app.hours}
                    </p>
                    {app.videoUrl && (
                      <p className="truncate text-primary">
                        <strong className="text-foreground">Video:</strong>{" "}
                        <a
                          href={app.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:text-primary-deep"
                        >
                          Watch Tour ↗
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{app.description}</p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {app.amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <button
                      onClick={() => setInspectApp(app)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <FileText size={14} /> View Full Profile
                    </button>

                    <div className="flex items-center gap-2">
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleApproveClick(app)}
                            className="h-8 gap-1 text-xs font-bold bg-available hover:bg-available/90 text-available-foreground"
                          >
                            {isBusy ? (
                              <LoaderCircle className="animate-spin" size={14} />
                            ) : (
                              <Sparkles size={14} />
                            )}
                            Approve & Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => handleRejectClick(app.id)}
                            className="h-8 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {app.status === "approved" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-available-foreground">
                          <CheckCircle2 size={15} /> Published & Live
                        </span>
                      )}

                      {app.status === "rejected" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => handleApproveClick(app)}
                          className="h-8 text-xs"
                        >
                          Re-approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Full Application Modal */}
      {inspectApp && (
        <VendorApplicationModal
          app={inspectApp}
          onClose={() => setInspectApp(null)}
          onApprove={async () => {
            await handleApproveClick(inspectApp);
            setInspectApp(null);
          }}
          onReject={async () => {
            await handleRejectClick(inspectApp.id);
            setInspectApp(null);
          }}
        />
      )}
    </div>
  );
}

function VendorApplicationModal({
  app,
  onClose,
  onApprove,
  onReject,
}: {
  app: VendorApplication;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border-2 border-foreground bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <span className="font-mono text-xs font-bold text-muted-foreground uppercase">
              Application: {app.id}
            </span>
            <h2 className="font-display text-2xl font-bold">{app.cafeName}</h2>
            <p className="text-xs text-muted-foreground">
              Submitted on {new Date(app.submittedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="aspect-[16/8] w-full overflow-hidden rounded-xl border border-border bg-muted">
            <img src={app.coverImage} alt={app.cafeName} className="h-full w-full object-cover" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-border bg-secondary/30 p-4 text-xs">
            <div>
              <p className="font-bold text-muted-foreground uppercase">Location & Address</p>
              <p className="mt-1 font-semibold text-foreground">{app.area}, Mumbai</p>
              <p className="text-muted-foreground">{app.address}</p>
            </div>
            <div>
              <p className="font-bold text-muted-foreground uppercase">Contact Representative</p>
              <p className="mt-1 font-semibold text-foreground">{app.contactName}</p>
              <p className="text-muted-foreground">Phone: {app.contactPhone}</p>
              <p className="text-muted-foreground">Email: {app.contactEmail}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="font-bold text-muted-foreground uppercase">Hourly Rate</p>
              <p className="mt-1 font-display text-lg font-bold">₹{app.price}/hr</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="font-bold text-muted-foreground uppercase">Seats Listed</p>
              <p className="mt-1 font-display text-lg font-bold">{app.seatsCount} seats</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="font-bold text-muted-foreground uppercase">Hours Window</p>
              <p className="mt-1 font-semibold">{app.hours}</p>
            </div>
          </div>

          {/* Onboarding Tier & Payment Status */}
          <div className="grid gap-3 sm:grid-cols-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs">
            <div>
              <p className="font-bold text-muted-foreground uppercase text-[10px]">Onboarding Tier</p>
              <p className="mt-1 font-display font-bold text-sm flex items-center gap-1 text-foreground">
                {app.plan === "pro" ? (
                  <>
                    <Crown size={14} className="fill-amber-500 text-amber-500" />
                    Pro Partner Tier
                  </>
                ) : (
                  "Free Standard Tier"
                )}
              </p>
            </div>
            <div>
              <p className="font-bold text-muted-foreground uppercase text-[10px]">Fee & Payment</p>
              <p className="mt-1 font-display font-bold text-sm text-foreground">
                {app.plan === "pro" ? `₹${app.paidAmount || 49} Paid` : "₹0 (Free)"}
              </p>
            </div>
            <div>
              <p className="font-bold text-muted-foreground uppercase text-[10px]">Payment Method</p>
              <p className="mt-1 font-semibold text-foreground">
                {app.paymentMethod ? `${app.paymentMethod}` : app.plan === "pro" ? "UPI" : "N/A"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground">Vibe & Atmosphere</h4>
            <p className="mt-1 text-sm font-semibold">{app.vibe}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground">Workspace Description</h4>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{app.description}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground">Offered Amenities</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {app.amenities.map((a) => (
                <span
                  key={a}
                  className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          {app.videoUrl && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Video Walkthrough</h4>
              <a
                href={app.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-primary underline"
              >
                <Video size={16} /> Open Video Tour in New Tab <ExternalLink size={13} />
              </a>
            </div>
          )}

          {app.notes && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
              <p className="font-bold uppercase text-muted-foreground">Applicant Notes</p>
              <p className="mt-1 text-muted-foreground">{app.notes}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border p-5">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {app.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await onReject();
                    setBusy(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await onApprove();
                    setBusy(false);
                  }}
                  className="bg-available hover:bg-available/90 text-available-foreground font-bold"
                >
                  {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  Approve & Publish to Platform
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

