# SecureTrack — Full Website Upgrade Plan

**Goal:** evolve the current React + Express + MongoDB starter into a polished, secure, deployable website-security posture platform without claiming that unfinished integrations are production-ready.

## 1. Current baseline

The supplied codebase already includes a public marketing site, authentication, an authenticated workspace, website inventory, passive checks, findings, remediation tasks, notifications, audit history, CSV reports, risk intelligence, scan change history, API docs, and basic request hardening. The backend's existing safe-target tests pass (7/7 in the current archive).

### Available today

- **Public site:** landing, features, how-it-works, pricing, contact, privacy and terms pages.
- **Account:** registration, login, cookie-based session, account settings and protected routes.
- **Security workflow:** website CRUD, manually triggered passive scans, scan records, findings, remediation tasks, risk overview and saved-scan comparison.
- **Operations:** dashboard summary, notifications, activity logs, CSV export, API documentation, liveness/readiness endpoints.
- **UI:** responsive workspace shell, dark/light theme, keyboard command palette, loading/error/empty states and severity/status components.

### Not production-complete yet

Recurring scan scheduling, email delivery, password-reset delivery, PDF reports, billing, API-key lifecycle, full organization administration, DNS-pinned outbound scanning, browser end-to-end coverage and penetration testing must be treated as future work. Pricing and contact pages are informational placeholders, not connected commerce or lead systems.

## 2. Recommended delivery phases

### Phase 0 — Reliability and release baseline (P0, first)

**Work**
- Install dependencies from lockfiles in a clean CI environment; build frontend and run backend tests on every pull request.
- Add linting, formatting, dependency audit, secret scanning and a supported Node.js version policy.
- Add MongoDB-backed integration tests for authentication, ownership isolation, website CRUD, scans, findings, tasks, reports and notifications.
- Add Playwright smoke tests for registration/login, navigation, mobile sidebar, theme toggle, form validation and logout.
- Add structured logs, error-rate/latency metrics, uptime alerts, database backup verification and documented restore drills.

**Acceptance criteria**
- Clean install and production build succeed in CI.
- Every API resource has tests for unauthenticated access, valid ownership, and cross-account access denial.
- Critical flows work at desktop and mobile breakpoints; keyboard focus and reduced-motion preferences are verified.
- A tested backup can be restored into a staging environment.

### Phase 1 — Security hardening (P0, before public exposure)

**Work**
- Harden scan egress: resolve and validate all A/AAAA records, pin the validated address for the actual connection, revalidate redirects, reject private/reserved/link-local/multicast destinations at every hop, and enforce outbound firewall/proxy allow rules. DNS pre-validation by itself is not sufficient against rebinding.
- Apply strict request schemas, field allowlists, query pagination caps, and per-action rate limits. Review object ownership checks on every read, update, delete, export and nested resource.
- Review cookie flags, session expiry/revocation, password policy, login abuse controls, CORS allowlists, CSRF protections for cookie-authenticated mutations, trusted proxy configuration and security headers.
- Add dependency scanning, threat modeling, log redaction, data retention controls and a vulnerability disclosure process.

**Acceptance criteria**
- SSRF test suite covers redirects, DNS rebinding scenarios, IPv4/IPv6 edge cases and blocked address ranges.
- Automated cross-tenant tests prove that account A cannot read or mutate account B's records.
- No secrets are committed; production configuration fails closed when required secrets or origin allowlists are missing.
- Security review and external penetration test findings are triaged before launch.

### Phase 2 — Monitoring engine and workflow (P1)

**Work**
- Implement a durable job queue (for example Redis + BullMQ) for scans; use worker concurrency limits, retry/backoff, timeouts, cancellation and idempotency.
- Turn monitoring schedules into real jobs with timezone-aware cadence, pause/resume, quiet hours and per-plan quotas.
- Persist scan duration, check versions, failure reasons and normalized evidence. Deduplicate recurring findings and retain first-seen/last-seen timestamps.
- Add finding assignment, comments, due dates, remediation verification and a clear state-transition history.
- Add scan progress and completion updates through polling or server-sent events; never label a queued task as completed.

**Acceptance criteria**
- Worker restart does not lose queued jobs; duplicate requests do not create duplicate scans.
- A scan timeout cannot leave a record stuck in `running` indefinitely.
- Schedules can be tested with a fake clock and do not run more frequently than configured.
- Finding lifecycle and remediation actions are visible in audit history.

### Phase 3 — Product UX and reporting (P1)

**Work**
- Add global search across websites/findings/tasks, saved filters, bulk triage and pagination for large tables.
- Add dashboard time ranges, trend charts, scan success rate, finding aging, risk movement and last-successful-scan timestamps.
- Add a website detail timeline, scan comparison drill-down and check-specific remediation guidance with evidence.
- Add validated PDF/CSV exports, report templates and scheduled report delivery only after delivery infrastructure is configured.
- Improve onboarding with an authorized-domain checklist, first scan walkthrough, sample/demo workspace and contextual help.

**Acceptance criteria**
- All tables expose search/filter/sort/page state accessibly and preserve it on navigation where practical.
- Charts include text summaries and do not rely on color alone.
- Exports are account-scoped, formula-injection-safe, and tested against large datasets.
- Empty, loading, failure and permission-denied states are designed and tested for every major page.

