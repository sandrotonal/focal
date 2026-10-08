# Production Environment Rules

Never assume localhost configurations or development server behaviors represent production.

## Configuration & Network Boundaries
Validate across environments:
- environment variables (`.env.production`, secrets manager)
- production API base URLs and gateway endpoints
- production database connections and connection pooling
- authentication provider production credentials (OAuth callbacks, Apple Sign-In IDs)
- CORS headers and allowed origin whitelists
- Secure, SameSite, and HTTP-only cookie policies
- HTTPS enforcement and SSL/TLS configuration
- canonical domain redirects and deep link URL schemes
- cloud storage buckets, CDN distribution, and asset URLs
- cache-control headers and stale-while-revalidate policies
- API rate limits and Web Application Firewall (WAF) rules
- structured logging, APM telemetry, and crash reporting (Sentry)

---

## Environment Separation
Maintain strict isolation between tiers:
- development
- staging / preview
- production

Rules:
- Never use production credentials, database instances, or payment gateways for local development.
- Staging must replicate production architecture as closely as possible.
- Database migrations must be tested and validated against staging data prior to production application.

---

## Production Build Verification
Always build and test the actual production release artifacts.

Do not consider development server (Metro dev mode, Vite dev server, webpack dev) behavior sufficient.

Verification targets:
- Web: production bundle built (`npm run build`), tested in clean incognito browser.
- Mobile: release build (`eas build`, `npx expo run:ios --configuration Release`, `assembleRelease`) tested on real hardware.
- Desktop: packaged installer tested on target operating systems.
