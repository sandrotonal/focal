# Failure Handling & Network Resilience Rules

Assume any external system, network connection, or remote service will inevitably fail.

## Network Failure Scenarios
The application must gracefully recover from:
- total internet disconnect (airplane mode, tunnel)
- high latency and slow connection (2G/3G conditions)
- socket and HTTP timeouts
- HTTP 400 Bad Request
- HTTP 401 Unauthorized / Token Expired
- HTTP 403 Forbidden / Insufficient Permissions
- HTTP 404 Not Found
- HTTP 409 Conflict / Version Mismatch
- HTTP 429 Too Many Requests (Rate Limited)
- HTTP 500, 502, 503, 504 Gateway & Server Outages
- malformed, truncated, or unexpected JSON payloads
- downstream third-party service degradation

---

## State Machine Representation
Every asynchronous or remote operation must explicitly define and render:
1. `idle`: initial state prior to user or system trigger.
2. `loading`: responsive indicator without blocking unrelated interactions.
3. `success`: clean presentation of resolved data or state.
4. `empty`: helpful, actionable guidance when data returns empty.
5. `error`: user-friendly explanation of what occurred (never raw stack traces).
6. `retry`: prominent, single-tap recovery action.

Never leave users stranded with infinite loading spinners or frozen touch states.

---

## Retries & Circuit Breaking
Retries must be deliberate and controlled:
- bounded retry limit (maximum 2 to 3 automated attempts)
- exponential backoff with randomized jitter to prevent thundering herd
- respect HTTP `Retry-After` headers on 429 and 503 responses
- provide a clear manual retry trigger to the user for failed network actions
