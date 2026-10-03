# Build WorkSpot

## Goal
Create the complete responsive WorkSpot prototype from the uploaded brief, using fictional Mumbai cafés and a working mock booking journey.

## Experience
- Replace the placeholder with a bright, warm WorkSpot landing page using the supplied palette and typography direction.
- Add Explore, café details, checkout, confirmation, bookings, How it works, Partners, and Manager pages.
- Build clear desktop and mobile navigation, map/list browsing, filters, seat selection, price updates, mock payments, confirmation QR, booking management, and café-manager controls.
- Use accessible status labels, keyboard focus, form labels, loading/empty states, and reduced-motion support.

## Functional flow
- Persist the temporary booking and completed bookings in browser storage.
- Synchronize café cards and map markers, including mobile map/list switching.
- Hold a selected seat across the interface until reset.
- Guard checkout when no seat is selected, prevent duplicate payment actions, and create a mock booking reference on success.
- Make the partner calculator/form and manager controls interactive with local mock persistence.

## Technical approach
- Keep TanStack Start routing and create one route file per requested page.
- Add reusable typed mock data, booking state, and shared UI components.
- Use semantic Tailwind design tokens and lucide icons; use CSS-based dimensional illustration and restrained transitions without adding a backend.
- Add unique page metadata for every content route and update the README with routes and production integration points.
- Verify the main booking journey and key mobile/desktop views in the running preview, then resolve any reported errors.

## Scope note
Payments, location, maps, authentication, café inventory, and persistence remain realistic front-end simulations as requested; no real service integrations are included.
