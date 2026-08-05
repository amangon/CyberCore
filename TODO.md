# SentinelX AI — Remaining Issues Fix Plan

Status legend: `[ ]` pending · `[x]` done

## 1. Profile Picture Upload (dead Camera button)
- [x] Wire the Camera button with a hidden file input
- [x] Add image preview before upload
- [x] Call `settingsService.uploadAvatar(file)` on selection
- [x] Refresh `profile.avatarUrl` after upload (persists + shows after login)

## 2. API Key Management (dead buttons)
- [x] Wire "Create new key" button — add generate form (name/description/expiration)
- [x] Call `settingsService.generateApiKey`
- [x] Show the new key once with a Copy button
- [x] Add per-key actions: Copy, Revoke, Delete, Regenerate

## 3. Threat Intelligence Center pipeline
- [x] Backend `GET /api/threats` + `/summary` → `getThreatIntelligenceSummary`
- [x] Aggregates real ScanRecord / ThreatIntelligence / Vulnerability / IOC / Alert data
- [x] Country + coordinate extraction for the Global Threat Map
- [x] Automatic persistence after every successful scan (scanController)
- [x] Frontend `threat.service.ts` maps to `{feed, stats, malware, cves, trend, aptGroups}`

## 4. Provider Status (Scan Result page) — layout fix
- [x] Grid: 2 columns desktop/tablet, 1 column mobile (`sm:grid-cols-2`)
- [x] Card: `flex flex-col justify-between min-h-[320px] w-full min-w-0 overflow-hidden`
- [x] Padding 24px (`p-6`), rounded 20px (`rounded-[20px]`)
- [x] Provider name uses `truncate`
- [x] Reason box uses `break-words` — never overflows
- [x] Latency stays on one line (`whitespace-nowrap shrink-0`)
- [x] Health no longer overlaps (separate box, `ml-auto`)
- [x] Progress bar always at bottom (`justify-between`)
- [x] Removed fixed heights / absolute positioning / negative margins

## 5. Final QA
- [x] `npm run build` — PASS
- [x] `npm run lint` — 0 errors (pre-existing warnings only)
- [x] `npx tsc --noEmit` — PASS (exit 0)