### Phase 4 — Team and platform features (P2)

**Work**
- Complete organization membership, invitations, roles (owner/admin/analyst/viewer), seat management and tenant-scoped queries.
- Add API key creation, one-time secret display, hashed storage, scopes, expiry, rotation and revocation.
- Add verified SMTP/email provider integration for invitations, password resets and alert digests; implement abuse-resistant reset tokens.
- Add plan entitlements, subscription checkout, webhook signature verification, billing portal and usage metering only when a billing provider is selected.
- Add integrations (Slack/webhooks/issue trackers) with signed payloads, retries, delivery logs and secret rotation.

**Acceptance criteria**
- Every organization resource is scoped by tenant and role; permission matrices have automated tests.
- API secrets are never stored or logged in plaintext and are shown only once.
- Password reset tokens are single-use, short-lived, hashed at rest and rate-limited.
- Billing state changes only from verified provider webhooks, not client-submitted claims.

### Phase 5 — Deployment and operations (P1 before general availability)

**Work**
- Provide Docker images for frontend/API/worker, production reverse-proxy examples, health/readiness probes and deployment templates.
- Configure HTTPS, secure environment secrets, MongoDB network restrictions, least-privilege database credentials, backups and retention.
- Add staging/production environment separation, migration strategy, rollback runbook and incident response checklist.
- Add service-level objectives for API availability, scan completion and notification delivery.

**Acceptance criteria**
- A new operator can deploy from documented steps without modifying source files.
- Secrets are injected at runtime and are absent from images and logs.
- Rollback and restore procedures are rehearsed; readiness fails when required dependencies are unavailable.

## 3. Priority matrix

| Priority | Feature | Why it matters | Depends on |
|---|---|---|---|
| P0 | SSRF-resistant scan networking | Prevents the scanner being abused to reach internal services | Network architecture, worker implementation |
| P0 | CI builds and integration/E2E tests | Catches regressions before release | Stable test environment |
| P0 | Tenant/ownership security review | Protects customer data | Existing resource routes/models |
| P1 | Durable queue and true schedules | Makes monitoring reliable | Queue + worker deployment |
| P1 | Finding deduplication and remediation workflow | Makes repeated scans actionable | Scan schema changes |
| P1 | Search, filters, trend reporting | Improves daily usability | API pagination and aggregation |
| P1 | SMTP and secure password reset | Completes account recovery | Email provider and token workflow |
| P2 | Organization roles and invitations | Supports teams safely | Tenant-scoping design |
| P2 | API keys and integrations | Enables automation | Secret lifecycle and audit events |
| P2 | Billing and entitlements | Supports paid plans | Product decisions and billing provider |

## 4. Suggested 6-sprint plan

1. **Sprint 1 — Quality gate:** clean installs, build/test CI, integration-test fixtures, error tracking and API ownership audit.
2. **Sprint 2 — Scanner safety:** worker/egress design, DNS pinning, redirect validation, network controls and threat-model review.
3. **Sprint 3 — Reliable scans:** durable queue, retries/timeouts, real schedules, progress states and operational metrics.
4. **Sprint 4 — Workflow UX:** finding deduplication, remediation lifecycle, search/filter/pagination and dashboard trends.
5. **Sprint 5 — Account/team foundations:** password reset/email, session review, organizations/roles and invitation flows.
6. **Sprint 6 — Launch readiness:** reporting polish, deployment templates, backup/restore drill, accessibility review and independent security test.

Sprint timing should be adjusted after a clean build, integration-test coverage and infrastructure constraints are measured. Do not commit to a public launch date until P0 acceptance criteria pass.

## 5. Architecture direction

- **Frontend:** keep React/Vite; split the large shared page module into feature modules as work continues, use a shared API/query layer, and standardize accessible forms, tables and error handling.
- **API:** retain Express initially; keep validation at route boundaries, ownership predicates in database queries, and stable response/error envelopes.
- **Data:** MongoDB with indexes for owner/tenant + createdAt/status; use explicit migrations for schema changes and retention policies for evidence/audit data.
- **Workers:** separate scan execution from API processes; place network egress behind a restricted worker environment.
- **Operations:** CI/CD, secret manager, logs/metrics/traces, alerting, backups, restore drills and documented incident handling.

## 6. Release checklist

- [ ] Clean `npm ci` for root/backend/frontend and successful production frontend build.
- [ ] Backend unit + MongoDB integration tests pass; frontend component + E2E smoke tests pass.
- [ ] Cross-account access tests pass for every resource and export.
- [ ] SSRF and redirect/DNS-rebinding protections verified in a restricted test environment.
- [ ] HTTPS, secure cookies, CORS, CSRF controls, rate limits and secrets configured.
- [ ] Backup restore, rollback and incident runbooks rehearsed.
- [ ] Accessibility, mobile layouts and reduced-motion behavior reviewed.
- [ ] Marketing copy and pricing match features that are actually live.
- [ ] Privacy, terms, data retention and authorized-use language reviewed for the deployment jurisdiction.

