# SecureTrack AI Premium V4

This source archive extends SecureTrack Premium V2 with an AI Copilot and finding-analysis workflow. AI requests use the backend-only OpenAI API integration and authorized records already stored by SecureTrack.

## What was added
- `/app/ai-copilot`: responsive chat workspace, saved conversations, and finding analysis.
- `GET /api/v1/ai/status`: reports whether a provider key is configured (never returns the key).
- `POST /api/v1/ai/chat`: asks questions using account-scoped website, finding, scan, and remediation records.
- `GET /api/v1/ai/conversations`, `GET /api/v1/ai/conversations/:id`, `DELETE /api/v1/ai/conversations/:id`.
- `POST /api/v1/ai/findings/:id/analyze`: creates defensive remediation guidance for an owned finding.
- `POST /api/v1/ai/risk-insights`: produces prioritized defensive insights from bounded recent records and computed counts.
- `POST /api/v1/ai/reports/summarize`: drafts an executive summary from server-computed metrics and bounded records.
- `GET /api/v1/ai/usage`: returns the authenticated user's recent AI request/token usage.
- MongoDB models for AI conversations, messages, and usage.
- Per-minute AI route rate limit and request-length validation.

## Enable live AI
1. Copy `backend/.env.example` to `backend/.env` if you have not already.
2. Set `GEMINI_API_KEY` to a valid provider key on the backend only.
3. Optionally set `AI_MODEL` (default `gemini-3.8-flash`) and `AI_TIMEOUT_MS` (default 30000).
4. Restart the backend.
5. Open **AI Copilot** in the authenticated SecureTrack workspace.

Do not put `GEMINI_API_KEY` in any `VITE_*` variable or frontend `.env`. Never commit `.env` files. Provider usage may incur charges according to your provider account.

Without a key, the page intentionally reports that AI is not configured and the backend returns `503 AI_NOT_CONFIGURED`; it does not generate fake AI responses.

## Data and safety notes
- AI endpoints require the same SecureTrack session cookie as other protected API endpoints.
- Context queries are filtered by the authenticated user's `owner` ID.
- The model is instructed to treat stored website/finding evidence as untrusted reference data and not as instructions.
- The assistant is advisory. It does not run scans, modify findings, close issues, or execute remediation.
- Messages and usage metadata are stored in MongoDB. Review your organization's retention/privacy requirements before enabling this feature.
- This implementation sends the selected account-scoped context and message history to the configured external AI provider. Avoid storing secrets or personal data in website names, evidence, or prompts.
- Model answers can be inaccurate. Verify suggestions against scan evidence and test fixes before deployment.

## API behavior
All AI endpoints are mounted under `/api/v1/ai` and require authentication. The `chat` body accepts `message` (1–4000 characters) and optional `conversationId`. AI routes have a dedicated rate limit of 20 requests per minute per effective client/IP configuration, in addition to general API limits.

## Verification
From the project root:
```bash
npm run install:all
npm test
npm run build
```
The archive should be tested in the target deployment environment with a configured MongoDB database and provider key. Tests/builds must be run before calling the release production-ready.
