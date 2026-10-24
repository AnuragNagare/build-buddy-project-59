import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  Smartphone,
} from "lucide-react";
import { BookingSummary, PriceBreakdown } from "@/components/booking-ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { useBooking } from "@/lib/booking-store";
import { useAuth } from "@/lib/auth-store";
import { formatDate, getCafe } from "@/lib/workspot-data";
import { getLiveCafe } from "@/lib/firebase-service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Review and pay — WorkSpot" },
      { name: "description", content: "Review your WorkSpot reservation and complete a secure payment." },
      { property: "og:title", content: "Review your WorkSpot booking" },
      { property: "og:description", content: "Confirm your café, seat, time and payment method." },
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

  const [method, setMethod] = useState("UPI");
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

  const handlePayAndConfirm = async () => {
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
      paymentMethod: method,
      seatName: seat?.name ?? `Seat ${selection.seatId}`,
    };

    const res = await addBooking(newBooking);
    setBusy(false);

    if (res.success) {
      nav({ to: "/booking/$id/confirmed", params: { id: bookingId } });
    } else {
      setBookingError(res.error || "Unable to confirm booking. Please try another seat.");
    }
  };

  const isPhoneVerified = Boolean(user && user.phoneNumber);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <ButtonLink to="/cafes/$slug" params={{ slug: cafe.slug }} variant="ghost" className="px-0">
        <ArrowLeft size={18} />
        Back
      </ButtonLink>
      <h1 className="mt-4 font-display text-4xl font-bold">Review and pay</h1>
      <p className="mt-2 text-muted-foreground">One last look, then your seat is yours.</p>

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
              <h2 className="font-display text-xl font-bold">Contact details</h2>
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
                <span className="text-xs text-muted-foreground">
                  {user?.isDemo ? "Demo Account" : "Firebase Verified"}
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
                      {busy ? <LoaderCircle className="animate-spin" size={16} /> : "Verify via OTP"}
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

          {/* Payment Method */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Payment method</h2>
            <div className="mt-4 grid gap-3">
              {[
                ["UPI", Smartphone, "Google Pay, PhonePe or any UPI app"],
                ["Card", CreditCard, "Credit or debit card"],
                ["Net banking", Landmark, "Choose your bank"],
              ].map(([name, Icon, desc]) => {
                const I = Icon as typeof Smartphone;
                return (
                  <button
                    key={String(name)}
                    type="button"
                    onClick={() => setMethod(String(name))}
                    className={cn(
                      "grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 px-4 text-left transition-colors",
                      method === name ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <I />
                    <span className="min-w-0">
                      <b className="block">{String(name)}</b>
                      <small className="text-muted-foreground">{String(desc)}</small>
                    </span>
                    <i
                      className={cn(
                        "size-4 rounded-full border-2",
                        method === name
                          ? "border-primary bg-primary ring-2 ring-primary/20"
                          : "border-border"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Sidebar Summary */}
        <aside>
          <div className="rounded-xl border-2 border-foreground bg-card p-6 shadow-[8px_8px_0_var(--sun)]">
            <img
              src={cafe.image}
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
            <div className="my-5 border-t border-border pt-5">
              <PriceBreakdown cafe={cafe} duration={selection.duration} />
            </div>
            <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
              Free cancellation until 2 hours before your start time.
            </p>
            <Button
              disabled={busy || !isPhoneVerified}
              onClick={handlePayAndConfirm}
              className="mt-5 w-full"
            >
              {busy ? (
                <>
                  <LoaderCircle className="animate-spin" size={16} />
                  Processing…
                </>
              ) : (
                <>
                  Confirm booking <LockKeyhole size={16} />
                </>
              )}
            </Button>
            {!isPhoneVerified && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Please verify your phone number above to continue.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
