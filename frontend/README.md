# SecureTrack Frontend

React 18 + Vite single-page application for SecureTrack.

## Pages and routes

### Public pages
- `/` — product landing page
- `/features` — monitoring features
- `/how-it-works` — monitoring workflow
- `/pricing` — plan overview (billing is not enabled)
- `/contact` — contact/configuration information
- `/privacy` — privacy information
- `/terms` — authorized-use terms
- `/login` and `/register` — connected authentication forms
- `/forgot-password` and `/reset-password` — informational recovery pages; email-token recovery is not enabled by the current backend

### Protected workspace
- `/app` — dashboard with live summary, scans, findings and recent activity
- `/app/websites` — website list, search, monitoring toggle and delete
- `/app/websites/new` — create website
- `/app/websites/:id` — website details and associated scan history
- `/app/websites/:id/edit` — update website
- `/app/scans` — run and review scans
- `/app/findings` — filter findings and update finding status
- `/app/tasks` — create, update and delete remediation tasks
- `/app/reports` — generate and download CSV reports
- `/app/notifications` — read and manage notifications
- `/app/audit-logs` — audit history
- `/app/settings` — profile preferences and password change

## Shared components

`src/components/common/` contains reusable page headers, animated statistic cards, loading skeletons, error states and empty states. Shared layout, routing, authentication guards and page-level workflows are wired through `src/App.jsx`; global responsive design tokens and page styling are in `src/styles.css`.

## Dynamic behavior

Workspace pages request records from the configured API; statistics are not filled with mock sample data. Create/update/delete actions call the backend and refresh local state or data. The top navigation includes a keyboard-accessible quick-navigation palette (`Ctrl+K` / `⌘K`) and an unread-notification count.

## Configuration and commands

Set `VITE_API_URL` in `frontend/.env` if the API is not at the default `http://localhost:5000/api/v1`.

```bash
npm install
npm run dev
npm run build
npm test
```

Password recovery, billing, email delivery, and other integrations must not be presented as active until the corresponding backend endpoints and services are configured.


## Premium UI architecture
See `src/styles/` for centralized CSS layers and `src/components/` for reusable layout, navigation, feedback, form, data-display, overlay, and security components. The original global styles are preserved in `src/styles/legacy.css` and loaded through `src/styles.css` for backward compatibility. See `../docs/PREMIUM-UPGRADE.md` for migration notes.
