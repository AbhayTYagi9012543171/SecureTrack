# SecureTrack Premium V2 Changelog

## New authenticated pages
- Monitoring Schedules: create, view, pause/resume, and delete schedule records.
- Organizations: create, list, rename, and delete owner-managed organizations.
- API & Integrations: create/list/revoke API keys; new secrets are shown once.
- Security Center: account-protection and deployment hardening guidance.
- Help Center: collapsible onboarding and workflow guides.

## Backend
- Added owner-scoped schedule CRUD endpoints and persisted next-run metadata.
- Added owner-scoped organization CRUD endpoints.
- Added API-key create/list/revoke endpoints with cryptographic random secrets and SHA-256 hash storage.
- Added audit entries for new mutations.

## UI
- Added responsive dark premium styling for enterprise pages.
- Added navigation links and command-palette destinations.

## Limitations to know
- Schedules require a separate worker/cron process to execute scans automatically.
- API keys are not yet accepted as an authentication method; session-cookie auth remains in use.
- Team invitations, outbound webhooks, billing, email delivery, and PDF reports are not claimed as implemented.
