# Security notes

- Passwords are hashed with bcrypt. Session JWTs are stored only in HttpOnly cookies and are never returned in JSON.
- Use a unique random `JWT_SECRET` (32+ characters) per environment. Set `COOKIE_SECURE=true` in HTTPS production. Configure the exact frontend origin in `CLIENT_URL`.
- CORS uses an allowlist and credential support. The API sets `Cache-Control: no-store`. Rate limits are applied to auth and API routes.
- Protected resource queries scope data to the authenticated user. Do not trust client-supplied ownership IDs.
- Monitoring is passive and limited to HTTP(S), response status/timing, selected headers, redirect behavior, and TLS certificate metadata. It is not a full vulnerability scanner.
- Target validation blocks common private/reserved addresses and restricts ports. This is defense-in-depth; high-risk deployments should enforce egress filtering and pin validated DNS answers at the connection layer to mitigate rebinding.
- Password-reset delivery, organization invitations, API-key issuance, PDF reports, and complete administrative workflows are not implemented in this release. Do not present them as available security features.
