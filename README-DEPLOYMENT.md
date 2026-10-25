# SecureTrack deployment quick start

## Docker Compose

1. Install Docker Engine / Docker Desktop with Compose v2.
2. Create a `.env` file in the project root. Set a unique random secret and the public origin used by the browser:

   ```dotenv
   JWT_SECRET=replace-with-a-unique-random-secret-at-least-32-characters
   CLIENT_URL=https://securetrack.example.com
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=lax
   PORT=5000
   ```

   Replace the example secret and domain before use. Do not commit `.env`.
3. Build and start: `docker compose up --build -d`
4. Check `http://localhost:5000/health` and `http://localhost:5000/ready`.
5. Put the app behind a TLS-terminating reverse proxy. If the proxy is trusted and is exactly one hop away, set `TRUST_PROXY=true`; do not enable this blindly.

The Compose file provides a persistent MongoDB volume but does not configure public TLS, SMTP, backups, or external monitoring. Configure those for your deployment. The default production cookie configuration assumes HTTPS. If frontend and API are on different sites, review SameSite and CSRF configuration before launch.

## CI checks

The GitHub Actions workflow installs locked dependencies, runs backend unit tests, and builds the Vite frontend for pushes and pull requests.

## Production checklist

- Rotate `JWT_SECRET` to a unique secret stored in the hosting provider's secret manager.
- Restrict MongoDB network access and create tested backups with retention.
- Use HTTPS and configure `CLIENT_URL` to the exact browser origin.
- Review CORS, cookie SameSite, proxy trust, and CSRF behavior for the real topology.
- Configure email delivery before enabling password reset or notification email flows.
- Run dependency audits and an independent security review before handling production assets.
- Only monitor domains you own or are authorized to assess. SecureTrack performs passive posture checks, not a comprehensive vulnerability assessment.
