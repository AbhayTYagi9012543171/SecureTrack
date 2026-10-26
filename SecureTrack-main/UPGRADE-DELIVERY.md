# SecureTrack Premium Upgrade — Delivery Notes

This archive contains the upgraded source project, not preinstalled dependencies. It intentionally excludes `node_modules`, `.env`, Git internals, build output, and local logs so the ZIP is smaller and does not redistribute machine-specific packages or local secrets.

## Included

- React 18 + Vite frontend with the existing page suite, reusable navigation/layout/components, dark/light theme styles, responsive styles, focus states, and reduced-motion support.
- Express + Mongoose backend with versioned API routes, cookie-based JWT authentication, validation/error middleware, monitoring services, resource models, and safe-target tests.
- Environment templates, Docker Compose, API/architecture/security documentation, upgrade audit, and this delivery note.
- Existing upgrades for request IDs, liveness/readiness endpoints, authentication throttling, queued scan state, CSV formula-injection mitigation, and SSRF-target test coverage.
- Additional premium-polish CSS layer for stronger contrast, responsive refinements, visible focus states, light-theme surfaces, and reduced-motion behavior.
- Session cookies default to Secure in production unless explicitly overridden.

## Windows setup

1. Install Node.js 20+ and MongoDB 7+ (or create a MongoDB Atlas database).
2. Extract the ZIP.
3. Copy `backend/.env.example` to `backend/.env` and configure `MONGODB_URI`, a unique random `JWT_SECRET` of at least 32 characters, and `CLIENT_URL`.
4. If using a non-default API URL, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL`.
5. From the project root, run:

   ```powershell
   npm install
   npm run install:all
   npm test
   npm run build
   npm run dev
   ```

6. Open `http://localhost:5173`. The API defaults to `http://localhost:5000/api/v1` and Swagger UI to `http://localhost:5000/api-docs`.

## Verification performed while packaging

- `node --test backend/tests/*.test.js`: passed 7/7 tests.
- Frontend build: attempted, but could not complete using the supplied archive's partial `node_modules`; Rollup's platform-specific optional package `@rollup/rollup-linux-x64-gnu` was missing. Run a clean `npm ci --prefix frontend` with npm registry access, then `npm run build --prefix frontend`.
- MongoDB-backed integration tests, browser QA, and penetration testing have not been performed in this packaging environment.

## Production caveats

- Use only for websites you are authorized to monitor.
- Passive HTTP/TLS posture checks only; no exploitation or unrestricted scanning.
- Add transport-level DNS pinning and outbound network egress restrictions before exposing scan workers to untrusted target lists.
- Configure HTTPS, secure cookies, exact CORS origins, backups, log retention, and monitoring before production use.
- Organization models are present, but full membership-based tenant administration is not complete in this source pass.
- SMTP delivery, PDF export, API-key issuance, and advanced administration must not be advertised as complete unless implemented and tested separately.
