# SentinelX AI — Complete End-to-End Data-Flow Audit Plan

## Part 1: ScanResult Interface (types/security.ts)
- Fix corrupted `ScanRequest` interface (has `{ export interface ScanResult` nested inside it)
- Add missing fields: `asn`, `organization`, `connectionType`, `abuseScore`, `ipAddress`, `server`, `hostingCountry`, `category`, `sslInfo`, `domainReputation`, `detectionCount`
- Remove duplicate `ScanResult` interface

## Part 2: scan.service.ts — mapScanResult Fix
- Replace `rawBackend.xxx` with `body.xxx` for all reads
- Extract nested fields from body.sources with correct fallbacks:
  - Country: shodan.country → abuseipdb.countryName → otx.country → ipinfo.country
  - ISP: shodan.isp → abuseipdb.isp → ipinfo.org
  - ASN: shodan.asn → otx.asn → ipinfo.asn
  - Organization: shodan.org → ipinfo.org
  - Connection Type: abuseipdb.usageType
  - Abuse Score: abuseipdb.abuseConfidenceScore
  - Last Analysis: shodan.lastUpdate → abuseipdb.lastReportedAt → body.scannedAt
  - Threat Level: body.riskLevel
  - Risk Score: body.overallThreatScore
- Return every field, nothing omitted

## Part 3: Scanner Components Fix
- IPScanner.tsx ✅ Already uses ResultCard
- URLScanner.tsx ✅ Already uses ResultCard  
- HashScanner.tsx: Replace local mapping with ResultCard
- FileScanner.tsx: Replace local mapping with ResultCard
- Remove unused Stat/Detail components from all

## Part 4: Loading State
- Ensure `setLoading(false)` in finally blocks of all scanners

## Part 5: Scan History — MongoDB Persistence
- Backend uses in-memory cache (scanCache Map) — need to add MongoDB ScanRecord persistence
- Add `scanController.js` MongoDB save after scan completes
- The `getScanHistory` endpoint reads from cache, need to read from MongoDB

## Part 6: Dashboard — Real Data
- Dashboard controller already returns real data from MongoDB ✓
- Need to ensure dashboard widgets read backend values only

## Part 7: Threat Intelligence — Real Data
- threatController.js returns empty arrays for malware, cves, trend, aptGroups
- Need to query MongoDB collections for real data

## Part 8: Remove Placeholder Logic
- Replace "Unknown", "No Threat Detected", "Clean", "0%", "Not Listed" with "N/A" 
- Only show backend-provided values

## Part 9: Debug Logs
- Add console.log at key points temporarily
- Remove after fixes confirmed

## Part 10: Profile Photo Upload
- Add `updateAvatar` to authController.js
- Add `PUT /api/auth/avatar` route with multer
- Fix frontend settings service to call real API instead of mock
