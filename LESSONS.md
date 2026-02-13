# Lessons Learned - Mavin Project

## Mistakes Made and How to Avoid Them

This document captures mistakes made during development and solutions to prevent them in future projects.

---

## 1. Port Conflict Hell

### ❌ Mistake:
Started multiple backend instances without checking if port was already in use, causing:
- `EADDRINUSE: address already in use :::8002`
- Services failing silently
- Confusion about which instance is actually running

### ✅ Solution:
**Always kill existing processes before starting:**
```bash
# Before starting backend
lsof -ti:8002 | xargs kill -9 2>/dev/null
pnpm dev

# Or use a start script
#!/bin/bash
lsof -ti:8002 | xargs kill -9 2>/dev/null
pnpm dev > /tmp/backend.log 2>&1 &
echo "Backend started on port 8002"
```

### 📋 Prevention Checklist:
- [ ] Check port before starting: `lsof -ti:PORT`
- [ ] Use unique ports for each service
- [ ] Create cleanup script: `scripts/stop-all.sh`
- [ ] Use process managers (PM2, Docker Compose) in production

---

## 2. .env File Overrides Ignored

### ❌ Mistake:
Changed `config.ts` default values but forgot that `.env` file overrides them:
```typescript
// config.ts - Changed this
corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3003'

// .env - But this was still old value!
CORS_ORIGIN=http://localhost:3000  ❌
```

### ✅ Solution:
**Always check .env file first when config doesn't match expectations:**
```bash
# Check what's in .env
cat backend/.env | grep CORS_ORIGIN

# Update .env, not just config.ts
echo "CORS_ORIGIN=http://localhost:3003" >> backend/.env
```

