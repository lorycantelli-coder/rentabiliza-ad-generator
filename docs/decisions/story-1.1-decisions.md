# Story 1.1 — Decision Log

**Story:** Backend Stability
**Date:** 2026-03-07
**Agent:** Claude Code (YOLO mode)

---

## Decision 1: Logging Library

**Question:** Winston vs Pino vs custom logger?

**Decision:** **Winston** (industry standard, easy configuration)
- ✅ Well-maintained
- ✅ Multiple transports (file, console)
- ✅ Structured logging (JSON)
- ✅ Works well with Express

**Action:** Add `winston` to package.json

---

## Decision 2: Retry Strategy

**Question:** Manual retry vs library (retry, async-retry)?

**Decision:** **Manual with exponential backoff**
- Keep it simple, no extra dependencies
- 3 retries max
- Backoff: 1s → 2s → 4s
- Only retry on network errors, not on 4xx

**Action:** Implement `withRetry()` helper function

---

## Decision 3: Timeout Handling

**Question:** Timeout value for Claude API?

**Decision:** **30 seconds** (Anthropic max is ~25s, so 30s safe)
- Falls back to cached response if available
- Otherwise: error response to user

**Action:** Add timeout parameter to client config

---

## Decision 4: Health Check Endpoint

**Question:** What to check?

**Decision:** **Return agent status**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-07T12:00:00Z",
  "agents": {
    "halbert": "ready",
    "wiebe": "ready",
    "bencivenga": "ready"
  },
  "apiKey": "loaded" | "missing"
}
```

**Action:** Implement `GET /health` endpoint

---

## Decision 5: Testing Framework

**Question:** Jest vs Vitest vs Mocha?

**Decision:** **Jest** (all-in-one, easy setup)
- ✅ Works with Node.js projects
- ✅ Built-in mocking
- ✅ Easy CLI

**Action:** Add Jest to package.json, create `src/backend.test.js`

---

## Decision 6: Error Response Structure

**Question:** How to structure error responses?

**Decision:** **Consistent error object**
```json
{
  "success": false,
  "error": {
    "code": "TIMEOUT_ERROR",
    "message": "Request timed out after 30s",
    "details": "..."
  }
}
```

**Action:** Create `formatErrorResponse()` helper

---

## Decision 7: API Key Management

**Question:** Read from .env or environment variable?

**Decision:** **Environment variable from .env.local**
- Use `process.env.ANTHROPIC_API_KEY`
- Fallback warning if not set
- Never log the key

**Action:** Update `.env.local` template and backend.js

---

## Implementation Checklist

- [ ] Install winston
- [ ] Install jest
- [ ] Implement logger setup
- [ ] Implement withRetry helper
- [ ] Update generateAgentCopy() with retry + timeout
- [ ] Implement /health endpoint
- [ ] Create formatErrorResponse()
- [ ] Update /api/generate-copy to use error formatter
- [ ] Write unit tests
- [ ] Update .env.local
- [ ] Test all error paths
- [ ] Update README

---

## Known Risks

1. **API rate limits:** Not handled yet (Story 1.3)
2. **Caching:** No caching of responses (future optimization)
3. **Agent failures:** If all 3 agents fail, user gets error (acceptable for MVP)
