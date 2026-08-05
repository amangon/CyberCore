# SentinelX AI — Complete Data-Flow Audit Plan

## Root Causes Found

### 1. ScanResult Type (`security.ts`)
- **CORRUPTED**: `ScanRequest` interface has a broken `export interface ScanResult` nested inside it, plus a duplicate standalone `ScanResult` below it.
- Missing fields: `asn`, `organization`, `connectionType`, `abuseScore` exist in only one of the two definitions.

### 2. scan.service.ts — `mapScanResult()`
- **CRITICAL**: `scanFile()`, `scanURL()`, `scanIP()`, `scanHash()` NEVER call `mapScanResult()` — they return raw backend JSON directly.
- `mapScanResult()` reads `rawBackend.threatLevel` after `body` is created (should be `body.riskLevel`).
- Does NOT extract: `asn`, `organization`, `connectionType`, `abuseScore`.
- `status` incorrectly uses `body.riskLevel` instead of `body.riskLevel` (uses `statusRaw` which checks `body.status ?? body.riskLevel`).
- `mapScanHistory` has a bug: `riskScore ?? risk` references undefined variables.

### 3. Scanner Components (IPScanner, URLScanner, HashScanner, FileScanner)
- Each has a **duplicate local `mapBackendResult`** that re-implements extraction from `raw.sources` — this is inconsistent with `scan.service.ts`.
- Components read from `raw.sources` directly instead of relying on the mapped `ScanResult` fields.
- `HashScanner.tsx` references `res.detection`, `res.threatName`, `res.detectionCount` — fields that don't exist in `ScanResult`.
- `FileScanner.tsx` reads `result.detectionEngines`, `result.detectionStatus`, `result.threatFamily` — some may be empty because `mapScanResult` is never called.

### 4. Scan History not persisting
- `scanController.js` uses **in-memory `scanCache` Map** — never writes to MongoDB `ScanRecord` model.
- `ScanRecord.js` model exists but is **unused**.
- On server restart, all history is lost.

### 5. Dashboard Widgets
- Most widgets use `getDashboard()` correctly.
- Backend `dashboardController.js` returns real data from MongoDB.
- `SecurityScoreCard` and `ThreatLevelCard` display correctly.
- `ThreatFeed` and `ThreatChart` show data from dashboard.
- **Issue**: The dashboard controller's `threatFeed` and `threatChart` arrays are not populated — they need to be built from threat data.

### 6. Threat Intelligence all zeros
- `threatController.js` `getThreatIntelligence` returns hardcoded empty arrays: `malware: []`, `cves: []`, `trend: []`, `aptGroups: []`, `blockedThreats: 0`.
- Frontend `threat.service.ts` maps these empty arrays → zeros displayed.
- No CVEs, malware families, or APT groups are being persisted or computed.

### 7. Loading States
- `IPScanner.tsx` and `URLScanner.tsx` both have `finally { setLoading(false) }` — correct.
- `HashScanner.tsx` has `finally { setLoading(false) }` — correct.
- `FileScanner.tsx` has `finally { setScanning(false) }` — correct.

## Files to Modify

### Frontend:
1. `src/types/security.ts` — Fix corrupted ScanResult, add missing fields
2. `src/services/scan.service.ts` — Fix `mapScanResult()`, call it from scan functions, fix `mapScanHistory`
3. `src/components/scan/IPScanner.tsx` — Simplify mapper, use ScanResult fields directly
4. `src/components/scan/URLScanner.tsx` — Simplify mapper, use ScanResult fields directly
5. `src/components/scan/HashScanner.tsx` — Fix mapper to use correct fields
6. `src/components/scan/FileScanner.tsx` — Fix display logic
7. `src/app/alerts/[ID]/page.tsx` — Already fixed (dynamic data, loading/error states)

### Backend:
8. `backend/controllers/scanController.js` — Add MongoDB persistence for scan records
9. `backend/controllers/threatController.js` — Populate empty arrays with real data
10. `backend/controllers/dashboardController.js` — Build threatFeed and threatChart from real data

## Step-by-Step Implementation
