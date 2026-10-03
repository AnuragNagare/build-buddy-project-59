# WorkSpot

An India-first responsive café workspace booking prototype built with TanStack Start, React, TypeScript and Tailwind CSS.

## Run locally

```sh
bun install
bun run dev
```

## Pages

- `/` landing and location search
- `/explore` café map and results
- `/cafes/:slug` café details and seat selection
- `/checkout` mock payment
- `/booking/:id/confirmed` booking confirmation
- `/account/bookings` customer bookings
- `/how-it-works`, `/partners`, `/manager`

## Production integration points

Mock café data is isolated in `src/lib/workspot-data.ts`; browser-persisted booking state is in `src/lib/booking-store.tsx`. Replace these with phone OTP authentication, Postgres/PostGIS inventory, Razorpay payment intents and verified webhooks, maps/geocoding, and managed image storage for production.