# SecureTrack upgraded source — quick start

This archive contains the full source for the upgraded SecureTrack website: React/Vite frontend, Express/Mongoose API, passive monitoring checks, auth, workspace pages, tests, Docker configuration, and project documentation.

## 1) Requirements
- Node.js 20 or newer and npm
- MongoDB 7+ running locally, or a MongoDB Atlas connection string

## 2) Configure environment
1. Copy `backend/.env.example` to `backend/.env`.
2. Replace `JWT_SECRET` with a unique random secret of at least 32 characters.
3. Set `MONGODB_URI` to your local MongoDB or Atlas URI.
4. Copy `frontend/.env.example` to `frontend/.env` only if you need to change the API URL.
5. Never commit `.env` files or real credentials.

## 3) Install and run (Windows PowerShell or terminal)
From the project root:

```bash
npm install
npm run install:all
npm run dev
```

Open `http://localhost:5173`. The API is at `http://localhost:5000/api/v1`; API docs are at `http://localhost:5000/api-docs`.

You can also run each service in separate terminals:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

## 4) Optional AI Copilot
Read `AI-V4-README.md`. To enable live AI, set `OPENAI_API_KEY` in `backend/.env` only and restart the backend. Without this key the AI page remains available but clearly reports that the provider is not configured; it does not return mock AI answers.

## 5) Verify

```bash
npm test
npm run build
```

Backend unit tests were run while preparing this archive: 12 passed, 0 failed. A frontend production build was not confirmed in the preparation environment because the archive's pre-existing `node_modules` was incomplete for that environment. Install cleanly using the lockfile and run the build command above before deployment.

## 6) Product scope and safety
SecureTrack provides authorized passive website security-posture checks. It is not a full vulnerability scanner and does not guarantee a website is secure. Only add websites you own or are explicitly authorized to monitor. Review `docs/SECURITY.md` and `README-DEPLOYMENT.md` before production use. Independent penetration testing and end-to-end production verification remain outstanding.
