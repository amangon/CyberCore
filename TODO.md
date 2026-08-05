# SentinelX AI — Render Production Deployment Fix

## Steps

- [x] Explore repo & identify all localhost/production references
- [ ] 1. Fix `sentinelx-ai-frontend-new/src/lib/api.ts` — default API base URL → Render backend
- [ ] 2. Fix `sentinelx-ai-frontend-new/src/services/settings.service.ts` — webhookEndpoint uses centralized API_BASE_URL
- [ ] 3. Fix `backend/server.js` — CORS from CLIENT_URL env (allow Render frontend; localhost only in dev)
- [ ] 4. Fix `backend/sockets/index.js` — Socket.io CORS from CLIENT_URL env
- [ ] 5. Fix `backend/config/swagger.js` — Swagger server URL → Render backend fallback
- [ ] 6. Fix `backend/controllers/authController.js` — reset URL fallback → Render frontend
- [ ] 7. Update `backend/.env.example` — document CLIENT_URL production default
- [ ] 8. Add `sentinelx-ai-frontend-new/.env.local.example` — document NEXT_PUBLIC_API_BASE_URL
- [ ] 9. Verify no production localhost references remain (grep)
- [ ] 10. Run frontend production build
