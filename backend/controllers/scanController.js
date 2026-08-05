const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const ScanRecord = require('../models/ScanRecord');
const IOC = require('../models/IOC');
const ThreatIntelligence = require('../models/ThreatIntelligence');
const Vulnerability = require('../models/Vulnerability');

// Import all services
const virusTotalService = require('../services/virusTotalService');
const abuseIpService = require('../services/abuseIpService');
const googleSafeBrowsingService = require('../services/googleSafeBrowsingService');
const cloudinaryService = require('../services/cloudinaryService');
const otxService = require('../services/otxService');
const shodanService = require('../services/shodanService');
const urlscanService = require('../services/urlscanService');
const nvdService = require('../services/nvdService');
const ipinfoService = require('../services/ipinfoService');
const abusechService = require('../services/abusechService');
const greyNoiseService = require('../services/greyNoiseService');
const pulsediveService = require('../services/pulsediveService');
const criminalIpService = require('../services/criminalIpService');
const { runProviders } = require('../services/providerRunner');

// In-memory request cache (5 min TTL)
const scanCache = new Map();
const CACHE_TTL = 300000;

function getCached(key) {
  const entry = scanCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  scanCache.delete(key);
  return null;
}

function setCached(key, data) {
  scanCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Detect the input type from the provided value
 */
function detectInputType(value) {
  if (!value || typeof value !== 'string') return null;

  // IP address detection (IPv4 and IPv6)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;
  if (ipv4Regex.test(value) || ipv6Regex.test(value)) return 'ip';

  // Hash detection (MD5=32, SHA1=40, SHA256=64 hex chars)
  const hashRegex = /^[0-9a-fA-F]{32,128}$/;
  if (hashRegex.test(value)) {
    const len = value.length;
    if (len === 32) return 'hash'; // MD5
    if (len === 40) return 'hash'; // SHA1
    if (len === 64) return 'hash'; // SHA256
    if (len === 128) return 'hash'; // SHA512
  }

  // Domain detection
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (domainRegex.test(value)) return 'domain';

  // URL detection
  const urlRegex = /^https?:\/\/.+/i;
  if (urlRegex.test(value)) return 'url';

  return 'unknown';
}

/**
 * Determine risk level from the final evidence-based verdict.
 * Thresholds are aligned with the rules: Safe 0-20, Low 21-40,
 * Medium 41-60, High 61-80, Critical 81-100.
 */
function getRiskLevel(score) {
  if (score <= 20) return 'Safe';
  if (score <= 40) return 'Low';
  if (score <= 60) return 'Medium';
  if (score <= 80) return 'High';
  return 'Critical';
}

/**
 * Determine whether a provider is a "malicious evidence" source.
 * Only COMPLETED providers reporting real detections count as malicious.
 * Error / timeout / forbidden / auth-failed / not-configured / no-data /
 * no-match providers are UNAVAILABLE sources — they never count as malicious
 * (and never count as clean either).
 */
function isUnavailableProvider(p) {
  if (!p) return true;
  const status = String(p.status || '').toLowerCase();
  const available = Boolean(p.available || p.success || p.scanned);
  if (!available) return true;
  if (status === 'no_match' || status === 'no data' || status === 'not found') return true;
  return false;
}

function providerIsMalicious(p) {
  if (isUnavailableProvider(p)) return false;
  const verdict = String(p.verdict || '').toLowerCase();
  if (verdict === 'malicious') return true;
  // Completed providers that report a real detection count/threat score.
  const detections = Number(p.detections) || 0;
  const score = Number(p.threatScore) || 0;
  if (detections > 0) return true;
  if (score >= 80) return true;
  return false;
}

function providerIsSuspicious(p) {
  if (isUnavailableProvider(p)) return false;
  if (providerIsMalicious(p)) return false;
  const verdict = String(p.verdict || '').toLowerCase();
  if (verdict === 'suspicious') return true;
  const score = Number(p.threatScore) || 0;
  return score >= 40 && score < 80;
}

/**
 * Build a fully evidence-based detection summary from the actual provider
 * responses. Risk is only ever derived from real detections reported by the
 * providers — never inferred and NEVER from failed/unavailable sources.
 * This is the SINGLE source of truth for every downstream field (status, risk
 * level, detection status, engines, AI verdict).
 *
 * @param {string} scanType - 'hash' | 'ip' | 'url' | 'domain' | 'file'
 * @param {Object} sources - The aggregated provider sources
 * @returns {Object} Detection summary
 */
function buildDetectionSummary(scanType, sources) {
  const virustotal = sources.virustotal || {};
  const vtStats = virustotal.last_analysis_stats || {};

  // 1. VirusTotal detection counts (both the parsed and raw layouts)
  const vtMalicious = Number(virustotal.malicious) || Number(vtStats.malicious) || 0;
  const vtSuspicious = Number(virustotal.suspicious) || Number(vtStats.suspicious) || 0;
  const vtHarmless = Number(virustotal.harmless) || Number(vtStats.harmless) || 0;
  const vtUndetected = Number(virustotal.undetected) || Number(vtStats.undetected) || 0;
  const vtTimeout = Number(virustotal.timeout) || Number(vtStats.timeout) || 0;
  const vtTotal = vtMalicious + vtSuspicious + vtHarmless + vtUndetected + vtTimeout;

  // 2. OTX pulse count (real pulse reports)
  const otx = sources.otx || {};
  const otxPulseCount = Number(otx.pulseCount) || 0;

  // 3. AbuseIPDB (IP scans only — real reported abuse confidence)
  const abuseipdb = sources.abuseipdb || {};
  const abuseConfidence = Number(abuseipdb.abuseConfidenceScore) || 0;
  const abuseTotalReports = Number(abuseipdb.totalReports) || 0;

  // 4. ThreatFox (real IOC match)
  const threatFox = sources.abusechThreatFox || {};
  const threatFoxFound = threatFox.found === true;

  // 5. MalwareBazaar (real malware sample match)
  const malwareBazaar = sources.abusechMalwareBazaar || {};
  const malwareBazaarFound = malwareBazaar.found === true;

  // Collect all provider entries (normalized by normalizeSource).
  const allProviders = Object.entries(sources).filter(([k]) => k !== 'fileInfo').map(([, v]) => v);

  // Count REAL malicious / suspicious / clean / unavailable providers.
  // Unavailable providers (error/timeout/auth/forbidden/not-configured/no-data)
  // are ignored entirely — they never inflate the malicious count.
  const maliciousProviders = allProviders.filter(providerIsMalicious).length;
  const suspiciousProviders = allProviders.filter(providerIsSuspicious).length;
  const cleanProviders = allProviders.filter((p) => {
    if (isUnavailableProvider(p)) return false;
    if (providerIsMalicious(p) || providerIsSuspicious(p)) return false;
    return true;
  }).length;
  const unavailableProviders = allProviders.filter(isUnavailableProvider).length;

  // Threat family (only from a real provider match)
  let threatFamily = '';
  if (otx.malwareFamily) {
    threatFamily = String(otx.malwareFamily);
  } else if (malwareBazaar.samples && malwareBazaar.samples.length > 0) {
    threatFamily = String(
      malwareBazaar.samples[0].malwareFamily || malwareBazaar.samples[0].signature || ''
    );
  } else if (threatFox.iocs && threatFox.iocs.length > 0) {
    threatFamily = String(
      threatFox.iocs[0].malware || threatFox.iocs[0].malwarePrintable || ''
    );
  }

  // Detection engines "X/Y" and count (comes directly from VirusTotal).
  const detectionCount = vtMalicious + vtSuspicious;
  const detectionEngines = vtTotal > 0 ? `${detectionCount}/${vtTotal}` : '';

  // Blacklist status (only from a real provider indicator)
  let blacklistStatus = '';
  if (abuseipdb.isWhitelisted === true) blacklistStatus = 'Whitelisted';
  else if (abuseConfidence > 0) blacklistStatus = 'Reported';
  else if (threatFoxFound || malwareBazaarFound) blacklistStatus = 'Listed';
  else blacklistStatus = 'Not Listed';

  // Reputation (only when a provider actually returns one)
  let reputation = '';
  if (virustotal.reputation !== undefined && virustotal.reputation !== null) {
    reputation = String(virustotal.reputation);
  } else if (otx.reputation !== undefined && otx.reputation !== null) {
    reputation = String(otx.reputation);
  }

  // ---- Evidence-based verdict (provider-count + real signals) ----
  // Rules:
  //   3+ malicious providers  → Malicious, risk 90-100
  //   1-2 malicious providers → Malicious, risk 70-89
  //   >=1 malicious           → at least Malicious
  //   1+ suspicious           → Suspicious, risk 40-60
  //   no detections + clean   → Safe, risk 0-20
  let riskScore = 0;
  let status = 'Safe';
  let aiVerdict = 'Safe';

  if (maliciousProviders >= 3) {
    riskScore = Math.min(100, 90 + (maliciousProviders - 3) * 3);
    status = 'Malicious';
    aiVerdict = 'Malicious';
  } else if (maliciousProviders === 2) {
    riskScore = 85;
    status = 'Malicious';
    aiVerdict = 'Malicious';
  } else if (maliciousProviders === 1) {
    riskScore = 75;
    status = 'Malicious';
    aiVerdict = 'Malicious';
  } else if (suspiciousProviders >= 1) {
    riskScore = Math.min(60, 40 + suspiciousProviders * 5);
    status = 'Suspicious';
    aiVerdict = 'Suspicious';
  } else {
    // No malicious/suspicious providers. Optional secondary signals only when
    // actually present — but never enough to override a clean consensus.
    let signalMax = 0;
    if (vtTotal > 0 && detectionCount === 0) signalMax = 0; // clean VT
    if (abuseConfidence > 0 && abuseConfidence <= 25) signalMax = Math.max(signalMax, 10);
    else if (abuseConfidence > 25) signalMax = Math.max(signalMax, Math.min(abuseConfidence * 0.5, 30));
    if (otxPulseCount > 0 && otxPulseCount <= 2) signalMax = Math.max(signalMax, 15);
    else if (otxPulseCount > 2) signalMax = Math.max(signalMax, Math.min(otxPulseCount * 8, 35));

    riskScore = Math.min(20, signalMax);
    status = riskScore <= 20 ? 'Safe' : status;
    aiVerdict = riskScore <= 20 ? 'Safe' : 'Low Risk';
  }

  riskScore = Math.min(100, Math.round(riskScore));

  // Detection status (real evidence only).
  let detectionStatus;
  if (detectionCount > 0) {
    detectionStatus = `Malicious (${detectionCount} engine${detectionCount === 1 ? '' : 's'})`;
  } else if (threatFoxFound || malwareBazaarFound) {
    detectionStatus = 'Threat Detected';
  } else if (otxPulseCount > 0) {
    detectionStatus = 'Suspicious';
  } else if (abuseConfidence > 0) {
    detectionStatus = 'Reported';
  } else {
    detectionStatus = 'No Threat Detected';
  }

  const riskLevel = getRiskLevel(riskScore);

  return {
    riskScore,
    riskLevel,
    status,
    detectionStatus,
    detectionEngines,
    detectionCount: String(detectionCount),
    threatFamily,
    blacklistStatus,
    reputation,
    aiVerdict,
    // Expose aggregation counts for the UI / provider cards.
    maliciousProviders,
    suspiciousProviders,
    cleanProviders,
    unavailableProviders,
  };
}

/**
 * Generate a human-readable summary from all scan sources
 */
function generateSummary(scanType, sources) {
  const summary = {
    totalSources: 0,
    successfulScans: 0,
    failedScans: 0,
    threatsFound: 0,
    keyFindings: [],
    recommendations: []
  };

  Object.entries(sources).forEach(([name, data]) => {
    if (data && data.scanned) {
      summary.totalSources++;
      summary.successfulScans++;

      // Check for threats in each source
      if (data.malicious || data.threat || data.safe === false) {
        summary.threatsFound++;
        summary.keyFindings.push(`${name}: threat detected`);
      }

      // Extract specific findings
      if (data.threatScore > 50) {
        summary.keyFindings.push(`${name}: threat score ${data.threatScore}`);
      }
    } else if (data && data.error) {
      summary.failedScans++;
    }
  });

  // Generate recommendations based on scan type and findings
  if (summary.threatsFound > 0) {
    summary.recommendations.push('Immediate investigation recommended');
    summary.recommendations.push('Isolate affected systems if applicable');
    summary.recommendations.push('Review security controls and update signatures');
  } else {
    summary.recommendations.push('No immediate threats detected');
    summary.recommendations.push('Continue regular monitoring');
  }

  if (scanType === 'url' || scanType === 'domain') {
    summary.recommendations.push('Consider adding to blocklist if suspicious');
  }

  return summary;
}

/**
 * @desc    Scan an indicator (IP, URL, Domain, Hash, File)
 * @route   POST /api/v1/scan
 * @access  Private
 */
exports.scan = asyncHandler(async (req, res, next) => {
  const { value, type, file } = req.body;

  if (!value && !file) {
    return next(new ErrorResponse('Please provide a value (IP/URL/Domain/Hash) or a file to scan', 400));
  }

  // Detect input type
  let scanType;
  let scanValue;

  if (file) {
    scanType = 'file';
    scanValue = file.name || 'unknown_file';
  } else {
    scanType = type || detectInputType(value);
    scanValue = value.trim();

    if (scanType === 'unknown') {
      return next(new ErrorResponse('Unable to detect input type. Please specify type: ip, url, domain, hash, or file', 400));
    }
  }

  // Check cache
  const cacheKey = `${scanType}:${scanValue}`;
  const cached = getCached(cacheKey);
  if (cached) {
    logger.info(`Returning cached scan result for ${cacheKey}`);
    return res.status(200).json(cached);
  }

  logger.info(`Starting ${scanType} scan for: ${scanValue}`);

  let results = {};

  try {
switch (scanType) {
      case 'file':
        results = await scanFile(scanValue, file);
        break;
      case 'url':
        results = await scanURL(scanValue);
        break;
      case 'ip':
        results = await scanIP(scanValue);
        break;
      case 'domain':
        results = await scanDomain(scanValue);
        break;
      case 'hash':
        results = await scanHash(scanValue);
        break;
      default:
        return next(new ErrorResponse(`Unsupported scan type: ${scanType}`, 400));
    }

    // If URL validation failed, return immediately without contacting providers.
    if (results.validationError) {
      const response = {
        success: false,
        scanType,
        value: scanValue,
        overallThreatScore: 0,
        riskLevel: 'Safe',
        status: 'Safe',
        threatLevel: 'Safe',
        detectionStatus: results.validationError,
        detectionEngines: '',
        detectionCount: '',
        threatFamily: '',
        blacklistStatus: '',
        reputation: '',
        aiVerdict: 'Invalid Input',
        summary: {
          keyFindings: [results.validationError],
          recommendations: [],
        },
        sources: {},
        scannedAt: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Log RAW provider responses for the audit trail (Step 2 of the task).
    try {
      const rawAudit = {};
      Object.entries(results.sources).forEach(([name, source]) => {
        // Only log providers that were actually contacted (scanned === true)
        // or that returned a hard error so the audit is truthful.
        if (source && typeof source === 'object') {
          rawAudit[name] = source;
        }
      });
      logger.info(`[SCAN-AUDIT][${scanType}] value=${scanValue} rawSources=${JSON.stringify(rawAudit)}`);
    } catch (auditErr) {
      logger.error(`[SCAN-AUDIT] failed to serialize raw sources: ${auditErr.message}`);
    }

    // Build the evidence-based detection summary. The backend is the single
    // source of truth for every downstream field (risk, status, threat level,
    // detection status, engines, AI verdict). The frontend must only render it.
    const detection = buildDetectionSummary(scanType, results.sources);

    // Keep overallThreatScore for backward compatibility, but it now equals
    // the evidence-based risk score.
    const overallThreatScore = detection.riskScore;
    const riskLevel = detection.riskLevel;

    // Generate summary
    const summary = generateSummary(scanType, results.sources);

    const response = {
      success: true,
      scanType,
      value: scanValue,
      overallThreatScore,
      riskLevel,
      status: detection.status,
      threatLevel: detection.riskLevel,
      detectionStatus: detection.detectionStatus,
      detectionEngines: detection.detectionEngines,
      detectionCount: detection.detectionCount,
      threatFamily: detection.threatFamily,
      blacklistStatus: detection.blacklistStatus,
      reputation: detection.reputation,
      aiVerdict: detection.aiVerdict,
      summary,
      sources: results.sources,
      scannedAt: new Date().toISOString()
    };

    // Persist scan result to MongoDB
    try {
      await ScanRecord.create({
        user: req.user.id,
        organization: req.user.organization,
        scanType,
        value: scanValue,
        overallThreatScore,
        riskLevel,
        status: detection.status,
        threatLevel: detection.riskLevel,
        detectionStatus: detection.detectionStatus,
        detectionEngines: detection.detectionEngines,
        detectionCount: detection.detectionCount,
        threatFamily: detection.threatFamily,
        blacklistStatus: detection.blacklistStatus,
        reputation: detection.reputation,
        aiVerdict: detection.aiVerdict,
        sources: results.sources,
        summary,
        scannedAt: new Date(),
      });
    } catch (persistErr) {
      logger.error(`Failed to persist scan record: ${persistErr.message}`);
      // Non-fatal: continue even if persistence fails
    }

    // ============================================================
    // Automatic persistence: save threat data to dedicated collections
    // so the Threat Intelligence dashboard can query real data.
    // ============================================================
    try {
      const now = new Date();

// 1. Persist IOC for every scanned value (non-file scans)
      if (scanValue && scanType !== 'file') {
        const iocTypeMap = {
          ip: 'ip-address-v4',
          domain: 'domain',
          url: 'url',
          hash: 'file-hash-sha256',
        };
        const iocType = iocTypeMap[scanType] || 'other';

        // Extract geolocation from scan sources for the threat map
        const ipinfo = results.sources?.ipinfo || {};
        const shodan = results.sources?.shodan || {};
        const abuseipdb = results.sources?.abuseipdb || {};
        const country = String(
          ipinfo.country ||
          shodan.country ||
          abuseipdb.countryName ||
          ''
        ).toLowerCase();
        const coordinates = ipinfo.coordinates || {};
        const geolocation = {
          country: country || undefined,
          region: ipinfo.region ? String(ipinfo.region) : undefined,
          city: ipinfo.city ? String(ipinfo.city) : undefined,
          latitude: coordinates.latitude ? Number(coordinates.latitude) : (shodan.latitude ? Number(shodan.latitude) : undefined),
          longitude: coordinates.longitude ? Number(coordinates.longitude) : (shodan.longitude ? Number(shodan.longitude) : undefined),
          isp: ipinfo.org ? String(ipinfo.org) : (abuseipdb.isp ? String(abuseipdb.isp) : undefined),
          organization: (ipinfo.company && ipinfo.company.name) ? String(ipinfo.company.name) : undefined,
          asn: (ipinfo.asn && ipinfo.asn.asn) ? String(ipinfo.asn.asn) : (shodan.asn ? String(shodan.asn) : undefined),
        };

        // Check for existing IOC to avoid duplicate key errors
        const existingIOC = await IOC.findOne({ value: scanValue, type: iocType });
        if (!existingIOC) {
          await IOC.create({
            value: scanValue,
            type: iocType,
            description: `${scanType} indicator scanned with ${riskLevel} risk level`,
            confidence: overallThreatScore,
            severity: riskLevel === 'Critical' ? 'critical' : riskLevel === 'High' ? 'high' : riskLevel === 'Medium' ? 'medium' : 'low',
            source: 'threat-intelligence',
            sourceName: 'SentinelX Scan',
            firstSeen: now,
            lastSeen: now,
            isActive: true,
            tags: [scanType, riskLevel.toLowerCase()],
            geolocation,
          });
          logger.info(`Persisted IOC: ${scanValue} (${iocType})`);
        } else {
          // Update last seen
          existingIOC.lastSeen = now;
          existingIOC.confidence = Math.max(existingIOC.confidence, overallThreatScore);
          if (country && existingIOC.geolocation) {
            existingIOC.geolocation.country = country;
          }
          await existingIOC.save();
        }
      }

      // 2. Check if any source detected malware and persist ThreatIntelligence
      const vtData = results.sources?.virustotal || {};
      const otxData = results.sources?.otx || {};
      const abuseipdbData = results.sources?.abuseipdb || {};
      const shodanData = results.sources?.shodan || {};
      const threatFoxData = results.sources?.abusechThreatFox || {};
      const malwareBazaarData = results.sources?.abusechMalwareBazaar || {};

      // Determine if threat data exists
      const hasThreatData = overallThreatScore > 20 || 
        vtData.malicious > 0 || 
        vtData.last_analysis_stats?.malicious > 0 ||
        Number(abuseipdbData.abuseConfidenceScore) > 0 ||
        (threatFoxData.data && threatFoxData.data.length > 0) ||
        (malwareBazaarData.data && malwareBazaarData.data.length > 0);

      if (hasThreatData) {
        // Check for existing threat intel
        const existingThreat = await ThreatIntelligence.findOne({
          'indicators.value': scanValue,
        });

        if (!existingThreat) {
          const threatData = {
            title: `${riskLevel} - ${scanValue}`,
            description: `Automatically generated threat intelligence from ${scanType} scan. Risk level: ${riskLevel}, Score: ${overallThreatScore}/100`,
            threatType: riskLevel === 'Critical' || riskLevel === 'High' ? 'malware' : 'other',
            indicators: [{
              type: scanType === 'ip' ? 'ip-address' : scanType === 'domain' ? 'domain' : scanType === 'url' ? 'url' : 'file-hash-sha256',
              value: scanValue,
              confidence: overallThreatScore,
              severity: riskLevel === 'Critical' ? 'critical' : riskLevel === 'High' ? 'high' : riskLevel === 'Medium' ? 'medium' : 'low',
              firstSeen: now,
              lastSeen: now,
              isActive: true,
            }],
            sources: [{
              name: 'SentinelX Scan Engine',
              type: 'internal',
              isActive: true,
              lastUpdated: now,
            }],
            tags: [scanType, riskLevel.toLowerCase()],
            isActive: true,
          };

          // Add malware family if detected from OTX or VT
          const malwareFamily = otxData.malwareFamily || (vtData.malwareFamily) || threatFoxData.malware || null;
          if (malwareFamily) {
            threatData.malwareFamilies = [{
              name: malwareFamily,
              description: `Detected during ${scanType} scan of ${scanValue}`,
            }];
          }

          await ThreatIntelligence.create(threatData);
          logger.info(`Persisted ThreatIntelligence for: ${scanValue}`);
        }
      }

      logger.info(`Automatic persistence complete for scan: ${scanValue}`);
    } catch (persistErr) {
      logger.error(`Failed to persist threat data: ${persistErr.message}`);
      // Non-fatal
    }

    // Cache the result
    setCached(cacheKey, response);

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Scan failed for ${scanValue}: ${error.message}`);
    return next(new ErrorResponse(`Scan failed: ${error.message}`, 500));
  }
});

/**
 * Derive a verdict from a provider's threatScore.
 */
function verdictFromScore(score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return 'unknown';
  if (score >= 80) return 'malicious';
  if (score >= 40) return 'suspicious';
  return 'clean';
}

/**
 * Extract a normalized per-provider result object used by the frontend and the
 * evidence-based detection summary.
 *
 * The raw provider payload is ALSO spread at the top level so downstream
 * consumers that read top-level fields (e.g. `virustotal.malicious`,
 * `abuseipdb.abuseConfidenceScore`, `otx.pulseCount`) keep working exactly as
 * before. The normalized fields (provider, label, status, verdict, confidence,
 * responseTime, error, ...) are added alongside for the provider cards.
 */
function normalizeSource(raw, provider, label) {
  const status = raw.status || 'error';
  const available = status === 'completed';
  const score = typeof raw.threatScore === 'number' ? raw.threatScore : 0;

  // A completed provider may report "no match" (e.g. OTX returns found:false
  // with a message for a URL it has no data for). In that case the provider was
  // contacted successfully but found nothing — surface that as "No Match" and a
  // neutral verdict, never a misleading "clean".
  const rawData = raw.data && typeof raw.data === 'object' ? raw.data : {};
  const reportedNoMatch = available && rawData.found === false;
  const reportedMessage = available && rawData.message ? String(rawData.message) : '';

  // Only derive a verdict from a real, available provider. A failed/timed-out
  // provider must NEVER be labelled clean (that would be "Error + CLEAN").
  const verdict = available && !reportedNoMatch ? verdictFromScore(score) : 'unknown';

  // Preserve the explicit provider status enum from providerRunner. A disabled
  // provider (not_configured) is NOT an error and must stay labelled as such.
  let finalStatus = status;
  if (available) {
    finalStatus = reportedNoMatch ? 'no_match' : 'completed';
  }

  return {
    // Raw provider payload at the top level (preserves existing consumers).
    ...rawData,
    // Normalized fields for the provider cards / detection summary.
    provider,
    label: label || provider,
    available,
    success: available,
    status: finalStatus,
    verdict,
    confidence: available && !reportedNoMatch ? Math.min(100, Math.max(0, score)) : 0,
    detections: available && typeof raw.data?.detections === 'number' ? raw.data.detections : 0,
    threatScore: score,
    responseTime: raw.responseTime || 0,
    lastUpdated: raw.lastUpdated || null,
    error: raw.error || (reportedNoMatch ? (reportedMessage || 'No Match') : null),
    data: raw.data || null,
    scanned: available,
  };
}

/**
 * Scan a file: Upload to Cloudinary, hash, VirusTotal + ThreatFox +
 * MalwareBazaar + OTX. Every provider runs independently via Promise.allSettled
 * semantics. One provider failure never fails the whole scan.
 */
async function scanFile(fileName, fileData) {
  // Extract the actual buffer from the file data object
  const fileBuffer = fileData.buffer || fileData;

  // Generate crypto hashes
  const crypto = require('crypto');
  const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

  const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);
  const hasVirusTotal = Boolean(process.env.VIRUSTOTAL_API_KEY);
  const hasOTX = Boolean(process.env.OTX_API_KEY);

  const specs = [
    {
      provider: 'cloudinary',
      label: 'Cloudinary',
      enabled: hasCloudinary,
      configError: 'Cloudinary not configured',
      timeoutMs: 20000,
      run: () => cloudinaryService.uploadFile(fileBuffer, fileName),
    },
    {
      provider: 'virustotal',
      label: 'VirusTotal',
      enabled: hasVirusTotal,
      configError: 'VirusTotal not configured',
      timeoutMs: 10000,
      run: () => virusTotalService.scanFile(fileBuffer, fileName, process.env.VIRUSTOTAL_API_KEY),
    },
    {
      provider: 'virustotalHash',
      label: 'VirusTotal Hash',
      enabled: hasVirusTotal,
      configError: 'VirusTotal not configured',
      timeoutMs: 10000,
      run: () => virusTotalService.scanHash(sha256Hash, process.env.VIRUSTOTAL_API_KEY),
    },
    {
      provider: 'abusechThreatFox',
      label: 'Abuse.ch ThreatFox',
      enabled: true,
      configError: '',
      timeoutMs: 8000,
      run: () => abusechService.threatFoxSearch(sha256Hash),
    },
    {
      provider: 'abusechMalwareBazaar',
      label: 'MalwareBazaar',
      enabled: true,
      configError: '',
      timeoutMs: 8000,
      run: () => abusechService.malwareBazaarSearch(sha256Hash),
    },
    {
      provider: 'otx',
      label: 'AlienVault OTX',
      enabled: hasOTX,
      configError: 'OTX not configured',
      timeoutMs: 8000,
      run: () => otxService.lookupHash(sha256Hash, process.env.OTX_API_KEY),
    },
  ];

  const results = await runProviders(specs);

  // Build the sources object for the existing response shape.
  const sources = {};
  results.forEach((r) => {
    sources[r.provider] = normalizeSource(r, r.provider, r.label);
  });

  sources.fileInfo = {
    fileName,
    sha256: sha256Hash,
    md5: md5Hash,
  };

  return { sources };
}

/**
 * Scan a URL: Google Safe Browsing + VirusTotal + URLScan + OTX + Pulsedive.
 * Every provider runs independently via runProviders and is normalized so the
 * frontend provider cards render real status/verdict/confidence/response-time
 * data.
 */
async function scanURL(url) {
  const hasGSB = Boolean(process.env.GOOGLE_SAFE_BROWSING_API_KEY);
  const hasVirusTotal = Boolean(process.env.VIRUSTOTAL_API_KEY);
  const hasURLScan = Boolean(process.env.URLSCAN_API_KEY);
  const hasOTX = Boolean(process.env.OTX_API_KEY);
  const hasPulsedive = Boolean(process.env.PULSEDIVE_API_KEY);

  // Validate the URL before it is sent to ANY provider. Invalid URLs are never
  // sent upstream — this avoids wasting provider quota and confusing errors.
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return {
      sources: {},
      validationError: 'Invalid URL',
    };
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return {
      sources: {},
      validationError: 'Unsupported URL',
    };
  }

  const specs = [
{
      provider: 'googleSafeBrowsing',
      label: 'Google Safe Browsing',
      enabled: hasGSB,
      configError: 'Google Safe Browsing not configured',
      timeoutMs: 5000,
      run: () => googleSafeBrowsingService.checkUrl(url, process.env.GOOGLE_SAFE_BROWSING_API_KEY),
    },
    {
      provider: 'virustotal',
      label: 'VirusTotal',
      enabled: hasVirusTotal,
      configError: 'VirusTotal not configured',
      timeoutMs: 10000,
      run: () => virusTotalService.scanUrl(url, process.env.VIRUSTOTAL_API_KEY),
    },
    {
      provider: 'urlscan',
      label: 'URLScan.io',
      enabled: hasURLScan,
      configError: 'URLScan.io not configured',
      timeoutMs: 12000,
      run: () => urlscanService.scanUrl(url, process.env.URLSCAN_API_KEY),
    },
    {
      provider: 'otx',
      label: 'AlienVault OTX',
      enabled: hasOTX,
      configError: 'OTX not configured',
      timeoutMs: 8000,
      run: () => otxService.lookupURL(url, process.env.OTX_API_KEY),
    },
    {
      provider: 'pulsedive',
      label: 'Pulsedive',
      enabled: hasPulsedive,
      configError: 'Pulsedive not configured',
      timeoutMs: 8000,
      run: () => pulsediveService.lookupIndicator(url, process.env.PULSEDIVE_API_KEY),
    },
  ];

  const results = await runProviders(specs);

  const sources = {};
  results.forEach((r) => {
    sources[r.provider] = normalizeSource(r, r.provider, r.label);
  });

  return { sources };
}

/**
 * Scan an IP: AbuseIPDB + Shodan + GreyNoise + IPinfo + OTX + Criminal IP +
 * Pulsedive. Every provider runs independently via runProviders and is
 * normalized so the frontend provider cards render real status/verdict/
 * confidence/response-time data.
 */
async function scanIP(ip) {
  const hasAbuseIPDB = Boolean(process.env.ABUSEIPDB_API_KEY);
  const hasShodan = Boolean(process.env.SHODAN_API_KEY);
  const hasGreyNoise = Boolean(process.env.GREYNOISE_API_KEY);
  const hasIPinfo = Boolean(process.env.IPINFO_API_KEY);
  const hasOTX = Boolean(process.env.OTX_API_KEY);
  const hasCriminalIP = Boolean(process.env.CRIMINALIP_API_KEY);
  const hasPulsedive = Boolean(process.env.PULSEDIVE_API_KEY);

  const specs = [
    {
      provider: 'abuseipdb',
      label: 'AbuseIPDB',
      enabled: hasAbuseIPDB,
      configError: 'AbuseIPDB not configured',
      timeoutMs: 8000,
      run: () => abuseIpService.checkIpReputation(ip, process.env.ABUSEIPDB_API_KEY),
    },
    {
      provider: 'shodan',
      label: 'Shodan',
      enabled: hasShodan,
      configError: 'Shodan not configured',
      timeoutMs: 10000,
      run: () => shodanService.getHostInfo(ip, process.env.SHODAN_API_KEY),
    },
    {
      provider: 'greyNoise',
      label: 'GreyNoise',
      enabled: hasGreyNoise,
      configError: 'GreyNoise not configured',
      timeoutMs: 8000,
      run: () => greyNoiseService.lookupIP(ip, process.env.GREYNOISE_API_KEY),
    },
    {
      provider: 'ipinfo',
      label: 'IPinfo',
      enabled: true, // IPinfo works without an API key for basic lookups
      configError: '',
      timeoutMs: 8000,
      run: () => ipinfoService.lookupIP(ip, hasIPinfo ? process.env.IPINFO_API_KEY : ''),
    },
    {
      provider: 'otx',
      label: 'AlienVault OTX',
      enabled: hasOTX,
      configError: 'OTX not configured',
      timeoutMs: 8000,
      run: () => otxService.lookupIP(ip, process.env.OTX_API_KEY),
    },
    {
      provider: 'criminalIp',
      label: 'Criminal IP',
      enabled: hasCriminalIP,
      configError: 'Criminal IP not configured',
      timeoutMs: 8000,
      run: () => criminalIpService.getIPIntelligence(ip, process.env.CRIMINALIP_API_KEY),
    },
    {
      provider: 'pulsedive',
      label: 'Pulsedive',
      enabled: hasPulsedive,
      configError: 'Pulsedive not configured',
      timeoutMs: 8000,
      run: () => pulsediveService.lookupIndicator(ip, process.env.PULSEDIVE_API_KEY),
    },
  ];

  const results = await runProviders(specs);

  const sources = {};
  results.forEach((r) => {
    sources[r.provider] = normalizeSource(r, r.provider, r.label);
  });

  return { sources };
}

/**
 * Scan a domain: OTX + Pulsedive + Criminal IP + VirusTotal.
 * Every provider runs independently via runProviders and is normalized so the
 * frontend provider cards render real status/verdict/confidence/response-time
 * data.
 */
async function scanDomain(domain) {
  const hasOTX = Boolean(process.env.OTX_API_KEY);
  const hasPulsedive = Boolean(process.env.PULSEDIVE_API_KEY);
  const hasCriminalIP = Boolean(process.env.CRIMINALIP_API_KEY);
  const hasVirusTotal = Boolean(process.env.VIRUSTOTAL_API_KEY);

  const specs = [
    {
      provider: 'otx',
      label: 'AlienVault OTX',
      enabled: hasOTX,
      configError: 'OTX not configured',
      timeoutMs: 8000,
      run: () => otxService.lookupDomain(domain, process.env.OTX_API_KEY),
    },
    {
      provider: 'pulsedive',
      label: 'Pulsedive',
      enabled: hasPulsedive,
      configError: 'Pulsedive not configured',
      timeoutMs: 8000,
      run: () => pulsediveService.lookupIndicator(domain, process.env.PULSEDIVE_API_KEY),
    },
    {
      provider: 'criminalIp',
      label: 'Criminal IP',
      enabled: hasCriminalIP,
      configError: 'Criminal IP not configured',
      timeoutMs: 8000,
      run: () => criminalIpService.getDomainIntelligence(domain, process.env.CRIMINALIP_API_KEY),
    },
    {
      provider: 'virustotal',
      label: 'VirusTotal',
      enabled: hasVirusTotal,
      configError: 'VirusTotal not configured',
      timeoutMs: 10000,
      run: () => virusTotalService.scanDomain(domain, process.env.VIRUSTOTAL_API_KEY),
    },
  ];

  const results = await runProviders(specs);

  const sources = {};
  results.forEach((r) => {
    sources[r.provider] = normalizeSource(r, r.provider, r.label);
  });

  return { sources };
}

/**
 * Scan a hash: VirusTotal + OTX + ThreatFox + MalwareBazaar.
 * Every provider runs independently via runProviders (Promise.allSettled
 * semantics) and is normalized so the frontend provider cards render real
 * status/verdict/confidence/response-time data.
 */
async function scanHash(hash) {
  const hasVirusTotal = Boolean(process.env.VIRUSTOTAL_API_KEY);
  const hasOTX = Boolean(process.env.OTX_API_KEY);

  const specs = [
    {
      provider: 'virustotal',
      label: 'VirusTotal',
      enabled: hasVirusTotal,
      configError: 'VirusTotal not configured',
      timeoutMs: 10000,
      run: () => virusTotalService.scanHash(hash, process.env.VIRUSTOTAL_API_KEY),
    },
    {
      provider: 'otx',
      label: 'AlienVault OTX',
      enabled: hasOTX,
      configError: 'OTX not configured',
      timeoutMs: 8000,
      run: () => otxService.lookupHash(hash, process.env.OTX_API_KEY),
    },
    {
      provider: 'abusechThreatFox',
      label: 'Abuse.ch ThreatFox',
      enabled: true,
      configError: '',
      timeoutMs: 8000,
      run: () => abusechService.threatFoxSearch(hash),
    },
    {
      provider: 'abusechMalwareBazaar',
      label: 'MalwareBazaar',
      enabled: true,
      configError: '',
      timeoutMs: 8000,
      run: () => abusechService.malwareBazaarSearch(hash),
    },
  ];

  const results = await runProviders(specs);

  const sources = {};
  results.forEach((r) => {
    sources[r.provider] = normalizeSource(r, r.provider, r.label);
  });

  return { sources };
}

/**
 * @desc    Get scan details by ID
 * @route   GET /api/v1/scan/:id
 * @access  Private
 */
exports.getScan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check cache for scan result first (fast path for recently scanned values).
  const cached = getCached(id);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached,
      source: 'cache'
    });
  }

  // Fall back to the persisted record in MongoDB so "View Result" works for
  // any history item, even after the in-memory cache has expired.
  if (mongoose.Types.ObjectId.isValid(id)) {
    const record = await ScanRecord.findById(id).lean();
    if (record) {
      return res.status(200).json({
        success: true,
        data: {
          id: record._id.toString(),
          scanType: record.scanType,
          value: record.value,
          overallThreatScore: record.overallThreatScore,
          riskLevel: record.riskLevel,
          status: record.status,
          threatLevel: record.threatLevel,
          detectionStatus: record.detectionStatus,
          detectionEngines: record.detectionEngines,
          detectionCount: record.detectionCount,
          threatFamily: record.threatFamily,
          blacklistStatus: record.blacklistStatus,
          reputation: record.reputation,
          aiVerdict: record.aiVerdict,
          sources: record.sources,
          summary: record.summary,
          scannedAt: record.scannedAt,
          createdAt: record.createdAt,
        },
        source: 'mongo'
      });
    }
  }

  res.status(200).json({
    success: false,
    data: {
      scanId: id,
      message: 'Scan result not found. Please perform a new scan.',
      scannedAt: new Date().toISOString()
    }
  });
});

/**
 * @desc    Get scan history (recent scans) from MongoDB
 * @route   GET /api/scan/history
 * @access  Private
 */
exports.getScanHistory = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const filter = { user: req.user.id };
  if (req.user.organization) {
    filter.organization = req.user.organization;
  }

  const [records, total] = await Promise.all([
    ScanRecord.find(filter)
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ScanRecord.countDocuments(filter),
  ]);

const data = records.map((r) => ({
    id: r._id.toString(),
    scanType: r.scanType,
    value: r.value,
    overallThreatScore: r.overallThreatScore,
    riskLevel: r.riskLevel,
    status: r.status,
    threatLevel: r.threatLevel,
    detectionStatus: r.detectionStatus,
    detectionEngines: r.detectionEngines,
    detectionCount: r.detectionCount,
    threatFamily: r.threatFamily,
    blacklistStatus: r.blacklistStatus,
    reputation: r.reputation,
    aiVerdict: r.aiVerdict,
    scannedAt: r.scannedAt,
    createdAt: r.createdAt,
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data,
  });
});

/**
 * @desc    Get scan report for a specific scan
 * @route   GET /api/report
 * @access  Private
 */
exports.getScanReport = asyncHandler(async (req, res, next) => {
  const { id, type } = req.query;

  // If a specific scan ID is requested
  if (id) {
    const cached = getCached(id);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: {
          report: generateDetailedReport(cached),
          summary: cached.summary,
          scanType: cached.scanType,
          value: cached.value,
          overallThreatScore: cached.overallThreatScore,
          riskLevel: cached.riskLevel,
          scannedAt: cached.scannedAt
        }
      });
    }
    return next(new ErrorResponse(`Scan not found with id ${id}`, 404));
  }

  // If a type filter is requested
  if (type) {
    const filteredResults = [];
    scanCache.forEach((entry, key) => {
      if (entry.data.scanType === type) {
        filteredResults.push({
          id: key,
          ...entry.data
        });
      }
    });

    return res.status(200).json({
      success: true,
      count: filteredResults.length,
      data: filteredResults.slice(0, 20)
    });
  }

  // Return summary report of all recent scans
  const summary = {
    totalScans: scanCache.size,
    byType: {},
    byRiskLevel: {},
    averageThreatScore: 0
  };

  let totalScore = 0;
  scanCache.forEach((entry) => {
    const { scanType, riskLevel, overallThreatScore } = entry.data;

    summary.byType[scanType] = (summary.byType[scanType] || 0) + 1;
    summary.byRiskLevel[riskLevel] = (summary.byRiskLevel[riskLevel] || 0) + 1;
    totalScore += overallThreatScore || 0;
  });

  summary.averageThreatScore = scanCache.size > 0
    ? Math.round(totalScore / scanCache.size)
    : 0;

  res.status(200).json({
    success: true,
    data: summary
  });
});

/**
 * Generate a detailed report from scan data
 */
function generateDetailedReport(scanData) {
  return {
    executiveSummary: `Scan of ${scanData.scanType} "${scanData.value}" completed with risk level: ${scanData.riskLevel}`,
    threatScore: scanData.overallThreatScore,
    riskAssessment: scanData.riskLevel === 'Safe' ? 'No immediate action required' :
      scanData.riskLevel === 'Low' ? 'Monitor periodically' :
      scanData.riskLevel === 'Medium' ? 'Investigate further' :
      scanData.riskLevel === 'High' ? 'Immediate investigation recommended' :
      'Critical - Take immediate action',
    sourcesConsulted: Object.keys(scanData.sources || {}).length,
    successfulSources: Object.values(scanData.sources || {}).filter(s => s && s.scanned).length,
    failedSources: Object.values(scanData.sources || {}).filter(s => s && s.error).length,
    recommendations: scanData.summary?.recommendations || [],
    keyFindings: scanData.summary?.keyFindings || []
  };
}


