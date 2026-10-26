# SecureTrack — Website Security Monitoring

A MERN application for managing authorized websites and monitoring passive security posture. It checks HTTPS/HTTP availability, response headers, redirect behavior, response timing and TLS certificate metadata. It is **not** a full vulnerability scanner.

## Features implemented
- React/Vite responsive SaaS dashboard with dark/light theme, animated navigation, charts and toast feedback.
- Cookie-based JWT authentication, registration/login/logout, profile and password change. The `/auth/me` session probe returns `200` with `user: null` for signed-out visitors; protected resource endpoints still return `401`.
- Tenant-scoped website CRUD, scan history, findings, remediation tasks, notifications and CSV reports.
- Passive checks with SSRF defenses: HTTP(S) only, common private/reserved address blocking, restricted ports, DNS validation, redirect revalidation, bounded timeout/body size, and per-user scan rate limit.
- Mongoose models, versioned REST API, Swagger UI, audit events, scheduled monitoring foundation, tests and docs.

## Prerequisites
Node.js 20+, npm, and MongoDB 7+ (local or Atlas).

## Run on Windows (VS Code terminal)
1. Copy `backend/.env.example` to `backend/.env` and set a long random `JWT_SECRET` (32+ characters).
2. Copy `frontend/.env.example` to `frontend/.env` if needed.
3. Start MongoDB locally, or set `MONGODB_URI` to your Atlas URI.
4. From project root run `npm install`, `npm run install:all`, then `npm run dev`.
5. Frontend: http://localhost:5173 — API: http://localhost:5000/api/v1 — Swagger: http://localhost:5000/api-docs

Alternatively run separately: `npm run dev --prefix backend` and `npm run dev --prefix frontend`.

## Environment
See both `.env.example` files. Never commit real secrets. Cookie auth uses HttpOnly, SameSite=Lax cookies; production should set `COOKIE_SECURE=true` behind HTTPS and configure exact `CLIENT_URL`.

## Testing/build
- `npm test --prefix backend` (uses Node test runner and an in-memory HTTP test where possible; integration tests need MongoDB).
- `npm run build --prefix frontend`
- `npm run build`

## Deployment (Render + Atlas)
Create a MongoDB Atlas database with network access restricted to the deployment egress IP where practical. Deploy backend as a Node web service with root `backend`, build `npm install`, start `npm start`; set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`, `COOKIE_SECURE=true`. Deploy frontend as static site with root `frontend`, build `npm install && npm run build`, publish `dist`, and set `VITE_API_URL=https://YOUR-API-DOMAIN/api/v1`. Configure CORS and cookies for your actual deployment topology. Cross-site cookies may require `SameSite=None; Secure` and explicit CSRF defenses.

## Security limitations
- Monitoring is passive and limited to the checks described above; no exploitation, port scanning, content crawling, or authenticated testing.
- SSRF protections are defense-in-depth, not a substitute for network egress controls. Run workers in a restricted network and consider pinning DNS answers at the transport layer for high-risk deployments.
- Team invitation workflow, API key issuance, PDF export, SMTP delivery, and advanced admin operations are not fully implemented in this starter. UI sections label unavailable features rather than pretending to save data.
- This source has not been independently penetration-tested. Review before production deployment.

## Screenshots
Add screenshots of your running instance here.


## Troubleshooting

- `GET /api/v1/auth/me` is a public session probe and should return `200` with `data.user: null` when signed out. Protected resource endpoints still return `401` without a valid session. After successful login, the browser should send the `securetrack_session` HTTP-only cookie.
- Validation errors from Zod now return `400` with field-level messages instead of a generic `500`. Audit-log listing filters by its actual `user` field. If `/tasks` still returns `500`, inspect the backend terminal for the underlying MongoDB/model error.
- Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env` if you need to override the default API URL. Never commit real secrets.

## Production deployment additions

A single-container Docker deployment and Docker Compose MongoDB setup are available in `Dockerfile` and `docker-compose.yml`. See [`README-DEPLOYMENT.md`](./README-DEPLOYMENT.md) for setup and production checklist. The backend validates required production secrets at startup and gracefully handles SIGINT/SIGTERM. A GitHub Actions workflow runs backend tests and the frontend production build.


## SecureTrack AI Premium V4
The V4 source adds an authenticated AI Copilot and finding analysis. See `AI-V4-README.md` for setup, data handling, API contracts, and verification steps. AI requires a backend-only `GEMINI_API_KEY`; responses are not mocked when AI is unconfigured.
