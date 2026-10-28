import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coffee,
  IndianRupee,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Smartphone,
  Store,
} from "lucide-react";
import { BookingSummary, PriceBreakdown } from "@/components/booking-ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { useBooking } from "@/lib/booking-store";
import { useAuth } from "@/lib/auth-store";
import { formatDate, getCafe, getCafeImage } from "@/lib/workspot-data";
import { getLiveCafe } from "@/lib/firebase-service";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Review & Confirm Reservation — WorkSpot" },
      { name: "description", content: "Review your WorkSpot reservation. Reserve your seat online for free and pay at the café counter." },
      { property: "og:title", content: "Review your WorkSpot reservation" },
      { property: "og:description", content: "Free online seat reservation. Pay at the café counter on arrival." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { selection, hydrated, addBooking } = useBooking();
  const { user, sendOtp, verifyOtp, confirmationPending, isFirebaseActive } = useAuth();
  const nav = useNavigate();

  const [phone, setPhone] = useState(user?.phoneNumber?.replace("+91", "") ?? "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !selection) {
      nav({ to: "/explore", search: { q: undefined }, replace: true });
    }
  }, [hydrated, selection, nav]);

  useEffect(() => {
    if (user?.phoneNumber) {
      setPhone(user.phoneNumber.replace("+91", ""));
    }
  }, [user?.phoneNumber]);

  if (!selection) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoaderCircle className="animate-spin text-primary" />
      </div>
    );
  }

  const defaultCafe = getCafe(selection.cafeSlug);
  const { data: cafe = defaultCafe } = useQuery({
    queryKey: ["cafe", selection.cafeSlug],
    queryFn: () => getLiveCafe(selection.cafeSlug),
    initialData: defaultCafe,
  });
  const seat = cafe.seats.find((s) => s.id === selection.seatId);

  const handleSendOtp = async () => {
    const rawDigits = phone.replace(/\D/g, "");
    if (rawDigits.length !== 10) {
      setAuthError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setAuthError(null);
    setBusy(true);
    const result = await sendOtp(rawDigits);
    setBusy(false);
    if (result.success) {
      setOtpSent(true);
    } else {
      setAuthError(result.error || "Failed to send OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setAuthError("Please enter the 6-digit verification code.");
      return;
    }
    setAuthError(null);
    setBusy(true);
    const result = await verifyOtp(otp);
    setBusy(false);
    if (!result.success) {
      setAuthError(result.error || "Invalid OTP code.");
    }
  };

  const handleConfirmReservation = async () => {
    setBookingError(null);
    setBusy(true);

    const bookingId = `WS-MUM-${Math.floor(1000 + Math.random() * 9000)}`;
    const hourlyPrice = cafe.price || 149;
    const newBooking = {
      ...selection,
      id: bookingId,
      status: "upcoming" as const,
      createdAt: new Date().toISOString(),
      userId: user?.uid,
      userPhone: user?.phoneNumber ?? "+919876543210",
      totalPrice: hourlyPrice * selection.duration,
      paymentMethod: "Pay at counter",
      paymentStatus: "pay_at_venue" as const,
      seatName: seat?.name ?? `Seat ${selection.seatId}`,
    };

    const res = await addBooking(newBooking);
    setBusy(false);

    if (res.success) {
      nav({ to: "/booking/$id/confirmed", params: { id: bookingId } });
    } else {
      setBookingError(res.error || "Unable to confirm reservation. Please try another seat.");
    }
  };

  const isPhoneVerified = Boolean(user && user.phoneNumber);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <ButtonLink to="/cafes/$slug" params={{ slug: cafe.slug }} variant="ghost" className="px-0">
        <ArrowLeft size={18} />
        Back
      </ButtonLink>
      <h1 className="mt-4 font-display text-4xl font-bold">Review & confirm reservation</h1>
      <p className="mt-2 text-muted-foreground">
        Reserve your seat for free now. Settle any hourly fee or café orders directly at the counter upon arrival.
      </p>

      {bookingError && (
        <div className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          {bookingError}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          {/* Contact & Phone OTP Verification */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Guest verification</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Used by café staff to verify your reserved desk on arrival.
                </p>
              </div>
              {isPhoneVerified && (
                <span className="flex items-center gap-1 text-xs font-bold text-available-deep">
                  <CheckCircle2 size={15} /> Verified
                </span>
              )}
            </div>

            {isPhoneVerified ? (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-available/30 bg-available/10 p-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground">Mobile number</p>
                  <p className="font-display text-lg font-bold">{user?.phoneNumber}</p>
                </div>
                <span className="text-xs font-semibold text-available-deep">
                  Ready for check-in
                </span>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {!otpSent && !confirmationPending ? (
                  <div>
                    <label className="block text-sm font-bold">Mobile number</label>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-flex min-h-12 items-center rounded-lg border border-border bg-muted px-3 text-sm font-bold text-muted-foreground">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit mobile number"
                        className="min-h-12 w-full rounded-lg border-2 border-border bg-background px-4 outline-none focus:border-primary"
                      />
                    </div>
                    {authError && <p className="mt-2 text-sm font-semibold text-coral-deep">{authError}</p>}
                    <Button
                      onClick={handleSendOtp}
                      disabled={busy || phone.length !== 10}
                      className="mt-4"
                    >
                      {busy ? <LoaderCircle className="animate-spin" size={16} /> : "Send verification code"}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isFirebaseActive
                        ? "We'll send an SMS with a one-time code to confirm your seat."
                        : "Demo mode: Click to simulate instant OTP verification."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold">Enter 6-digit OTP</label>
                    <div className="mt-2 flex gap-3">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="min-h-12 w-48 rounded-lg border-2 border-border bg-background px-4 font-mono text-lg tracking-widest outline-none focus:border-primary"
                      />
                      <Button onClick={handleVerifyOtp} disabled={busy || otp.length < 6}>
                        {busy ? <LoaderCircle className="animate-spin" size={16} /> : <KeyRound size={16} />}
                        Confirm OTP
                      </Button>
                    </div>
                    {authError && <p className="mt-2 text-sm font-semibold text-coral-deep">{authError}</p>}
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setAuthError(null);
                      }}
                      className="mt-3 text-xs font-semibold text-primary underline"
                    >
                      Change phone number
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pay at Cafe Counter Explainer Card */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
            <div className="flex items-start gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Store size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold">Free Online Reservation</h2>
                  <span className="rounded-full bg-available/20 border border-available/30 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-available-deep">
                    No upfront payment
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  You are reserving your seat directly with {cafe.name}. No credit card or online payment is required right now.
                </p>

                <div className="mt-4 grid gap-2.5 rounded-lg border border-border/70 bg-card p-4 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-muted-foreground">Online booking charge:</span>
                    <span className="text-available-deep font-extrabold text-sm">₹0 (Free)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Café hourly rate (pay at counter):</span>
                    <span className="font-bold text-foreground">₹{cafe.price || 149} / hour</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-2 font-bold">
                    <span>Estimated venue counter total:</span>
                    <span className="text-foreground">₹{(cafe.price || 149) * selection.duration}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Coffee size={14} className="shrink-0 text-primary" />
                  <span>Settle your desk rate or food & drink orders directly with the café staff upon arrival.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Summary */}
        <aside>
          <div className="rounded-xl border-2 border-foreground bg-card p-6 shadow-[8px_8px_0_var(--sun)]">
            <img
              src={getCafeImage(cafe)}
              alt={cafe.name}
              width={1200}
              height={800}
              className="aspect-[16/8] w-full rounded-lg object-cover"
            />
            <div className="mt-5">
              <BookingSummary
                cafe={cafe}
                date={formatDate(selection.date)}
                time={selection.time}
                duration={selection.duration}
                seatName={seat?.name}
              />
            </div>

            <div className="my-5 border-t border-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Online reservation fee</span>
                <span className="font-bold text-available-deep">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pay at counter upon arrival</span>
                <span className="font-bold">₹{(cafe.price || 149) * selection.duration}</span>
              </div>
            </div>

            <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
              Free cancellation anytime up to 2 hours before your start time.
            </p>

            <Button
              disabled={busy || !isPhoneVerified}
              onClick={handleConfirmReservation}
              className="mt-5 w-full text-sm font-bold"
            >
              {busy ? (
                <>
                  <LoaderCircle className="animate-spin" size={16} />
                  Confirming…
                </>
              ) : (
                <>
                  Confirm free reservation <CheckCircle2 size={16} />
                </>
              )}
            </Button>
            {!isPhoneVerified && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Please verify your phone number above to reserve.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
