# Backend Integration Plan — SentinelX AI Frontend

## Status: Connecting frontend to backend at `http://localhost:5001/api`

## Modules (in order)
| Module | Service | Status |
|---|---|---|
| Core lib | `src/lib/api.ts`, `src/lib/auth.ts` | ✅ done |
| Auth | `src/types/auth.ts`, `auth.service.ts`, `useAuth.ts`, LoginForm, register page, Topbar | ✅ done |
| Dashboard | `dashboard.service.ts`, dashboard components, `/dashboard` | ✅ done |
| Scanner | `scan.service.ts`, `useScan.ts`, scanners, ScanHistory/Result, `/scan` | ✅ done |
| Threats | `threat.service.ts`, `types/threat.ts`, threat components, `/threats` | ✅ done |
| IOC | `ioc.service.ts`, `store/index.ts`, IOC components, `/ioc` | ✅ done |
| Assets | `assets.service.ts`, `/assets` page | ✅ done |
| Alerts | alerts service + page + components | ⏳ in progress |
| Incidents | incidents service + page + components | ⬜ pending |
| Reports | reports service + page + components | ⬜ pending |
| Integrations | integration.service (real) + components | ⬜ pending |
| Settings | settings.service (real) + components | ⬜ pending |
| Cross-cutting | socket.io client, notifications, search, AI assistant | ⬜ pending |

## Rules
- One file at a time, await "NEXT" after each file.
- Preserve UI exactly; swap only mock data for real API responses.
- Strict TypeScript; handle loading/error/empty/retry states.
- Do NOT modify the backend.

## Verification
- [ ] `npx tsc --noEmit` clean per module
- [ ] `npm run build` passes
- [ ] Navigation against backend on localhost:5001

---

# Navigation Fix Plan — SentinelX AI Frontend (historical)

## Route Map (Final — all routes verified working)
| Item | Route | Status |
|---|---|---|
| Home | `/` | ✅ exists |
| Features | `/#features` | ✅ anchor added on Features section |
| Threat Intelligence | `/threats` | ✅ exists |
| Scanner | `/scan` | ✅ exists |
| Integrations | `/integrations` | ✅ exists |
| Pricing | `/pricing` | ✅ page created |
| Login | `/login` | ✅ exists |
| Register | `/register` | ✅ exists |
| Dashboard | `/dashboard` | ✅ built with DashboardLayout + cards |
| Assets | `/assets` | ✅ exists |
| Alerts | `/alerts` | ✅ exists |
| Incidents | `/incidents` | ✅ page created (+ `/incidents/[id]`) |
| Reports | `/reports` | ✅ exists |
| IOC Investigation | `/ioc` | ✅ exists |
| Settings | `/settings` | ✅ exists |
| Notifications | `/notifications` | ✅ page created |
| Assistant | `/assistant` | ✅ page created |
| Search | `/search` | ✅ page created |
| Profile | `/settings/profile` | ✅ exists |
| Security | `/settings/security` | ✅ exists |
| Team | `/settings/team` | ✅ exists |
| Organization | `/settings/organization` | ✅ exists |
| Theme | `/settings/theme` | ✅ exists |
| API | `/settings/api` | ✅ exists |
| Billing | `/settings/billing` | ✅ exists |

## Rules
- Use Next.js App Router (`next/link` + `next/navigation`).
- Every page exists — no placeholder "Coming Soon" routes remain.
- Remove sidebar items with no page (Vulnerabilities, Users).
- Preserve existing UI design.
- Fix active navigation highlighting.

## Files Fixed
### Nav components
- [x] `components/landing/Navbar.tsx` — real routes, `Link`, active highlighting via `usePathname`, added Register button (desktop + mobile)
- [x] `components/layout/Sidebar.tsx` — fixed routes, removed Vulnerabilities/Users, Incidents now enabled (page exists), active-state logic
- [x] `components/layout/Topbar.tsx` — search → `/search`, notifications → `/notifications`, profile menu → `/settings/profile`, `/settings`, `/login`
- [x] `components/landing/Footer.tsx` — all `href="#"` placeholders → real routes, Contact → `/pricing`

### Landing pages
- [x] `components/landing/CTA.tsx` — `href="#"`/`href="#dashboard"` → `/dashboard`
- [x] `components/landing/Features.tsx` — added `id="features"`
- [x] `components/landing/Pricing.tsx` — created section component
- [x] `components/landing/IntegrationsSection.tsx` — "View Details" → `/integrations`

### New pages created
- [x] `app/pricing/page.tsx`
- [x] `app/incidents/page.tsx`
- [x] `app/incidents/[id]/page.tsx`
- [x] `app/notifications/page.tsx`
- [x] `app/assistant/page.tsx`
- [x] `app/search/page.tsx`
- [x] `app/dashboard/page.tsx` — rebuilt with DashboardLayout + existing dashboard cards

### Dashboard cards
- [x] `components/dashboard/RecentAlerts.tsx` → `/alerts`
- [x] `components/dashboard/RecentScans.tsx` → `/scan`
- [x] `components/dashboard/IncidentCard.tsx` → `/incidents` (was "Soon")
- [x] `components/dashboard/AssetOverviewCard.tsx` → `/assets`

### Settings & misc
- [x] `components/settings/SettingsSidebar.tsx` — Organization link
- [x] `components/settings/QuickActions.tsx` — `Link`, removed `#` fallback
- [x] `app/alerts/[ID]/page.tsx` — breadcrumb → `/alerts`

### Build blockers resolved
- [x] Empty `/reports` page → self-contained functional page
- [x] Missing `ApiKey`/`ApiSettings`/`ConnectedService` types + `getApiSettings()` service method
- [x] recharts v3 `activeIndex` incompatibility in `AlertDistribution.tsx`
- [x] framer-motion `Variants` type errors in `ThreatFeed.tsx`

## Verification
- [x] `npm run build` passes ✓ (TypeScript clean, all 28 routes generated)
- [x] No `href="#"` / `href=""` / empty links remain
- [x] No broken internal routes referenced
- [x] Every nav item resolves to an existing page

