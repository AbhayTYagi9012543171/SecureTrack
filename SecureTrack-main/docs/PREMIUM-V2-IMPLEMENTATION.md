# SecureTrack Premium V2 — Implementation Notes

## Added in this upgrade

- Added authenticated workspace pages for Monitoring Schedules, Organizations, API & Integrations, Security Center, and Help Center.
- Added schedule CRUD endpoints: `GET/POST /api/v1/schedules`, `PATCH/DELETE /api/v1/schedules/:id`.
- Added owner-scoped organization list/create/rename/delete endpoints.
- Added API key create/list/revoke endpoints. Raw keys are returned only on creation; SHA-256 hashes are stored. API key authentication is **not** enabled for protected requests in this version; session-cookie authentication remains active.
- Added responsive dark-theme styles for the new pages and navigation entries.
- Added API audit events for schedule, organization, and API key changes.

## Important operational notes

- Monitoring schedules store the selected cadence and `nextRunAt`. A separate worker/cron runner is still required to execute due schedules automatically; the UI says this explicitly.
- Organization membership invitations and role assignment are not implemented. Organizations are currently owner-managed.
- Email delivery, billing, webhook delivery, PDF report generation, and API-key request authentication are not enabled unless separately configured and implemented.
- The security-center and help pages are guidance pages, not a substitute for a security audit.

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and set a strong random `JWT_SECRET` and `MONGODB_URI`.
2. Set `CLIENT_URL=http://localhost:5173` for local Vite development.
3. In `backend/`, run `npm ci` and `npm run dev`.
4. In `frontend/`, run `npm ci` and `npm run dev`.
5. Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Do not commit `.env` files. The delivery archive intentionally excludes them and excludes `node_modules`; lockfiles are included.

## Verification performed in this packaging environment

- Backend `node --test`: 12 tests passed.
- `node --check` for backend resource routes: passed.
- JSX parser validation for `AppPages.jsx` and `EnterprisePages.jsx`: passed.
- A full Vite production build could not be completed in this environment because npm dependency installation timed out. Run `npm ci && npm run build` in the frontend directory before deployment.
- MongoDB-backed API integration, browser QA, scheduled worker execution, and penetration testing have not been performed here.