### 📋 Prevention Checklist:
- [ ] Document .env variables in .env.example
- [ ] Log loaded config on startup: `logger.info('CORS origin:', config.corsOrigin)`
- [ ] Use config validation to catch mismatches
- [ ] Add .env to .gitignore (don't commit secrets)

---

## 3. Wrong API Endpoint Path

### ❌ Mistake:
Frontend called `/chat` but backend route was `/chat/chat`:
```typescript
// Frontend apiClient
fetch(`${baseUrl}/chat`)  ❌

// Backend route
router.post('/chat', ...)  // Mounted at /api/chat
// Actual path: /api/chat/chat  ✓
```

### ✅ Solution:
**Test API endpoints with curl BEFORE connecting frontend:**
```bash
# Test the actual endpoint
curl -X POST http://localhost:8002/api/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# If 404, the path is wrong
```

### 📋 Prevention Checklist:
- [ ] Document all routes in API documentation
- [ ] Test each route with curl after creation
- [ ] Use route testing in unit tests
- [ ] Consider using OpenAPI/Swagger for route contracts

---

## 4. CORS Configuration Mismatch

### ❌ Mistake:
Backend CORS allowed `http://localhost:3000` but frontend ran on `http://localhost:3003`:
```
Access-Control-Allow-Origin: http://localhost:3000  ❌
Origin: http://localhost:3003                        ← Frontend
```

### ✅ Solution:
**Test CORS with curl before running frontend:**
```bash
# Test CORS preflight
curl -v http://localhost:8002/api/endpoint \
  -H "Origin: http://localhost:3003" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS

# Should return:
# Access-Control-Allow-Origin: http://localhost:3003 ✓
```

### 📋 Prevention Checklist:
- [ ] Match CORS origin to actual frontend port
- [ ] Test CORS before connecting frontend
- [ ] Log CORS origin on backend startup
- [ ] Use wildcards in dev: `*` (but never in production!)

---

## 5. Not Hard Refreshing Browser

### ❌ Mistake:
Changed code but browser kept using cached version:
- Updated `api-client.ts`
- Browser still called old endpoint
- Wasted 30 minutes debugging "why isn't my fix working?"

### ✅ Solution:
**Always hard refresh after code changes:**
```
Windows/Linux: Ctrl + Shift + R
Mac:          Cmd + Shift + R
```

Or disable cache while DevTools is open:
1. Open DevTools (F12)
2. Network tab → "Disable cache" ✓

### 📋 Prevention Checklist:
- [ ] Hard refresh after every code change
- [ ] Disable cache in DevTools during development
- [ ] Add cache-busting to Vite config if needed
- [ ] Clear localStorage when testing state changes

---

## 6. Insufficient Error Logging

### ❌ Mistake:
Generic error message gave no clue what failed:
```typescript
catch (error) {
  console.error("Chat failed:", error);  // Not enough info!
  setError("Sorry, I encountered an error");  // User sees this ❌
}
```

### ✅ Solution:
**Log detailed error information:**
```typescript
catch (error) {
  console.error("Chat failed:", error);
  console.error("Error details:", {
    message: error.message,
    stack: error.stack,
    request: { message, conversationId }
  });

  // Show specific error to user
  setError(`Error: ${error.message}. Check console.`);
}
```

### 📋 Prevention Checklist:
- [ ] Log request params on error
- [ ] Log full error object (message + stack)
- [ ] Include context (what was being attempted)
- [ ] Show meaningful errors to users in development

---

## 7. Multiple Running Instances Confusion

### ❌ Mistake:
Started backend multiple times, didn't realize old instances were still running:
- Killed one instance but others kept running
- Config changes didn't apply (old instance still active)
- "Why is it still using old CORS??"

### ✅ Solution:
**Kill ALL instances, not just the last one:**
```bash
# Kill all tsx processes
pkill -9 -f "tsx.*backend"

# Kill by port
lsof -ti:8002 | xargs kill -9

# Verify nothing is running
ps aux | grep tsx | grep backend
```

### 📋 Prevention Checklist:
- [ ] Create `stop-all.sh` script
- [ ] Check running processes: `ps aux | grep tsx`
- [ ] Use single terminal window per service
- [ ] Consider using PM2 or Docker for process management

---

## 8. Forgot to Test Backend Independently

### ❌ Mistake:
Jumped straight to testing in browser, couldn't tell if backend or frontend was broken:
- Browser showed error
- Was it CORS? Bad request? Backend down?
- Wasted time debugging wrong layer

### ✅ Solution:
**Always test backend with curl FIRST:**
```bash
# 1. Test health
curl http://localhost:8002/health

# 2. Test endpoint
curl -X POST http://localhost:8002/api/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","conversationId":"curl-test"}'

# 3. THEN connect frontend
```

### 📋 Prevention Checklist:
- [ ] Test backend routes with curl before UI integration
- [ ] Write unit tests for backend first
- [ ] Isolate layers - test each independently
- [ ] Keep curl commands in a test.sh script

---

## 9. Assumed Code Changes Auto-Reload

### ❌ Mistake:
Changed backend config but didn't restart server:
- Updated `.env` file
- Server still using old values (already loaded on startup)
- "Why isn't my CORS fix working??"

### ✅ Solution:
**Restart server after config changes:**
```bash
# .env changes require restart
# Config file changes usually auto-reload (with tsx watch)

# Always verify config loaded correctly:
tail -f /tmp/backend.log | grep CORS
```

### 📋 Prevention Checklist:
- [ ] Restart after .env changes (always)
- [ ] Use `tsx watch` for auto-reload on code changes
- [ ] Log config values on startup to verify
- [ ] Add startup banner showing key config values

---

## 10. Didn't Check Browser Console First

### ❌ Mistake:
User said "it doesn't work" but I didn't check browser console:
- Spent time checking backend logs
- Checked API with curl (worked fine)
- Finally checked console → CORS error immediately visible!

### ✅ Solution:
**ALWAYS check browser console FIRST for frontend issues:**
```
F12 → Console tab

Look for:
- CORS errors (red text)
- Network errors (Failed to fetch)
- JavaScript errors (stack traces)
```

### 📋 Prevention Checklist:
- [ ] Open DevTools before testing
- [ ] Check Console tab for errors
- [ ] Check Network tab for failed requests
- [ ] Look at request/response headers in Network tab

---

## 11. Hardcoded URLs Instead of Environment Variables

### ❌ Mistake:
Hardcoded API URL in frontend:
```typescript
const apiClient = new ApiClient('http://localhost:8002/api')  ❌
```
When port changed, had to update code everywhere!

### ✅ Solution:
**Use environment variables:**
```typescript
const apiClient = new ApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:8002/api',
  false
)
```

```bash
# .env
VITE_API_URL=http://localhost:8002/api
```

### 📋 Prevention Checklist:
- [ ] Use env vars for all URLs, ports, API keys
- [ ] Prefix with VITE_ for Vite to expose them
- [ ] Never commit real API keys (use .env.example)
- [ ] Document all env vars in README

---

## 12. No Validation on API Requests

### ❌ Mistake:
Backend accepted invalid requests:
```typescript
router.post('/chat', (req, res) => {
  const { message } = req.body;
  // What if message is undefined? Empty? null?
  const response = await service.chat(message);  ❌
})
```

### ✅ Solution:
**Validate all inputs:**
```typescript
router.post('/chat', (req, res) => {
  const { message, conversationId } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Now safe to process
  const response = await service.chat(message, conversationId);
})
```

### 📋 Prevention Checklist:
- [ ] Validate required fields
- [ ] Check data types (string, number, etc.)
- [ ] Sanitize user input (prevent injection)
- [ ] Return proper HTTP status codes (400, 401, 500)

---

## Best Practices Summary

### When Starting Development:
1. ✅ Kill existing processes first
2. ✅ Check .env file matches config
3. ✅ Test backend with curl before UI
4. ✅ Verify CORS configuration
5. ✅ Check browser console for errors

### When Making Changes:
1. ✅ Restart server after .env changes
2. ✅ Hard refresh browser after code changes
3. ✅ Test changed endpoint with curl
4. ✅ Check logs for errors
5. ✅ Verify changes actually applied

### When Debugging:
1. ✅ Check browser console FIRST
2. ✅ Test backend independently (curl)
3. ✅ Check CORS headers (curl -v)
4. ✅ Verify services are running (health check)
5. ✅ Check for multiple running instances
6. ✅ Read error messages carefully (they usually tell you exactly what's wrong!)

---

## Common Error Messages & Solutions

### "EADDRINUSE: address already in use"
```bash
lsof -ti:PORT | xargs kill -9
```

### "CORS policy: ... not equal to supplied origin"
```bash
# Check .env file
cat backend/.env | grep CORS_ORIGIN
# Update to match frontend port
```

### "Failed to fetch"
```bash
# Check backend is running
curl http://localhost:8002/health
# Check CORS
curl -v ... -H "Origin: ..." -X OPTIONS
```

### "404 Not Found"
```bash
# Wrong endpoint path
# Check actual route: grep "router.post" backend/src/routes/*.ts
```

### Changes not appearing
```
# Hard refresh: Ctrl + Shift + R
# Or restart server (for .env changes)
```

---

## Development Workflow Checklist

### Morning Startup:
```bash
# 1. Kill any zombies from yesterday
pkill -f "tsx.*backend"
pkill -f "pnpm.*dev"

# 2. Start backend
cd backend && pnpm dev > /tmp/backend.log 2>&1 &

# 3. Start frontend
cd apps/web && pnpm dev

# 4. Verify both running
curl http://localhost:8002/health
curl http://localhost:3003
```

### After Code Changes:
```bash
# Backend code changes: Auto-reload (tsx watch)
# .env changes: Restart backend
# Frontend changes: Auto-reload (Vite HMR)
# Shared package changes: Hard refresh browser
```

### Before Committing:
```bash
# Run tests
pnpm test

# Verify services work
curl -X POST http://localhost:8002/api/chat/chat \
  -d '{"message":"test"}'

# Check no secrets in code
grep -r "API_KEY.*=" backend/src/
```

---

*Last Updated: 2026-02-13*
*Lessons from: Mavin Project - OpenClaw Integration*
*Remember: Every mistake is a lesson. Document it, learn from it, never repeat it!*
