# SecureTrack Full Website Upgrade Delivery

This package preserves the existing SecureTrack website source and includes an expanded full-site upgrade blueprint, execution checklist, and a verification audit.

## What is included
- React/Vite frontend source and styling
- Express/Mongoose backend source and models
- Authentication, website inventory, passive scan, findings, remediation, reports, notifications, activity and settings areas
- API/deployment/security documentation, Docker configuration and CI workflow
- `docs/FULL-WEBSITE-UPGRADE-PLAN.md` — complete product, UX, backend, security, test and phased release plan
- `docs/UPGRADE-EXECUTION-CHECKLIST.md` — actionable delivery checklist
- `docs/UPGRADE-AUDIT.md` — current verification status and honest limitations

## Verification status
Backend unit tests passed **12/12** in the packaging environment. Frontend build is **not verified** because Vite was not installed in the extracted dependency set. Clean-install dependencies and run the frontend build before deployment. MongoDB integration, browser QA, container build and penetration testing remain outstanding.

## Start
See `README.md` and `README-DEPLOYMENT.md`. Configure `backend/.env` from the example file; never commit secrets.
