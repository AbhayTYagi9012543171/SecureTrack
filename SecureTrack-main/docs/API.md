# SecureTrack API (v1)

Base URL: `http://localhost:5000/api/v1`

Authentication uses the `securetrack_session` HttpOnly cookie. Browser clients must send credentials. All resource routes are authenticated and scoped to the current user's owner ID.

## Authentication
- `POST /auth/register` — `{ name, email, password }`
- `POST /auth/login` — `{ email, password }`
- `POST /auth/logout` — clears the session cookie
- `GET /auth/me` — session probe; returns `200` with `data.user` or `null`
- `PATCH /auth/profile` — update name/preferences
- `PATCH /auth/password` — change password after verifying current password

## Resources
- `GET/POST /websites`, `GET/PATCH/DELETE /websites/:id`, `POST /websites/:id/monitoring`
- `GET/POST /scans`, `GET /scans/:id`, `POST /scans/:id/cancel`
- `GET/PATCH/DELETE /findings/:id` (delete only resolved/accepted findings)
- `GET/POST /tasks`, `PATCH/DELETE /tasks/:id`
- `GET/PATCH/DELETE /notifications`, `PATCH /notifications/read-all`
- `GET/POST /reports`, `GET /reports/:id/csv`
- `GET /dashboard/summary`, `GET /audit-logs`

List endpoints support `page` and `limit`; resource lists return `{ items, pagination }` in `data`. Errors use `{ success: false, message }`, with validation details when available.

Interactive Swagger UI: `http://localhost:5000/api-docs`; OpenAPI JSON: `http://localhost:5000/openapi.json`.
