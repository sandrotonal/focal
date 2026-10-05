---
name: error-handling
description: Robust asynchronous error handling, network failure recovery, state machine completeness, and resilient exception patterns.
---

# Error Handling & Resilience Skill

## Goal
Enforce robust exception handling, complete state machine representation, and resilient failure recovery across all asynchronous operations.

---

## Asynchronous Safety Contract

Every asynchronous call (network request, file access, storage read/write, audio/native bridge) must satisfy:
1. Enclosed in `try-catch` blocks.
2. Unhandled Promise rejections are strictly prevented.
3. Catch blocks must never be empty (`catch (e) {}` is prohibited).
4. Errors must be logged to telemetry/console with contextual tags.
5. User-facing state must transition to an informative error state with a recovery action.

---

## 6-State Asynchronous Lifecycle

Never jump directly from `loading` to `success` without handling edge states:

```
[IDLE] ─── User Trigger ───► [LOADING]
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
    [SUCCESS]                [EMPTY]                 [ERROR]
        │                       │                       │
        └───────────────────────┴─────────── Retry ─────┘
```

1. **Idle:** Pristine baseline before execution.
2. **Loading:** Non-blocking feedback indicator (progress bar, skeleton).
3. **Success:** Resolved data rendered according to design hierarchy.
4. **Empty:** Friendly illustration/copy with clear guidance.
5. **Error:** Human-readable message explaining what went wrong.
6. **Retry:** Single-tap trigger to re-attempt the failed operation with exponential backoff.

---

## Controlled Retries Pattern

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 400
): Promise<T> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) throw error;
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry exhausted');
}
```
