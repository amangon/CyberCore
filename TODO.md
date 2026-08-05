# Enterprise SOC Platform Fix — TODO

## A. Remove fabricated data in threat components
- [x] MalwareIntelligence.tsx — remove fake activeCampaigns/status, derive risk from detectionCount, stable rowKey (id)
- [x] APTGroups.tsx — remove fake activeCampaigns/techniques fallback, stable rowKey (id)
- [x] CVEList.tsx — remove fabricated EPSS/affected fallback, use backend status, stable rowKey (id)
- [x] DNSRecords.tsx — remove fabricated riskScore/reputation/threatStatus/source/ttl/details, composite rowKey (type+value+index)

## B. Wire Reports page to backend
- [x] Create backend Report model (backend/models/Report.js)
- [x] Create backend reportController.js
- [x] Create backend routes/reports.js + register in server.js
- [x] Create frontend report.service.ts
- [x] Rewrite reports/page.tsx to use live backend data
- [x] Wire ReportStats/ReportCard to backend
- [x] Working New/Export/Delete/Archive buttons

## C. Consistency
- [x] Ensure StatCard values come from real data
- [x] Remove remaining mock imports in reports module (reports/page.tsx now uses report.service.ts)

## D. QA
- [x] npx tsc --noEmit (passes)
- [x] npx eslint on modified files (passes, 0 errors)
- [x] npm run build (passes)

## E. Hash / IP / URL analysis pipeline audit + scoring fix
- [x] Backend: evidence-based risk scoring (buildDetectionSummary) — 0 detections → Safe 0%
- [x] Backend: getRiskLevel thresholds (Safe ≤0, Low ≤40, Medium ≤60, High ≤80, Critical >80)
- [x] Backend: log RAW provider responses ([SCAN-AUDIT]) for audit trail
- [x] Backend: providerRunner.js — independent timeouts/retries/normalization for all providers
- [x] Backend: scanHash/scanIP/scanURL/scanDomain/scanFile use runProviders + normalizeSource (spreads raw payload)
- [x] Backend: response includes status/threatLevel/detectionStatus/detectionEngines/detectionCount/threatFamily/blacklistStatus/reputation/aiVerdict (single source of truth)

## F. Frontend mapping + provider cards
- [x] scan.service.ts mapScanResult: backend is single source of truth; maps all IP fields (city, usageType, domain, hostnames, totalReports, positiveReports, lastReported); ASN/Org priority Shodan→AbuseIPDB→IPInfo→OTX
- [x] scan.service.ts builds providers[] from sources (excludes fileInfo)
- [x] types/security.ts: ProviderStatus interface + providers on ScanResult
- [x] ProviderCard.tsx created (presentational, render-only backend values)
- [x] ResultCard.tsx: Provider Status section + layout fixes (min-w-0, break-all, overflow-hidden, items-stretch, equal heights)
- [x] File/Hash/IP/URL scanners pass providers + export lib

## G. Layout overflow + export + run-new-scan
- [x] ResultCard InfoChip / ScanResult Detail / IOCResult Detail+Meta: min-w-0, break-words, truncate, overflow-hidden
- [x] exportReport.ts (JSON/CSV/PDF) with Target, Scan Type, Risk Score, Threat Level, Detection Status, Threat Family, Detection Engines, Blacklist Status, Country, ASN, Organization, ISP, Abuse Score, Reports, Analysis Time, AI Verdict
- [x] Export Report wired in all scanners (JSON+CSV+PDF)
- [x] Run New Scan resets state, clears cards/progress, focuses input (all scanners)

## H. QA
- [x] tsc --noEmit (EXIT:0)
- [x] npm run build (EXIT:0)
- [x] eslint scan components (0 errors)
