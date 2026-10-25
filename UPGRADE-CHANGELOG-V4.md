# SecureTrack Premium V4 — AI upgrade changelog

## Added
- AI Copilot page with conversation history, suggested prompts, live provider status, message composition, and defensive guidance.
- Finding Intelligence workflow from a finding selector.
- AI risk insights and executive report draft actions.
- Account-level AI request and token usage summary.
- Authenticated AI API routes with a dedicated rate limiter.
- Owner-scoped context assembly for websites, findings, scans, and remediation tasks.
- OpenAI Chat Completions provider adapter using Node's built-in `fetch` (no new backend package required).
- Request timeout, input validation, provider error mapping, conversation ownership checks, and audit events.
- MongoDB models for conversations, messages, and AI usage tracking.
- AI setup and privacy documentation.

## Important behavior
- AI is disabled until `OPENAI_API_KEY` is configured on the backend.
- No fake/demo AI responses are returned when provider configuration is missing.
- AI does not autonomously modify records or execute security operations.
- AI suggestions are not guaranteed to be correct; validate them against original evidence.

## Still requiring verification or future work
- Run `npm run install:all`, backend tests, and frontend production build in a clean environment.
- Verify AI provider access, MongoDB persistence, rate limits, and browser flows against a configured test database.
- Add streaming responses, configurable organization-level AI policy, budget hard limits, explicit data-retention controls, prompt-evaluation suites, and retrieval-augmented internal knowledge only after requirements are defined.
- The existing background scan/schedule architecture still requires independent validation; this AI feature does not make scans automatically scheduled or durable.
