# SecureTrack — Full Website Upgrade Blueprint (2026)

## 1. Product vision

Build SecureTrack into a polished, trustworthy SaaS workspace for **authorized, passive website security-posture monitoring**. The product should help a customer inventory their websites, run bounded HTTP/TLS posture checks, understand evidence-backed findings, assign remediation, and track changes over time.

**Product boundary:** this is not an exploit framework or a general-purpose vulnerability scanner. Do not market passive header/HTTPS checks as proof that a website is secure.

## 2. Current baseline in this archive

### Present in source
- React + Vite frontend with public marketing pages and authenticated workspace pages.
- Express + Mongoose REST API, versioned under `/api/v1`.
- Cookie-based JWT authentication, user profile/password flows, validation and rate limiting.
- Website inventory and detail/edit/create pages.
- Passive scan workflow and scan history.
- Findings, remediation tasks, reports/CSV, notifications, activity logs and settings.
- Security-oriented URL validation, redirect revalidation, bounded checks and SSRF-related tests.
- Swagger/API docs, Docker files, deployment notes, CI workflow and environment templates.
- Premium dark landing page and responsive styling layers.

### Verified in this packaging environment
- Backend Node test suite: **12/12 tests passed**.
- Frontend production build: **not verified** because Vite is not installed in the extracted frontend dependencies (`vite: not found`). Run a clean `npm ci --prefix frontend` where npm registry access is available, then build.
- MongoDB-backed end-to-end tests, browser/device QA, Docker image build, accessibility audit and penetration test: **not run**.

## 3. Upgrade principles
1. **Real data only:** label sample/preview data. Never show fake metrics as live scans.
2. **Security first:** authorize every resource server-side; never trust a hidden UI button as access control.
3. **Evidence-led findings:** every finding should contain a check ID/version, observed evidence, timestamp, severity rationale and actionable fix.
4. **Resilient UX:** every async view needs loading, empty, error, retry and success states.
5. **Accessible premium design:** keyboard support, visible focus, semantic labels, contrast, reduced-motion support and responsive layouts.
6. **Incremental releases:** feature is not complete until tested, documented and verified in a real environment.

## 4. Website and application information architecture

### Public website
- `/` — premium landing page, product value proposition, clearly labelled illustrative preview, feature highlights, workflow, CTA and footer.
- `/features` — detailed capability explanations and honest scope boundaries.
- `/how-it-works` — authorized-domain onboarding, check execution, evidence and remediation lifecycle.
- `/pricing` — plan comparison only when pricing/entitlements are actually enforced; otherwise mark as a product-plan concept or remove checkout language.
- `/contact` — validated contact form; only claim delivery when a mail provider is configured.
- `/privacy` and `/terms` — reviewed legal copy, not generic placeholders.
- `/login` and `/register` — accessible auth forms with validation, clear errors and password visibility controls.
- `*` — helpful 404 page and route back to a safe destination.

### Authenticated workspace
- `/app/dashboard` — overview cards, recent scans, risk trend, unresolved findings, recent activity and onboarding checklist.
- `/app/websites` — searchable, filterable, paginated website inventory; add/edit/archive with confirmation.
- `/app/websites/:id` — current posture, scan history, findings summary, certificate/redirect/header evidence and next actions.
- `/app/scans` — scan history with queued/running/completed/failed/cancelled states, filters and scan detail.
- `/app/findings` — evidence-backed findings, severity filters, deduplication and remediation state.
- `/app/tasks` — assigned remediation work, owner, due date, status history and comments.
- `/app/reports` — date/filter selection, CSV export, export status and scope warning.
- `/app/notifications` — read/unread state and destination links.
- `/app/activity` — security-relevant audit timeline with pagination.
- `/app/settings` — profile, password, sessions, preferences and security controls.
- `/app/help` — setup guide, definitions, limitations and troubleshooting.

Only expose routes that exist in the router and API; avoid navigation items that imply unavailable functionality.

## 5. Design system upgrade

### Visual direction
- Premium security SaaS: deep ink/charcoal canvas, layered panels, subtle blue/cyan accents, clear typography, restrained gradients and purposeful whitespace.
- Use a consistent spacing scale (4/8/12/16/24/32/48/64), type scale, radii, borders, shadows and semantic color tokens.
- Keep animation short and functional. Respect `prefers-reduced-motion`; do not animate critical status indicators continuously.
- Use one icon family consistently and provide text labels for meaning; color must not be the only status cue.

### Shared components
- `AppShell`, `Sidebar`, `Topbar`, mobile navigation and breadcrumbs.
- `PageHeader`, `StatCard`, `DataTable`, `SearchField`, filters, pagination and date range picker.
- `SeverityBadge`, `StatusBadge`, risk score with explanation, evidence panel and copyable URL.
- `Skeleton`, `EmptyState`, `InlineNotice`, retry panel, toast and confirmation dialog.
- Accessible form field, password field, field-level validation and unsaved-change warning.

