# SecureTrack Premium Upgrade

## What changed
- Preserved the existing application and its API-driven routes.
- Moved the original stylesheet to `frontend/src/styles/legacy.css` to reduce regression risk.
- Kept `frontend/src/styles.css` as a compatibility entry point.
- Added a centralized `frontend/src/styles/` stylesheet system with design tokens, global rules, layout, sidebar, navbar, topbar, page-specific style entry points, themes, responsive behavior, utilities, and reduced-motion support.
- Added reusable layout/navigation, feedback, form, overlay, data-display, and security components under `frontend/src/components/`.
- Added a reusable component barrel at `frontend/src/components/index.js`.

## CSS architecture
`frontend/src/main.jsx` imports `styles.css`, which imports `styles/index.css`. That entry point loads the legacy rules first, then additive premium styles. This keeps existing class names and current page behavior intact while enabling incremental page-by-page migration.

Page stylesheet entry points are deliberately small and import shared rules. Put new page-only selectors into the corresponding file in `frontend/src/styles/`; avoid adding new global rules to `legacy.css`.

## Important compatibility note
The current route composition and some existing UI remain in `frontend/src/pages/AppPages.jsx`. The new modular components are ready for incremental adoption. They are not forcibly substituted into the existing route shell in this pass, to avoid changing authentication, navigation, and API behavior without full integration tests.

## Validation
Run from the project root:
- `npm run install:all`
- `npm run build`
- `npm test`

Backend integration tests may require a reachable MongoDB instance and environment variables. Never commit real secrets. Before production deployment, configure exact CORS origins, secure cookies, JWT secrets, database access controls, and network egress restrictions for target monitoring.
