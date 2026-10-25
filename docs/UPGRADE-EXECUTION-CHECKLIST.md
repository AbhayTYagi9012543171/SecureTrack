# SecureTrack — Upgrade Execution Checklist

Use this as the implementation tracker. Mark an item complete only after testing it.

## Release 0 — Baseline
- [ ] Clean install backend and frontend using lockfiles.
- [ ] Run backend unit tests and frontend production build.
- [ ] Start MongoDB and run auth/resource integration tests.
- [ ] Confirm all routes and navigation links resolve.
- [ ] Record existing defects before changing behavior.

## Release 1 — Security and data correctness
- [ ] Verify owner/tenant scope for every resource query and mutation.
- [ ] Add negative tests for cross-user website, scan, finding, task, report, notification and activity-log access.
- [ ] Review auth cookies, CORS, CSRF/origin protection, session expiry and rate limits.
- [ ] Expand SSRF tests for redirects, IPv6, mapped addresses, metadata IPs and DNS rebinding mitigations.
- [ ] Verify CSV export scoping and spreadsheet formula escaping.
- [ ] Ensure logs do not expose passwords, tokens, cookies or secrets.

## Release 2 — UX consistency
- [ ] Standardize page headers, spacing, forms, buttons, badges, tables and dialogs.
- [ ] Add loading, empty, error and retry states to every data-backed page.
- [ ] Add confirmation for destructive actions and feedback for successful saves.
- [ ] Audit all routes at 320/375/768/1024/1440px widths.
- [ ] Audit keyboard order, focus states, labels, contrast and reduced-motion.
- [ ] Label sample data and clearly disclose monitoring scope/limitations.

## Release 3 — Monitoring reliability
- [ ] Use a durable queue for long-running scans.
- [ ] Implement bounded retries, idempotency, deduplication and cancellation.
- [ ] Add global/per-account concurrency and usage limits.
- [ ] Store versioned evidence and normalized scan outcomes.
- [ ] Implement schedule timezone, pause, retry and failure behavior.
- [ ] Add integration tests for timeout, redirect loop, target rejection and worker crash.

## Release 4 — Findings and remediation
- [ ] Document versioned severity/risk scoring.
- [ ] Preserve finding history while deduplicating recurring observations.
- [ ] Add task owner, due date, status history and comments.
- [ ] Verify task/finding state changes are audited.
- [ ] Add notification provider only after configuration and delivery tests.
- [ ] Keep unavailable PDF, team, billing or API-key features hidden or explicitly marked planned.

## Release 5 — Production operations
- [ ] CI runs backend tests, frontend build, dependency audit and container build.
- [ ] Validate production env configuration and secure cookies.
- [ ] Configure TLS, trusted proxy, exact CORS origins and secrets management.
- [ ] Configure database backup monitoring and complete a restore drill.
- [ ] Add alerts for API errors, DB readiness, queue backlog and scan failures.
- [ ] Test graceful shutdown, rollback and staging smoke tests.
- [ ] Perform independent security review before onboarding real customer targets.

## Release evidence
For every release, record commit/version, test output, known limitations, environment used, reviewer and rollback plan.