### Acceptance criteria
- No horizontal overflow at 320px, 375px, 768px, 1024px and 1440px widths.
- All interactive elements work by keyboard; focus is visible and not trapped.
- Contrast meets WCAG AA for text and essential controls.
- Loading/empty/error states are visually consistent.
- Tables have mobile alternatives or intentional horizontal scroll with clear affordance.

## 6. Backend/API roadmap

### Foundation
- Maintain `/api/v1` and a consistent response/error envelope.
- Add request IDs, structured logs with redaction, validation, bounded payloads and pagination limits.
- Add readiness/liveness checks and avoid exposing environment/secrets in health output.
- Add explicit API schemas/examples and route-level authorization tests.

### Authentication and account security
- Verify register/login/logout/session expiry/password change end-to-end.
- Use HttpOnly, Secure (production), SameSite cookies and strict CORS origin allowlists.
- Add CSRF/origin protection appropriate to the cookie-auth model.
- Implement password reset with short-lived, single-use hashed tokens and generic responses; email sending must be configured before claiming this works.
- Add email verification and optional MFA only with recovery, rate limits and tested enrollment flows.
- Add session revocation and password-change invalidation policy.
- Rate-limit login, registration, reset and sensitive account actions independently.

### Website inventory and scan engine
- Validate `http:`/`https:` only; reject embedded credentials and unsupported ports.
- Resolve and reject loopback, private, link-local, multicast, reserved and metadata targets, including IPv6 and IPv4-mapped IPv6.
- Revalidate each redirect hop. Prefer pinning validated DNS answers at the transport layer to reduce DNS rebinding exposure.
- Apply connect/read/overall timeouts, response-size bounds, concurrency caps, per-user quotas and global queue limits.
- Move long-running scans to a durable queue with retries, deduplication, cancellation and idempotent completion.
- Record check version, normalized result, evidence, start/end timestamps and failure reason.
- Keep passive checks narrowly defined; do not add invasive testing without a separate explicit authorization and safety design.

### Findings and remediation
- Define a versioned severity rubric with explainable scoring; do not present an unexplained single score as definitive.
- Deduplicate repeat findings by website + check ID while preserving observation history.
- Track finding state (`open`, `accepted`, `resolved`, `reopened`) and last-seen timestamps.
- Remediation tasks need owner, due date, status transitions, comments and change history.
- Notify only after provider configuration, retries, bounce/error handling and opt-out preferences are tested.

### Data integrity and tenancy
- Audit every read/update/delete for ownership scope; test IDOR/cross-account access.
- If organizations are supported, implement membership, role checks, invitations, revocation and tenant-scoped indexes before exposing team UI.
- Add indexes for owner, website, status and creation date after reviewing query patterns.
- Implement account data export/deletion and documented retention rules.
- Backups are only meaningful with restore drills and monitored backup success.

### Reports
- Scope all exports to the current user/organization.
- Escape CSV spreadsheet formulas (`=`, `+`, `-`, `@`, tab/newline prefixes) and test malicious values.
- Use streaming or bounded exports and audit export activity.
- PDF export remains planned until implemented and tested.

## 7. Security and privacy checklist
- [ ] Threat model: auth, tenant boundaries, SSRF, scan abuse, exports, stored content and deployment.
- [ ] Exact CORS allowlist; no wildcard credentials.
- [ ] Production cookies Secure + HttpOnly + suitable SameSite policy.
- [ ] CSRF/origin checks for state-changing cookie-auth requests.
- [ ] Rate limits for auth and scan actions.
- [ ] SSRF tests for IPv4/IPv6, DNS rebinding assumptions, redirect chains, metadata targets and unusual URL encodings.
- [ ] Request/body/time limits and safe outbound network egress rules.
- [ ] Input validation on every mutation; output encoding for user-controlled text.
- [ ] Owner/organization checks on every resource operation.
- [ ] Security headers, TLS termination and production proxy configuration reviewed.
- [ ] Dependency audit and secret scanning in CI.
- [ ] PII/secrets removed from logs; access to audit logs controlled.
- [ ] Retention, deletion, backup and restore policies documented.
- [ ] Independent security review before handling real customer targets at scale.

## 8. Prioritized delivery plan

### P0 — make current app reliably runnable
- Clean-install backend and frontend from lockfiles.
- Resolve frontend build errors and lint/accessibility warnings.
- Validate environment examples and startup failure messages.
- Smoke-test registration, login, logout, `/auth/me`, dashboard and protected API.
- Verify all navigation links and all CRUD paths.
- Add a test MongoDB integration environment in CI.

