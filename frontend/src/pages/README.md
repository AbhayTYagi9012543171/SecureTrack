# SecureTrack pages

This folder contains the application route composition and a named module for each page.

- `AppPages.jsx` contains the working route tree, shared page helpers, layouts, and page implementations. Keeping shared API/loading/error helpers together avoids duplicate state and inconsistent behavior.
- Individual `*Page.jsx` files expose page components for easier discovery and future extraction into independent modules.
- `index.js` provides a stable barrel export.

The existing routes and API integrations are preserved. `PublicPage` and `AuthPage` accept props for related page variants (features, pricing, privacy, login, registration, etc.).

## Additional security intelligence pages

- `Risk intelligence` (`/app/risk-intelligence`) summarizes active findings by recorded severity and prioritizes review.
- `Change history` (`/app/changes`) compares matching check statuses across the two latest completed scans per website.

These views are backed by existing API records and show empty states when there is not enough scan history to compare.
