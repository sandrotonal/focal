# Security Rules

Security verification is mandatory before any release or production deployment.

## Secrets and Credential Isolation
Never expose in client code, bundles, or version control:
- API secrets and private tokens
- private cryptographic keys and certificates
- database connection strings and passwords
- service account JSON keys
- third-party backend admin keys

Never commit secrets to Git repository branches. Use environment variables and secrets managers.

---

## Authentication Security
Verify:
- secure password storage (Argon2, bcrypt) and hashing
- session expiration and idle timeouts
- short-lived access tokens and secure HTTP-only refresh tokens
- complete server-side session revocation on sign-out
- protection against brute-force attacks and credential stuffing
- protection against account enumeration across login, signup, and reset forms

---

## Authorization Enforcement
Never rely exclusively on client-side state or UI hiding for access control.

Every sensitive backend operation, database query, and API route must verify authorization server-side:
- enforce Row Level Security (RLS) on database tables
- validate user claims and tenant IDs on every write/read request
- prevent Insecure Direct Object References (IDOR)

---

## Input Validation & Sanitization
All untrusted input must be strictly validated and sanitized server-side:
- SQL injection (parameterized queries, prepared statements)
- Cross-Site Scripting (XSS sanitization, Content Security Policy)
- Command injection and prototype pollution
- Path traversal and arbitrary file reads
- Malicious file uploads (MIME type verification, size caps, virus scanning)
- Request payload size limits and body parser protection

---

## Dependencies & Supply Chain
Regularly check and audit:
- known security vulnerabilities (`npm audit`, Snyk, Dependabot)
- outdated or deprecated packages
- abandoned packages with unmaintained dependencies
- bloated third-party libraries when native platform APIs suffice