**Exit gate:** reproducible install, frontend build passes, backend tests pass, auth and core CRUD smoke tests pass.

### P1 — correctness and security
- Cross-account authorization tests for every resource.
- Cookie/CSRF/CORS review and auth abuse tests.
- SSRF redirect/DNS edge-case tests and outbound egress controls.
- Validate error envelopes, pagination, export scope and CSV formula escaping.
- Add request IDs and redacted structured logs across the app.

**Exit gate:** no known cross-tenant data access, critical auth/SSRF tests pass, failures are observable.

### P2 — premium workspace UX
- Standardize page layouts, tables, forms and feedback states.
- Add dashboard onboarding, skeletons, empty states, retry controls and destructive confirmations.
- Responsive and keyboard review for all routes.
- Ensure all statuses have text labels and risk scores include explanations.

**Exit gate:** responsive and accessibility checklist passes; no dead links or fake-live metrics.

### P3 — reliable monitoring operations
- Durable queue, retries, deduplication, cancellation and concurrency controls.
- Scan scheduling with timezone, pause/opt-out and failure semantics.
- Finding lifecycle, remediation ownership and history.
- Retention policy and bounded exports.

**Exit gate:** integration tests cover timeouts, redirects, retries, cancellation and duplicate jobs.

### P4 — advanced SaaS capabilities
- Organization/team roles and invitation flow.
- Email verification/reset, optional MFA and session management.
- Notification delivery provider, optional PDF reports and API key management.
- Usage quotas, plan entitlements and billing only if a payment provider is integrated.

**Exit gate:** feature-specific authorization, recovery, audit and end-to-end tests exist. Hide incomplete features.

### P5 — production readiness
- CI: install, tests, frontend build, dependency audit and container build.
- Staging environment with production-like cookies/CORS/proxy.
- TLS, secrets manager, database backups and restore drill.
- Monitoring/alerts for API errors, queue backlog, scan failures and database readiness.
- Release/rollback checklist and incident response contact.

**Exit gate:** staging smoke tests and restore drill pass; owners accept residual risks.

## 9. Test matrix

| Area | Required cases | Evidence |
|---|---|---|
| Auth | register, duplicate email, login failure, logout, expired session, password change | automated API tests |
| Authorization | anonymous, owner, other user, organization role | negative permission tests |
| Websites | create, invalid URL, edit, delete/archive, pagination | API + UI tests |
| Scans | valid target, blocked target, timeout, redirect loop, cancellation, retry | unit + integration tests |
| Findings | severity, evidence, dedupe, resolved/reopened | model/service tests |
| Tasks | ownership, status transition, due date, comments | API tests |
| Exports | account scope, empty result, CSV formula injection, large result | automated tests |
| UI | loading, empty, failure, retry, keyboard, reduced motion | component + browser tests |
| Deploy | env validation, readiness, secure cookie, CORS, shutdown | CI + staging smoke tests |
| Operations | backup restore, log redaction, alerts, rollback | runbook evidence |

## 10. Release checklist
- [ ] `npm ci --prefix backend`
- [ ] `npm ci --prefix frontend`
- [ ] `npm test --prefix backend`
- [ ] `npm run build --prefix frontend`
- [ ] Run MongoDB integration suite against disposable test DB.
- [ ] Run dependency and secret scans.
- [ ] Build container and start it with production-like environment.
- [ ] Check health/readiness and graceful shutdown.
- [ ] Test signup/login/logout and core flows in a browser.
- [ ] Verify cookies, CORS, CSRF/origin checks and security headers.
- [ ] Test cross-account access attempts.
- [ ] Verify mobile, keyboard, contrast and reduced-motion behavior.
- [ ] Confirm backups and restore drill.
- [ ] Record known limitations and rollback steps.

## 11. Run locally on Windows

1. Install Node.js 20+ and MongoDB 7+ or create an Atlas database.
2. Copy `backend/.env.example` to `backend/.env`; set a unique random `JWT_SECRET` of at least 32 characters and a valid `MONGODB_URI`.
3. Copy `frontend/.env.example` to `frontend/.env` if needed.
4. From the project root:
   ```powershell
   npm install
   npm run install:all
   npm run dev
   ```
5. Open `http://localhost:5173`; API base is `http://localhost:5000/api/v1`; Swagger is `http://localhost:5000/api-docs`.
6. Verify the frontend build and backend tests before deploying.

Do not copy development secrets into production. Configure actual frontend origin, HTTPS, cookie policy, CORS and trusted proxy for the deployment topology.

## 12. Definition of done

A capability is done only when it is implemented, tested, permission-checked, documented, accessible, observable and verified in a deployed-like environment. Source code or a roadmap alone does not prove production readiness.
