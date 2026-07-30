const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

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
 * Calculate overall threat score from multiple source scores
 * Weighted average with emphasis on higher scores
 */
function calculateOverallThreatScore(scores) {
  const validScores = scores.filter(s => typeof s === 'number' && s >= 0);
  if (validScores.length === 0) return 0;

  // Weighted: higher scores get more weight (emphasizing threats)
  const weightedSum = validScores.reduce((sum, score) => {
    const weight = 1 + (score / 100); // Higher scores get more weight
    return sum + (score * weight);
  }, 0);

  const totalWeight = validScores.reduce((sum, score) => {
    return sum + 1 + (score / 100);
  }, 0);

  const average = weightedSum / totalWeight;
  return Math.min(Math.round(average), 100);
}

/**
 * Determine risk level from threat score
 */
function getRiskLevel(score) {
  if (score <= 20) return 'Safe';
  if (score <= 40) return 'Low';
  if (score <= 60) return 'Medium';
  if (score <= 80) return 'High';
  return 'Critical';
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

    // Calculate overall threat score
    const scores = [];
    Object.values(results.sources).forEach(source => {
      if (source && typeof source.threatScore === 'number') {
        scores.push(source.threatScore);
      }
    });
    const overallThreatScore = calculateOverallThreatScore(scores);
    const riskLevel = getRiskLevel(overallThreatScore);

    // Generate summary
    const summary = generateSummary(scanType, results.sources);

    const response = {
      success: true,
      scanType,
      value: scanValue,
      overallThreatScore,
      riskLevel,
      summary,
      sources: results.sources,
      scannedAt: new Date().toISOString()
    };

    // Cache the result
    setCached(cacheKey, response);

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Scan failed for ${scanValue}: ${error.message}`);
    return next(new ErrorResponse(`Scan failed: ${error.message}`, 500));
  }
});

/**
 * Scan a file: Upload to Cloudinary, hash, VirusTotal + ThreatFox + MalwareBazaar + OTX
 */
async function scanFile(fileName, fileBuffer) {
  const sources = {};

  // Upload to Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    sources.cloudinary = await cloudinaryService.uploadFile(fileBuffer, fileName);
  }

  // Generate crypto hash
  const crypto = require('crypto');
  const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

  // VirusTotal file scan
  if (process.env.VIRUSTOTAL_API_KEY) {
    sources.virustotal = await virusTotalService.scanFile(fileBuffer, fileName, process.env.VIRUSTOTAL_API_KEY);
  }

  // VirusTotal hash scan (more reliable)
  if (process.env.VIRUSTOTAL_API_KEY) {
    sources.virustotalHash = await virusTotalService.scanHash(sha256Hash, process.env.VIRUSTOTAL_API_KEY);
  }

  // ThreatFox search by hash
  sources.abusechThreatFox = await abusechService.threatFoxSearch(sha256Hash);

  // MalwareBazaar search by hash
  sources.abusechMalwareBazaar = await abusechService.malwareBazaarSearch(sha256Hash);

  // OTX hash lookup
  if (process.env.OTX_API_KEY) {
    sources.otx = await otxService.lookupHash(sha256Hash, process.env.OTX_API_KEY);
  }

  return {
    sources: {
      ...sources,
      fileInfo: {
        fileName,
        sha256: sha256Hash,
        md5: md5Hash
      }
    }
  };
}

/**
 * Scan a URL: Google Safe Browsing + VirusTotal + URLScan + OTX + Pulsedive
 */
async function scanURL(url) {
  const sources = {};

  const promises = [];

  if (process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
    promises.push(
      googleSafeBrowsingService.checkUrl(url, process.env.GOOGLE_SAFE_BROWSING_API_KEY)
        .then(data => { sources.googleSafeBrowsing = data; })
        .catch(err => { sources.googleSafeBrowsing = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.VIRUSTOTAL_API_KEY) {
    promises.push(
      virusTotalService.scanUrl(url, process.env.VIRUSTOTAL_API_KEY)
        .then(data => { sources.virustotal = data; })
        .catch(err => { sources.virustotal = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.URLSCAN_API_KEY) {
    promises.push(
      urlscanService.scanUrl(url, process.env.URLSCAN_API_KEY)
        .then(data => { sources.urlscan = data; })
        .catch(err => { sources.urlscan = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.OTX_API_KEY) {
    promises.push(
      otxService.lookupURL(url, process.env.OTX_API_KEY)
        .then(data => { sources.otx = data; })
        .catch(err => { sources.otx = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.PULSEDIVE_API_KEY) {
    promises.push(
      pulsediveService.lookupIndicator(url, process.env.PULSEDIVE_API_KEY)
        .then(data => { sources.pulsedive = data; })
        .catch(err => { sources.pulsedive = { error: err.message, scanned: false }; })
    );
  }

  await Promise.allSettled(promises);

  return { sources };
}

/**
 * Scan an IP: AbuseIPDB + Shodan + GreyNoise + IPinfo + OTX + Criminal IP + Pulsedive
 */
async function scanIP(ip) {
  const sources = {};
  const promises = [];

  if (process.env.ABUSEIPDB_API_KEY) {
    promises.push(
      abuseIpService.checkIpReputation(ip, process.env.ABUSEIPDB_API_KEY)
        .then(data => { sources.abuseipdb = data; })
        .catch(err => { sources.abuseipdb = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.SHODAN_API_KEY) {
    promises.push(
      shodanService.getHostInfo(ip, process.env.SHODAN_API_KEY)
        .then(data => { sources.shodan = data; })
        .catch(err => { sources.shodan = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.GREYNOISE_API_KEY) {
    promises.push(
      greyNoiseService.lookupIP(ip, process.env.GREYNOISE_API_KEY)
        .then(data => { sources.greyNoise = data; })
        .catch(err => { sources.greyNoise = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.IPINFO_API_KEY) {
    promises.push(
      ipinfoService.lookupIP(ip, process.env.IPINFO_API_KEY)
        .then(data => { sources.ipinfo = data; })
        .catch(err => { sources.ipinfo = { error: err.message, scanned: false }; })
    );
  } else {
    // IPinfo works without API key for basic lookups
    promises.push(
      ipinfoService.lookupIP(ip, '')
        .then(data => { sources.ipinfo = data; })
        .catch(err => { sources.ipinfo = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.OTX_API_KEY) {
    promises.push(
      otxService.lookupIP(ip, process.env.OTX_API_KEY)
        .then(data => { sources.otx = data; })
        .catch(err => { sources.otx = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.CRIMINALIP_API_KEY) {
    promises.push(
      criminalIpService.getIPIntelligence(ip, process.env.CRIMINALIP_API_KEY)
        .then(data => { sources.criminalIp = data; })
        .catch(err => { sources.criminalIp = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.PULSEDIVE_API_KEY) {
    promises.push(
      pulsediveService.lookupIndicator(ip, process.env.PULSEDIVE_API_KEY)
        .then(data => { sources.pulsedive = data; })
        .catch(err => { sources.pulsedive = { error: err.message, scanned: false }; })
    );
  }

  await Promise.allSettled(promises);

  return { sources };
}

/**
 * Scan a domain: OTX + Pulsedive + Criminal IP + VirusTotal
 */
async function scanDomain(domain) {
  const sources = {};
  const promises = [];

  if (process.env.OTX_API_KEY) {
    promises.push(
      otxService.lookupDomain(domain, process.env.OTX_API_KEY)
        .then(data => { sources.otx = data; })
        .catch(err => { sources.otx = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.PULSEDIVE_API_KEY) {
    promises.push(
      pulsediveService.lookupIndicator(domain, process.env.PULSEDIVE_API_KEY)
        .then(data => { sources.pulsedive = data; })
        .catch(err => { sources.pulsedive = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.CRIMINALIP_API_KEY) {
    promises.push(
      criminalIpService.getDomainIntelligence(domain, process.env.CRIMINALIP_API_KEY)
        .then(data => { sources.criminalIp = data; })
        .catch(err => { sources.criminalIp = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.VIRUSTOTAL_API_KEY) {
    promises.push(
      virusTotalService.scanDomain(domain, process.env.VIRUSTOTAL_API_KEY)
        .then(data => { sources.virustotal = data; })
        .catch(err => { sources.virustotal = { error: err.message, scanned: false }; })
    );
  }

  await Promise.allSettled(promises);

  return { sources };
}

/**
 * Scan a hash: VirusTotal + OTX + ThreatFox + MalwareBazaar
 */
async function scanHash(hash) {
  const sources = {};
  const promises = [];

  if (process.env.VIRUSTOTAL_API_KEY) {
    promises.push(
      virusTotalService.scanHash(hash, process.env.VIRUSTOTAL_API_KEY)
        .then(data => { sources.virustotal = data; })
        .catch(err => { sources.virustotal = { error: err.message, scanned: false }; })
    );
  }

  if (process.env.OTX_API_KEY) {
    promises.push(
      otxService.lookupHash(hash, process.env.OTX_API_KEY)
        .then(data => { sources.otx = data; })
        .catch(err => { sources.otx = { error: err.message, scanned: false }; })
    );
  }

  // ThreatFox search (no API key required)
  promises.push(
    abusechService.threatFoxSearch(hash)
      .then(data => { sources.abusechThreatFox = data; })
      .catch(err => { sources.abusechThreatFox = { error: err.message, scanned: false }; })
  );

  // MalwareBazaar search (no API key required)
  promises.push(
    abusechService.malwareBazaarSearch(hash)
      .then(data => { sources.abusechMalwareBazaar = data; })
      .catch(err => { sources.abusechMalwareBazaar = { error: err.message, scanned: false }; })
  );

  await Promise.allSettled(promises);

  return { sources };
}

/**
 * @desc    Get scan details by ID
 * @route   GET /api/v1/scan/:id
 * @access  Private
 */
exports.getScan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check cache for scan result
  const cached = getCached(id);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached,
      source: 'cache'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      scanId: id,
      message: 'Scan result not found in cache. Please perform a new scan.',
      scannedAt: new Date().toISOString()
    }
  });
});

/**
 * @desc    Get scan history (recent scans)
 * @route   GET /api/history
 * @access  Private
 */
exports.getScanHistory = asyncHandler(async (req, res, next) => {
  const scanHistory = [];

  // Extract cache entries to build history
  scanCache.forEach((entry, key) => {
    scanHistory.push({
      id: key,
      scanType: entry.data.scanType,
      value: entry.data.value,
      overallThreatScore: entry.data.overallThreatScore,
      riskLevel: entry.data.riskLevel,
      scannedAt: entry.data.scannedAt,
      cachedAt: new Date(entry.timestamp).toISOString()
    });
  });

  // Sort by most recent first
  scanHistory.sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));

  res.status(200).json({
    success: true,
    count: scanHistory.length,
    data: scanHistory.slice(0, 50) // Limit to 50 most recent
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


