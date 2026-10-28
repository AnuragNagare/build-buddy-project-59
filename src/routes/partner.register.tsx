import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Armchair,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Coffee,
  CreditCard,
  Crown,
  ExternalLink,
  Film,
  IndianRupee,
  Info,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Upload,
  User,
  Video,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitVendorApplication } from "@/lib/firebase-service";
import { type Amenity } from "@/lib/workspot-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/partner/register")({
  head: () => ({
    meta: [
      { title: "Partner With Us — Café Registration | WorkSpot" },
      {
        name: "description",
        content: "Register your café on WorkSpot. List seats, set your hourly price, and welcome remote professionals during quiet hours.",
      },
    ],
  }),
  component: PartnerRegisterPage,
});

const ALL_AMENITIES: { label: Amenity; icon: typeof Wifi; desc: string }[] = [
  { label: "Wi-Fi", icon: Wifi, desc: "High-speed stable connection" },
  { label: "Power", icon: Zap, desc: "Accessible plug points at tables" },
  { label: "AC", icon: Building2, desc: "Climate controlled cooling" },
  { label: "Quiet", icon: Armchair, desc: "Considerate noise levels" },
  { label: "Food", icon: Coffee, desc: "Food & beverage menu available" },
  { label: "Ergonomic", icon: Armchair, desc: "Comfortable desk & seating" },
];

const MUMBAI_LOCALITIES = [
  "Bandra West",
  "Bandra East / BKC",
  "Lower Parel",
  "Kala Ghoda / Fort",
  "Andheri West",
  "Andheri East",
  "Powai",
  "Juhu / Vile Parle",
  "Dadar / Shivaji Park",
  "Worli",
  "Colaba",
  "Malad / Goregaon",
];

function PartnerRegisterPage() {
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [cafeName, setCafeName] = useState("");
  const [area, setArea] = useState("Bandra West");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [price, setPrice] = useState(149);
  const [hours, setHours] = useState("8:30 AM–8:30 PM IST");
  const [seatsCount, setSeatsCount] = useState(6);
  const [vibe, setVibe] = useState("Bright, quiet & social");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<Amenity[]>(["Wi-Fi", "Power", "AC", "Food"]);
  const [coverImage, setCoverImage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Plan Tier State: "free" (₹0) vs "pro" (₹49)
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [upiId, setUpiId] = useState("cafeowner@oksbi");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8821");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("742");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [submittedPlan, setSubmittedPlan] = useState<"free" | "pro">("free");

  const toggleAmenity = (item: Amenity) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handlePreFillSample = () => {
    setCafeName("The Copper Mug Café");
    setArea("Bandra West");
    setAddress("14th Road, off Khar Danda, Bandra West, Mumbai 400052");
    setContactName("Sameer Verma");
    setContactPhone("+919820987654");
    setContactEmail("sameer@coppermug.in");
    setPrice(159);
    setHours("8:00 AM–9:00 PM IST");
    setSeatsCount(8);
    setVibe("Calm, warm wooden interiors & natural daylight");
    setDescription(
      "A sun-drenched café with spacious oak tables, high-speed Wi-Fi, power strips at every booth, and specialty single-origin coffees."
    );
    setAmenities(["Wi-Fi", "Power", "AC", "Quiet", "Food", "Ergonomic"]);
    setCoverImage(
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80"
    );
    setVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    setNotes("We have a dedicated upstairs quiet floor ideal for deep work and laptop sessions.");
  };

  const validateForm = () => {
    if (!cafeName.trim() || !address.trim() || !contactPhone.trim()) {
      setError("Please fill in all required venue identity and contact fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    return true;
  };

  const doSubmit = async (selectedPlan: "free" | "pro", method?: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await submitVendorApplication({
        cafeName: cafeName.trim(),
        area,
        address: address.trim(),
        contactName: contactName.trim() || "Venue Manager",
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || "contact@cafe.com",
        price,
        hours,
        vibe,
        description: description.trim() || `A work-friendly space at ${cafeName.trim()} in ${area}.`,
        amenities,
        seatsCount,
        coverImage:
          coverImage.trim(),
        videoUrl: videoUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        plan: selectedPlan,
        paidAmount: selectedPlan === "pro" ? 49 : 0,
        paymentStatus: selectedPlan === "pro" ? "paid" : "unpaid",
        paymentMethod: selectedPlan === "pro" ? method || "UPI" : undefined,
      });

      setBusy(false);
      if (res.success) {
        setSubmittedId(res.id);
        setSubmittedPlan(selectedPlan);
        setShowPaymentModal(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(res.error || "Failed to submit registration. Please try again.");
      }
    } catch (err: unknown) {
      setBusy(false);
      const errorObj = err as Error;
      setError(errorObj.message || "An unexpected error occurred.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (plan === "pro") {
      setShowPaymentModal(true);
    } else {
      await doSubmit("free");
    }
  };

  const handleConfirmPayment = async () => {
    setPaymentProcessing(true);
    // Simulate brief bank gateway processing
    await new Promise((resolve) => setTimeout(resolve, 800));
    setPaymentProcessing(false);
    await doSubmit("pro", paymentMethod);
  };

  if (submittedId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-card p-8 shadow-[10px_10px_0_var(--available)] sm:p-12">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-available text-available-foreground shadow-lg">
            <Check size={40} />
          </span>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-block rounded-full bg-available/20 px-4 py-1 font-mono text-xs font-bold text-available-foreground">
              Reference: {submittedId}
            </span>
            {submittedPlan === "pro" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Crown size={13} className="text-amber-500 fill-amber-500" /> Pro Partner Tier (₹49 Paid)
              </span>
            ) : (
              <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                Free Standard Tier (₹0)
              </span>
            )}
          </div>

          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
            Registration Submitted!
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Thank you for registering <strong className="text-foreground">{cafeName}</strong> on
            WorkSpot. Your profile has been sent to our administrator team for verification.
          </p>

          {submittedPlan === "pro" ? (
            <div className="my-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-left text-xs leading-relaxed">
              <p className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                <Sparkles size={15} /> Your Pro Partner Tier Perks Are Activated:
              </p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside text-muted-foreground">
                <li><strong className="text-foreground">Verified Pro Badge:</strong> Will be displayed on your listing upon admin approval.</li>
                <li><strong className="text-foreground">Submit Customer Reviews:</strong> Head over to your venue <Link to="/manager" className="text-primary underline font-bold">Manager Dashboard</Link> to submit custom reviews & ratings for admin approval!</li>
                <li><strong className="text-foreground">Moderation Queue:</strong> All submitted reviews are reviewed by our Super Admin team to protect platform authenticity before going live.</li>
              </ul>
            </div>
          ) : (
            <div className="my-8 rounded-xl border border-border bg-secondary/40 p-5 text-left text-xs leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground">What happens next?</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li>Our Super Admin reviews your address, seating capacity, and Wi-Fi suitability.</li>
                <li>Once verified, your café is published to the live Mumbai explore map.</li>
                <li>Upgrade to the ₹49 Pro Tier at any time to curate and add custom reviews!</li>
              </ul>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/manager"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Go to Venue Manager
            </Link>
            <Link
              to="/explore"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-background px-6 text-sm font-bold hover:bg-muted"
            >
              Browse Existing Venues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/partners"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} /> Back to Partner Info
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles size={14} /> Partner Onboarding Portal
            </span>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              Register Your Café Venue
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your venue profile, upload photos and videos, and start monetizing empty daytime seats.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePreFillSample}
            className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
          >
            ⚡ Auto-Fill Sample Café
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          {error}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleFormSubmit} className="space-y-8">
        {/* 1. Venue Identity & Location */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Building2 size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">1. Venue Identity & Location</h2>
              <p className="text-xs text-muted-foreground">Basic information customers see when searching.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Café Name *
              </label>
              <input
                required
                type="text"
                value={cafeName}
                onChange={(e) => setCafeName(e.target.value)}
                placeholder="e.g. Blue Door Coffee, Craft Bean..."
                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Mumbai Locality / Area *
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold outline-none focus:border-primary"
              >
                {MUMBAI_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold uppercase text-muted-foreground">
              Full Street Address *
            </label>
            <input
              required
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop No, Building Name, Street / Road, Mumbai"
              className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
          </div>
        </section>

        {/* 2. Contact Information */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="grid size-8 place-items-center rounded-lg bg-sky/20 text-sky-deep">
              <User size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">2. Contact Person & Representative</h2>
              <p className="text-xs text-muted-foreground">For booking alerts and partnership coordination.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Manager / Owner Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Contact Phone (+91) *
              </label>
              <input
                required
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98200 00000"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="manager@mycafe.com"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* 3. Space, Pricing & Operations */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="grid size-8 place-items-center rounded-lg bg-sun/30 text-sun-deep">
              <IndianRupee size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">3. Space, Pricing & Working Hours</h2>
              <p className="text-xs text-muted-foreground">Set your hourly seat rate and operational window.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Hourly Price (₹ INR / seat)
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                  ₹
                </span>
                <input
                  type="number"
                  min={49}
                  max={499}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="min-h-12 w-full rounded-xl border border-border bg-background pl-8 pr-4 text-sm font-bold outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Dedicated Work Seats Count
              </label>
              <input
                type="number"
                min={2}
                max={25}
                value={seatsCount}
                onChange={(e) => setSeatsCount(Number(e.target.value))}
                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Work Hours Window
              </label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="8:30 AM–8:30 PM IST"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold uppercase text-muted-foreground">
              Vibe / Atmosphere Headline
            </label>
            <input
              type="text"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. Calm, focused & plant-filled"
              className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold uppercase text-muted-foreground">
              About Your Café & Workspace
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your seating arrangements, lighting, noise level, and what makes your café a great workspace..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </section>

        {/* 4. Amenities & Features */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="grid size-8 place-items-center rounded-lg bg-available/20 text-available-foreground">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">4. Features & Amenities</h2>
              <p className="text-xs text-muted-foreground">
                Select the amenities your café offers to remote workers.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {ALL_AMENITIES.map((item) => {
              const active = amenities.includes(item.label);
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => toggleAmenity(item.label)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all",
                    active
                      ? "border-primary bg-primary/5 text-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-border/80"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Photos & Video Showcase */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="grid size-8 place-items-center rounded-lg bg-coral/20 text-coral-deep">
              <Film size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">5. Photos & Video Showcase</h2>
              <p className="text-xs text-muted-foreground">
                High-quality visuals dramatically increase customer seat bookings.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Primary Cover Image URL (Optional)
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Photo link — a representative photo is shown until you add one"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
              {coverImage && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="aspect-[16/9] w-48 overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Live preview of your main venue photo as seen on the search page.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Video Tour URL (Optional)
              </label>
              <div className="relative mt-1.5">
                <Video
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/... or Instagram Reel link"
                  className="min-h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Link to a video tour, reel, or walkthrough showcasing your café seating.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Additional Notes / Questions for WorkSpot Team
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes regarding your quiet hours, coffee discounts for workers, or arrival instructions..."
                className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* 6. Onboarding Tier Selection (Free vs Pro ₹49) */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="grid size-8 place-items-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Crown size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">6. Choose Your Onboarding Tier</h2>
              <p className="text-xs text-muted-foreground">
                Select between our free standard profile or activate Pro privileges to curate customer reviews.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* Free Tier Card */}
            <div
              onClick={() => setPlan("free")}
              className={cn(
                "cursor-pointer relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all text-left",
                plan === "free"
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-muted-foreground/40 bg-card"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                    Standard Listing
                  </span>
                  <div
                    className={cn(
                      "size-5 rounded-full border-2 grid place-items-center transition-colors",
                      plan === "free" ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}
                  >
                    {plan === "free" && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-display text-xl font-extrabold">Free Tier</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display text-2xl font-bold">₹0</span>
                    <span className="text-xs text-muted-foreground">/ Forever free</span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Ideal for cafés looking to establish their basic presence on the WorkSpot map.
                </p>

                <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary flex-shrink-0" />
                    <span>Venue profile with photos, hours & address</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary flex-shrink-0" />
                    <span>Seat availability & hourly rate configuration</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary flex-shrink-0" />
                    <span>Listed on Mumbai explore directory & search</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary flex-shrink-0" />
                    <span>Basic Venue Manager dashboard</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/50 line-through">
                    <X size={14} className="text-muted-foreground/50 flex-shrink-0" />
                    <span>Submit & curate customer reviews</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/50 line-through">
                    <X size={14} className="text-muted-foreground/50 flex-shrink-0" />
                    <span>Verified Pro badge</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60">
                <span
                  className={cn(
                    "block w-full text-center py-2 rounded-xl text-xs font-bold transition-colors",
                    plan === "free" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {plan === "free" ? "Selected Plan" : "Choose Free Tier"}
                </span>
              </div>
            </div>

            {/* Pro Tier Card (₹49) */}
            <div
              onClick={() => setPlan("pro")}
              className={cn(
                "cursor-pointer relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all text-left",
                plan === "pro"
                  ? "border-amber-500 bg-amber-500/10 shadow-lg ring-2 ring-amber-500/20"
                  : "border-border hover:border-amber-500/50 bg-card"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    <Crown size={12} className="fill-amber-500 text-amber-500" /> RECOMMENDED
                  </span>
                  <div
                    className={cn(
                      "size-5 rounded-full border-2 grid place-items-center transition-colors",
                      plan === "pro" ? "border-amber-500 bg-amber-500 text-white" : "border-border"
                    )}
                  >
                    {plan === "pro" && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-display text-xl font-extrabold flex items-center gap-1.5 text-foreground">
                    Pro Partner Tier
                    <Sparkles size={16} className="text-amber-500" />
                  </h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display text-2xl font-bold text-foreground">₹49</span>
                    <span className="text-xs text-muted-foreground">one-time activation</span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Full control over your café reputation. Add custom guest reviews and stand out with verified status.
                </p>

                <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                  <li className="flex items-center gap-2 text-foreground font-semibold">
                    <Check size={14} className="text-amber-500 flex-shrink-0" />
                    <span>Everything in Free Tier included</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-semibold">
                    <Star size={14} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                    <span>Submit & curate customer reviews (Admin moderated)</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-semibold">
                    <Crown size={14} className="text-amber-500 flex-shrink-0" />
                    <span>Verified Pro Partner badge on map & café page</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-semibold">
                    <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
                    <span>Priority spotlight on Mumbai explore search</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-semibold">
                    <Check size={14} className="text-amber-500 flex-shrink-0" />
                    <span>Dedicated Host Support via WhatsApp</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60">
                <span
                  className={cn(
                    "block w-full text-center py-2 rounded-xl text-xs font-bold transition-colors",
                    plan === "pro"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30"
                  )}
                >
                  {plan === "pro" ? "Selected (₹49 Activation)" : "Select Pro Tier (₹49)"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Submit Bar */}
        <div className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-[8px_8px_0_var(--sun)] sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold flex items-center gap-2">
              Ready to submit {cafeName ? `"${cafeName}"` : "your café"}?
              {plan === "pro" && (
                <span className="text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
                  Pro Tier • ₹49
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan === "pro"
                ? "Click below to review simulated ₹49 payment and complete your Pro registration."
                : "Free registration with no payment required. Reviewed by our Super Admin team."}
            </p>
          </div>

          <Button
            type="submit"
            disabled={busy}
            className={cn(
              "mt-4 min-h-12 w-full font-bold sm:mt-0 sm:w-auto px-8 transition-all",
              plan === "pro"
                ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" size={17} />
                Submitting Application…
              </>
            ) : plan === "pro" ? (
              <>
                <Crown size={17} className="fill-white text-white" />
                Proceed to Pay ₹49 & Register
              </>
            ) : (
              <>
                <Sparkles size={17} />
                Submit Free Registration
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Simulated ₹49 Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-foreground bg-card p-6 shadow-[10px_10px_0_var(--sun)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-amber-500/20 text-amber-600">
                  <Crown size={20} className="fill-amber-500 text-amber-500" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">Pro Partner Activation</h3>
                  <p className="text-xs text-muted-foreground">WorkSpot Vendor Tier Upgrade</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Box */}
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Pro Partner Pass</p>
                  <p className="text-[11px] text-muted-foreground">
                    Reviews Curation + Verified Badge for {cafeName || "Your Venue"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-xl font-extrabold text-foreground">₹49</span>
                  <p className="text-[10px] text-muted-foreground">One-time</p>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-5">
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Select Payment Method
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-bold transition-all",
                    paymentMethod === "UPI"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  )}
                >
                  <Smartphone size={16} /> UPI / QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Card")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-bold transition-all",
                    paymentMethod === "Card"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  )}
                >
                  <CreditCard size={16} /> Debit / Credit Card
                </button>
              </div>

              {/* UPI Tab */}
              {paymentMethod === "UPI" && (
                <div className="mt-4 space-y-3 rounded-xl border border-border bg-secondary/30 p-4 text-xs">
                  <div className="flex items-center justify-center gap-3 bg-background rounded-lg border border-border p-3">
                    <QrCode size={48} className="text-foreground" />
                    <div>
                      <p className="font-bold text-foreground">Scan with any UPI App</p>
                      <p className="text-[11px] text-muted-foreground">Google Pay, PhonePe, Paytm, CRED</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground">
                      Or enter UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. cafe@okhdfcbank"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {paymentMethod === "Card" && (
                <div className="mt-4 space-y-3 rounded-xl border border-border bg-secondary/30 p-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="•••• •••• •••• ••••"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        maxLength={4}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total and Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Total to pay</p>
                <p className="font-display text-lg font-extrabold text-foreground">₹49.00</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={handleConfirmPayment}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 min-h-10"
                >
                  {paymentProcessing ? (
                    <>
                      <LoaderCircle className="animate-spin" size={14} />
                      Processing ₹49…
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      Pay ₹49 & Register
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
