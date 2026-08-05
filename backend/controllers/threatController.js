const ThreatIntelligence = require('../models/ThreatIntelligence');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const IOC = require('../models/IOC');
const Vulnerability = require('../models/Vulnerability');
const YaraRule = require('../models/YaraRule');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// ─── Country / coordinate resolution helpers ─────────────────────────────────

// Map a country name/code to [longitude, latitude] using a small fallback table.
// If unknown, returns null so the frontend never renders a fake location.
const COUNTRY_COORDS = {
  'united states': [-95.7, 37.1], 'united-states': [-95.7, 37.1], 'us': [-95.7, 37.1], 'usa': [-95.7, 37.1],
  'china': [104.2, 35.9], 'cn': [104.2, 35.9],
  'russia': [105.3, 61.5], 'ru': [105.3, 61.5],
  'germany': [10.45, 51.16], 'de': [10.45, 51.16],
  'united kingdom': [-3.44, 55.38], 'uk': [-3.44, 55.38], 'gb': [-3.44, 55.38],
  'france': [2.21, 46.6], 'fr': [2.21, 46.6],
  'india': [78.96, 20.59], 'in': [78.96, 20.59],
  'brazil': [-51.93, -14.24], 'br': [-51.93, -14.24],
  'japan': [138.25, 36.2], 'jp': [138.25, 36.2],
  'canada': [-106.35, 56.13], 'ca': [-106.35, 56.13],
  'australia': [133.78, -25.27], 'au': [133.78, -25.27],
  'netherlands': [5.29, 52.13], 'nl': [5.29, 52.13],
  'singapore': [103.82, 1.35], 'sg': [103.82, 1.35],
  'south korea': [127.77, 36.5], 'korea-south': [127.77, 36.5], 'kr': [127.77, 36.5],
  'iran': [53.69, 32.43], 'ir': [53.69, 32.43],
  'north korea': [127.51, 40.34], 'korea-north': [127.51, 40.34], 'kp': [127.51, 40.34],
  'ukraine': [31.17, 48.38], 'ua': [31.17, 48.38],
  'poland': [19.15, 51.92], 'pl': [19.15, 51.92],
  'sweden': [18.64, 60.13], 'se': [18.64, 60.13],
  'italy': [12.57, 41.87], 'it': [12.57, 41.87],
  'spain': [-3.75, 40.46], 'es': [-3.75, 40.46],
  'mexico': [-102.55, 23.63], 'mx': [-102.55, 23.63],
  'indonesia': [113.92, -0.79], 'id': [113.92, -0.79],
  'turkey': [35.24, 38.96], 'tr': [35.24, 38.96],
  'south africa': [24.99, -28.53], 'za': [24.99, -28.53],
  'egypt': [30.8, 26.82], 'eg': [30.8, 26.82],
  'israel': [34.85, 31.05], 'il': [34.85, 31.05],
  'saudi arabia': [45.08, 23.89], 'sa': [45.08, 23.89],
  'united arab emirates': [53.85, 23.42], 'ae': [53.85, 23.42],
  'vietnam': [108.28, 14.06], 'vn': [108.28, 14.06],
  'thailand': [100.99, 15.87], 'th': [100.99, 15.87],
  'taiwan': [120.96, 23.7], 'tw': [120.96, 23.7],
  'hong kong': [114.17, 22.32], 'hk': [114.17, 22.32],
  'pakistan': [69.35, 30.38], 'pk': [69.35, 30.38],
  'nigeria': [8.68, 9.08], 'ng': [8.68, 9.08],
  'argentina': [-63.62, -38.42], 'ar': [-63.62, -38.42],
  'switzerland': [8.23, 46.82], 'ch': [8.23, 46.82],
  'belgium': [4.47, 50.5], 'be': [4.47, 50.5],
  'austria': [14.55, 47.52], 'at': [14.55, 47.52],
  'ireland': [-8.24, 53.41], 'ie': [-8.24, 53.41],
  'norway': [8.47, 60.47], 'no': [8.47, 60.47],
  'finland': [25.75, 61.92], 'fi': [25.75, 61.92],
  'denmark': [9.5, 56.26], 'dk': [9.5, 56.26],
  'czech republic': [15.47, 49.82], 'cz': [15.47, 49.82],
  'romania': [24.97, 45.94], 'ro': [24.97, 45.94],
  'greece': [21.82, 39.07], 'gr': [21.82, 39.07],
  'portugal': [-8.22, 39.4], 'pt': [-8.22, 39.4],
  'new zealand': [172.83, -40.9], 'nz': [172.83, -40.9],
  'malaysia': [101.98, 4.21], 'my': [101.98, 4.21],
  'philippines': [121.77, 12.88], 'ph': [121.77, 12.88],
  'bangladesh': [90.36, 23.68], 'bd': [90.36, 23.68],
  'kazakhstan': [66.92, 48.02], 'kz': [66.92, 48.02],
  'belarus': [27.95, 53.71], 'by': [27.95, 53.71],
  'lithuania': [23.88, 55.17], 'lt': [23.88, 55.17],
  'latvia': [24.6, 56.88], 'lv': [24.6, 56.88],
  'estonia': [25.01, 58.6], 'ee': [25.01, 58.6],
  'bulgaria': [25.49, 42.73], 'bg': [25.49, 42.73],
  'croatia': [15.2, 45.1], 'hr': [15.2, 45.1],
  'serbia': [21.01, 44.02], 'rs': [21.01, 44.02],
  'slovakia': [19.7, 48.67], 'sk': [19.7, 48.67],
  'slovenia': [14.99, 46.15], 'si': [14.99, 46.15],
  'hungary': [19.5, 47.16], 'hu': [19.5, 47.16],
  'luxembourg': [6.13, 49.82], 'lu': [6.13, 49.82],
  'iceland': [-19.02, 64.96], 'is': [-19.02, 64.96],
  'colombia': [-74.3, 4.57], 'co': [-74.3, 4.57],
  'chile': [-71.54, -35.68], 'cl': [-71.54, -35.68],
  'peru': [-75.02, -9.19], 'pe': [-75.02, -9.19],
  'venezuela': [-66.59, 6.42], 've': [-66.59, 6.42],
  'morocco': [-7.09, 31.79], 'ma': [-7.09, 31.79],
  'algeria': [2.63, 28.03], 'dz': [2.63, 28.03],
  'kenya': [37.91, -0.02], 'ke': [37.91, -0.02],
  'ethiopia': [39.62, 9.15], 'et': [39.62, 9.15],
  'ghana': [-1.02, 7.95], 'gh': [-1.02, 7.95],
  'unknown': null,
};

function normalizeCountry(value) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  const lower = v.toLowerCase();
  return COUNTRY_COORDS[lower] ? { name: v, coords: COUNTRY_COORDS[lower] } : null;
}

// Extract country + coordinates from a scan record's sources (ipinfo/shodan/abuseipdb).
function extractScanGeo(scan) {
  const src = scan.sources || {};
  const ipinfo = src.ipinfo || {};
  const shodan = src.shodan || {};
  const abuseipdb = src.abuseipdb || {};

  const countryVal =
    scan.country ||
    ipinfo.country ||
    ipinfo.countryName ||
    shodan.country_name ||
    shodan.country ||
    abuseipdb.countryName ||
    abuseipdb.country ||
    '';

  const resolved = normalizeCountry(countryVal);
  if (!resolved) return null;

  // Prefer explicit coords from the source, else fall back to the country table.
  const lat = Number(ipinfo.latitude || ipinfo.lat || shodan.latitude || 0);
  const lon = Number(ipinfo.longitude || ipinfo.lon || shodan.longitude || 0);
  const coords =
    Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0
      ? [lon, lat]
      : resolved.coords;

  return { country: resolved.name, coordinates: coords };
}

// ─── Public aggregated summary ────────────────────────────────────────────────

/**
 * @desc    Get aggregated threat intelligence summary (PUBLIC, read-only)
 * @route   GET /api/threats/summary
 * @access  Public
 *
 * Aggregates persisted data from ScanRecord, ThreatIntelligence, Vulnerability
 * (CVE), IOC and Alerts into the dashboard shape consumed by the Threat
 * Intelligence Center frontend. Never fabricates values.
 */
exports.getThreatIntelligenceSummary = asyncHandler(async (req, res) => {
  const [
    threats,
    vulnerabilities,
    iocs,
    scanRecords,
    alerts
  ] = await Promise.all([
    ThreatIntelligence.find({}).sort({ createdAt: -1 }).limit(100).lean(),
    Vulnerability.find({}).sort({ publishedDate: -1 }).limit(50).lean(),
    IOC.find({}).sort({ firstSeen: -1 }).limit(100).lean(),
    mongoose.model('ScanRecord').find({}).sort({ scannedAt: -1 }).limit(100).lean().catch(() => []),
    mongoose.model('Alert').find({}).sort({ createdAt: -1 }).limit(50).lean().catch(() => []),
  ]);

  // ── Feed: combine threat intel + scan records + alerts ────────────────────
  const feed = [];

  // Threat intelligence entries
  threats.forEach(t => {
    const geo = extractScanGeo({ sources: t.sources }) || null;
    feed.push({
      id: t._id?.toString(),
      title: t.title || t.name || 'Threat Intelligence',
      description: t.description?.substring(0, 200) || '',
      type: t.threatType || 'intel',
      severity: (t.severity || 'medium').toLowerCase(),
      source: t.sources?.[0]?.type || 'Threat Intelligence',
      country: geo ? geo.country : undefined,
      coordinates: geo ? geo.coordinates : undefined,
      timestamp: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
      status: t.isActive ? 'Active' : 'Inactive',
      tags: t.tags || [],
    });
  });

  // Scan records → feed items (IPs, URLs, domains, hashes)
  scanRecords.forEach(s => {
    const geo = extractScanGeo(s);
    const type = s.scanType === 'domain' ? 'domain'
      : s.scanType === 'url' ? 'url'
      : s.scanType === 'hash' ? 'hash'
      : s.scanType === 'file' ? 'file'
      : 'ip';
    const threatScore = s.overallThreatScore || 0;
    feed.push({
      id: s._id?.toString(),
      title: s.value || 'Scan result',
      description: `${type} scan: ${s.riskLevel || 'Safe'} (${threatScore}/100)`,
      type,
      severity: threatScore >= 80 ? 'critical' : threatScore >= 60 ? 'high' : threatScore >= 40 ? 'medium' : 'low',
      source: 'Scan Engine',
      country: geo ? geo.country : undefined,
      coordinates: geo ? geo.coordinates : undefined,
      timestamp: s.scannedAt ? s.scannedAt.toISOString() : s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
      status: s.riskLevel === 'Safe' || s.riskLevel === 'Low' ? 'Clean' : s.riskLevel === 'Medium' ? 'Suspicious' : 'Malicious',
      tags: [],
    });
  });

  // High-severity alerts → feed items
  alerts
    .filter(a => ['critical', 'high', 'medium'].includes(String(a.severity || '').toLowerCase()))
    .forEach(a => {
      feed.push({
        id: a._id?.toString(),
        title: a.title || 'Alert',
        description: a.description?.substring(0, 200) || '',
        type: a.alertType || 'alert',
        severity: String(a.severity || 'medium').toLowerCase(),
        source: a.source || 'Alert System',
        country: undefined,
        coordinates: undefined,
        timestamp: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
        status: a.status || 'Open',
        tags: [],
      });
    });

  // Sort feed by timestamp desc, cap at 100
  feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const feedFinal = feed.slice(0, 100);

  // ── CVEs from vulnerabilities ──────────────────────────────────────────────
  const cves = vulnerabilities
    .filter(v => v.cveId || v.cve)
    .map(v => ({
      id: v.cveId || v.cve || v._id?.toString(),
      cveId: v.cveId || v.cve,
      description: v.description,
      cvssScore: v.cvssScore || 0,
      severity: (v.severity || 'medium').toLowerCase(),
      publishedAt: v.publishedDate ? v.publishedDate.toISOString() : v.publishedAt || '',
    }));

  const criticalCVEs = cves.filter(c => String(c.severity).toLowerCase() === 'critical').length;

  // ── Malware families from threat intel + scan records ─────────────────────
  const malwareFamilies = threats
    .filter(t => t.threatType === 'malware' || t.threatType === 'ransomware' || t.threatType === 'trojan' || t.threatType === 'botnet' || (t.malwareFamilies && t.malwareFamilies.length))
    .map(t => ({
      id: t._id?.toString(),
      name: (t.malwareFamilies && t.malwareFamilies[0] && t.malwareFamilies[0].name) || t.title || 'Unknown',
      category: t.threatType,
      severity: (t.severity || 'medium').toLowerCase(),
      detectionCount: t.indicators?.length || 0,
      firstSeen: t.createdAt ? t.createdAt.toISOString() : '',
      lastSeen: t.updatedAt ? t.updatedAt.toISOString() : t.createdAt ? t.createdAt.toISOString() : '',
    }));

  // ── APT groups from threat intel ──────────────────────────────────────────
  const aptGroups = threats
    .filter(t => t.threatType === 'apt' || t.threatType === 'apt-group' || t.threatType === 'threat-actor' || (t.threatActor && t.threatActor.name))
    .map(t => ({
      id: t._id?.toString(),
      name: t.threatActor?.name || t.title || 'Unknown',
      origin: t.threatActor?.origin || t.attribution?.country?.[0] || '',
      motivation: t.threatActor?.motivation || '',
      sophistication: t.threatActor?.sophistication || '',
      activeSince: t.createdAt ? t.createdAt.toISOString() : '',
      lastSeen: t.updatedAt ? t.updatedAt.toISOString() : t.createdAt ? t.createdAt.toISOString() : '',
      targets: t.indicators ? t.indicators.map(i => i.value).filter(Boolean).slice(0, 10) : [],
      tools: t.toolkits ? t.toolkits.map(tk => tk.name).filter(Boolean) : [],
      severity: (t.severity || 'high').toLowerCase(),
      status: 'Monitoring',
      techniques: [],
    }));

  // ── IOCs from the IOC collection ──────────────────────────────────────────
  const iocItems = iocs.map(i => ({
    id: i._id?.toString(),
    value: i.value,
    type: i.type,
    severity: (i.severity || 'medium').toLowerCase(),
    country: i.geolocation?.country ? normalizeCountry(i.geolocation.country)?.name : undefined,
    coordinates: i.geolocation?.latitude && i.geolocation?.longitude
      ? [i.geolocation.longitude, i.geolocation.latitude]
      : i.geolocation?.country ? normalizeCountry(i.geolocation.country)?.coords : undefined,
    firstSeen: i.firstSeen ? i.firstSeen.toISOString() : '',
    lastSeen: i.lastSeen ? i.lastSeen.toISOString() : '',
    source: i.sourceName || 'IOC Feed',
  }));

  // ── Trend from scan records aggregated by date ────────────────────────────
  const trendMap = {};
  scanRecords.forEach(r => {
    const date = r.scannedAt ? new Date(r.scannedAt).toISOString().split('T')[0] : 'unknown';
    if (!trendMap[date]) trendMap[date] = { threats: 0, total: 0 };
    trendMap[date].total++;
    if (r.riskLevel === 'High' || r.riskLevel === 'Critical') trendMap[date].threats++;
  });
  const trend = Object.entries(trendMap)
    .map(([date, data]) => ({
      timestamp: date,
      value: data.threats,
      total: data.total,
      severity: data.threats > 0 ? 'high' : 'low',
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // ── Signal-collecting helpers for stats ───────────────────────────────────
  const threatCount = threats.length;
  const scanCount = scanRecords.length;
  const iocCount = iocs.length;
  const alertCount = alerts.length;
  const maliciousScans = scanRecords.filter(r =>
    ['High', 'Critical', 'Medium'].includes(r.riskLevel)
  ).length;

  const blockedThreats = alerts.filter(a =>
    String(a.status).toLowerCase() === 'resolved' ||
    String(a.status).toLowerCase() === 'suppressed'
  ).length;

  res.status(200).json({
    success: true,
    data: {
      feed: feedFinal,
      stats: {
        activeThreats: threatCount + scanCount + alertCount,
        blockedThreats: blockedThreats || 0,
        newIndicators: iocCount + scanCount,
        criticalCVEs: criticalCVEs || 0,
        malwareFamilies: malwareFamilies.length || 0,
        aptGroups: aptGroups.length || 0,
        totalIOCs: iocCount,
        totalScans: scanCount,
        maliciousScans,
      },
      malware: malwareFamilies,
      cves,
      trend,
      aptGroups,
      iocs: iocItems,
      threatLocations: feedFinal.filter(f => f.country && f.coordinates).length,
    }
  });
});

// Get all threat intelligence with real data from MongoDB collections
exports.getThreatIntelligence = asyncHandler(async (req, res) => {
  const threats = await ThreatIntelligence.find()
    .sort({ createdAt: -1 });

  // Fetch real data from MongoDB collections instead of hardcoded empty arrays
  const [
    vulnerabilities,
    iocs,
    scanRecords,
    alerts,
    incidents
  ] = await Promise.all([
    Vulnerability.find({}).sort({ publishedDate: -1 }).limit(20).lean(),
    IOC.find({}).sort({ firstSeen: -1 }).limit(20).lean(),
    mongoose.model('ScanRecord').find({}).sort({ scannedAt: -1 }).limit(50).lean().catch(() => []),
    mongoose.model('Alert').find({}).sort({ createdAt: -1 }).limit(20).lean().catch(() => []),
    mongoose.model('Incident').find({}).sort({ createdAt: -1 }).limit(20).lean().catch(() => []),
  ]);

  // Build CVEs from vulnerabilities
  const cves = vulnerabilities
    .filter(v => v.cveId || v.cve)
    .map(v => ({
      id: v.cveId || v.cve || v._id?.toString(),
      cveId: v.cveId || v.cve,
      description: v.description,
      cvssScore: v.cvssScore || 0,
      severity: v.severity || 'medium',
      publishedAt: v.publishedDate || v.publishedAt,
      modifiedAt: v.modifiedDate || v.modifiedAt,
    }));

  // Count critical CVEs
  const criticalCVEs = cves.filter(c => String(c.severity).toLowerCase() === 'critical').length;

  // Build malware families from threat intel + scan results
  const malwareFamilies = threats
    .filter(t => t.threatType === 'malware' || t.malwareFamilies?.length)
    .map(t => ({
      id: t._id?.toString(),
      name: t.title || t.name || 'Unknown',
      category: t.threatType,
      severity: t.severity || 'medium',
      detectionCount: t.indicators?.length || 0,
      firstSeen: t.createdAt,
      lastSeen: t.updatedAt || t.createdAt,
    }));

  // Build APT groups from threat intel
  const aptGroups = threats
    .filter(t => t.threatType === 'apt' || t.threatActor?.name)
    .map(t => ({
      id: t._id?.toString(),
      name: t.threatActor?.name || t.title || 'Unknown',
      origin: t.threatActor?.origin || '',
      motivation: t.threatActor?.motivation || '',
      sophistication: t.threatActor?.sophistication || '',
      activeSince: t.createdAt,
      lastSeen: t.updatedAt || t.createdAt,
      targets: t.indicators?.map(i => i.value) || [],
      tools: t.toolkits || [],
      severity: t.severity || 'high',
      status: 'Monitoring',
    }));

// Build trend from scan records aggregated by date
  const trendMap = {};
  scanRecords.forEach(r => {
    const date = r.scannedAt ? new Date(r.scannedAt).toISOString().split('T')[0] : 'unknown';
    if (!trendMap[date]) trendMap[date] = { threats: 0, total: 0 };
    trendMap[date].total++;
    if (r.riskLevel === 'High' || r.riskLevel === 'Critical') {
      trendMap[date].threats++;
    }
  });
  const trend = Object.entries(trendMap)
    .map(([date, data]) => ({
      timestamp: date,
      value: data.threats,
      total: data.total,
      severity: data.threats > 0 ? 'high' : 'low',
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Build blocked threats count from alerts
  const blockedThreats = alerts.filter(a =>
    String(a.status).toLowerCase() === 'resolved' ||
    String(a.status).toLowerCase() === 'suppressed'
  ).length;

// Build feed items with country/coordinates from threat intel documents
  const intelFeed = threats.map(t => {
    // Try to derive country from IOC geolocation entries
    let country = t.attribution?.country?.[0] || '';
    let coordinates;
    const geoIndicator = (t.indicators || []).find(i => i.geolocation || i.country);
    if (geoIndicator) {
      country = country || geoIndicator.country || geoIndicator.geolocation?.country || '';
      const lat = Number(geoIndicator.geolocation?.latitude ?? geoIndicator.latitude) || 0;
      const lon = Number(geoIndicator.geolocation?.longitude ?? geoIndicator.longitude) || 0;
      if (lat && lon) coordinates = [lon, lat];
    }
    return {
      id: t._id?.toString(),
      title: t.title || 'Unknown Threat',
      description: t.description?.substring(0, 200) || '',
      type: t.threatType || 'intel',
      severity: (t.severity || 'medium').toLowerCase(),
      source: t.sources?.[0]?.type || 'Threat Intelligence',
      country,
      coordinates,
      timestamp: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
      status: t.isActive ? 'Active' : 'Inactive',
      tags: t.tags || [],
    };
  });

  // Build feed items from scan records so geolocation data flows to the map
  const scanFeed = scanRecords.map(r => {
    const ipinfo = (r.sources && r.sources.ipinfo) || {};
    const shodan = (r.sources && r.sources.shodan) || {};
    const country = ipinfo.country || shodan.country || '';
    const lat = Number(ipinfo.latitude ?? ipinfo.lat) || Number(shodan.latitude) || 0;
    const lon = Number(ipinfo.longitude ?? ipinfo.lon) || Number(shodan.longitude) || 0;

    return {
      id: r._id?.toString(),
      title: `${r.riskLevel} - ${r.scanType} ${r.value}`,
      description: `${r.scanType} scan of ${r.value} with risk level ${r.riskLevel}`,
      type: r.scanType || 'scan',
      severity: (r.riskLevel || 'safe').toLowerCase(),
      source: 'SentinelX Scan',
      country,
      coordinates: (lat && lon) ? [lon, lat] : undefined,
      timestamp: r.scannedAt ? r.scannedAt.toISOString() : new Date().toISOString(),
      status: r.riskLevel || 'Safe',
      tags: [r.scanType, r.riskLevel].filter(Boolean),
    };
  });

  // Combine: threat intel first, then scan-derived items
  const feed = [...intelFeed, ...scanFeed];

  // Count active threats from both threat intel and high/critical scan records
  const activeThreats = threats.length + scanRecords.filter(r =>
    ['High', 'Critical'].includes(r.riskLevel)
  ).length;

  res.status(200).json({
    success: true,
    data: {
      feed,

      stats: {
        activeThreats: activeThreats || 0,
        blockedThreats: blockedThreats || 0,
        newIndicators: iocs.length || scanRecords.length || threats.length,
        criticalCVEs: criticalCVEs || 0,
        malwareFamilies: malwareFamilies.length || 0,
        aptGroups: aptGroups.length || 0,
      },

      malware: malwareFamilies,
      cves: cves,
      trend: trend,
      aptGroups: aptGroups,
    }
  });
});

// Get single threat intelligence
exports.getThreatIntelligenceById = asyncHandler(async (req, res, next) => {
  const threatIntel = await ThreatIntelligence.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  if (!threatIntel) {
    return next(new ErrorResponse(`Threat intelligence not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: threatIntel
  });
});

// Create threat intelligence
exports.createThreatIntelligence = asyncHandler(async (req, res, next) => {
  const {
    title, description, threatType, threatActor, indicators, attribution,
    malwareFamilies, toolkits, campaigns, sources, tags, ttl
  } = req.body;

  // Validate threat actor if provided
  if (threatActor) {
    // In a real implementation, you might validate against a threat actor database
    // For now, we'll just check if it's an object
    if (typeof threatActor !== 'object') {
      return next(new ErrorResponse('Threat actor must be an object', 400));
    }
  }

  // Validate indicators if provided
  if (indicators && indicators.length > 0) {
    // Basic validation - in a real app you'd validate each indicator structure
    for (const indicator of indicators) {
      if (!indicator.type || !indicator.value) {
        return next(new ErrorResponse('Each indicator must have a type and value', 400));
      }
    }
  }

  const threatIntel = await ThreatIntelligence.create({
    title,
    description,
    threatType,
    threatActor: threatActor || {},
    indicators: indicators || [],
    attribution: attribution || {},
    malwareFamilies: malwareFamilies || [],
    toolkits: toolkits || [],
    campaigns: campaigns || [],
    sources: sources || [],
    tags: tags || [],
    ttl: ttl || 30
  });

  res.status(201).json({
    success: true,
    data: threatIntel
  });
});

// Update threat intelligence
exports.updateThreatIntelligence = asyncHandler(async (req, res, next) => {
  let threatIntel = await ThreatIntelligence.findById(req.params.id);

  if (!threatIntel) {
    return next(new ErrorResponse(`Threat intelligence not found with id of ${req.params.id}`, 404));
  }

  // Validate threat actor if being updated
  if (req.body.threatActor) {
    if (typeof req.body.threatActor !== 'object') {
      return next(new ErrorResponse('Threat actor must be an object', 400));
    }
  }

  // Validate indicators if being updated
  if (req.body.indicators && req.body.indicators.length > 0) {
    for (const indicator of req.body.indicators) {
      if (!indicator.type || !indicator.value) {
        return next(new ErrorResponse('Each indicator must have a type and value', 400));
      }
    }
  }

  threatIntel = await ThreatIntelligence.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: threatIntel
  });
});

// Delete threat intelligence
exports.deleteThreatIntelligence = asyncHandler(async (req, res, next) => {
  const threatIntel = await ThreatIntelligence.findById(req.params.id);

  if (!threatIntel) {
    return next(new ErrorResponse(`Threat intelligence not found with id of ${req.params.id}`, 404));
  }

  await threatIntel.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get threat intelligence by organization
exports.getThreatIntelligenceByOrganization = asyncHandler(async (req, res, next) => {
  // In a real implementation, threat intelligence might be shared across organizations
  // For now, we'll return all threat intelligence (as it's often shared)
  const threatIntel = await ThreatIntelligence.find({})
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: threatIntel.length,
    data: threatIntel
  });
});

// Get threat intelligence statistics
exports.getThreatIntelligenceStats = asyncHandler(async (req, res, next) => {
  const [total, byType, bySource] = await Promise.all([
    ThreatIntelligence.countDocuments({}),
    ThreatIntelligence.aggregate([
      { $group: { _id: '$threatType', count: { $sum: 1 } } }
    ]),
    ThreatIntelligence.aggregate([
      { $unwind: '$sources' },
      { $group: { _id: '$sources.type', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      byType: Object.fromEntries(byType.map(item => [item._id, item.count])),
      bySource: Object.fromEntries(bySource.map(item => [item._id, item.count]))
    }
  });
});

// Get IOCs (Indicators of Compromise)
exports.getIOCs = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single IOC
exports.getIOCById = asyncHandler(async (req, res, next) => {
  const ioc = await IOC.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  if (!ioc) {
    return next(new ErrorResponse(`IOC not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: ioc
  });
});

// Create IOC
exports.createIOC = asyncHandler(async (req, res, next) => {
  const {
    value, type, description, confidence, severity, source, sourceName,
    sourceReference, firstSeen, lastSeen, ttl, isActive, tags,
    killChainPhase, mitreAttck, context, geolocation, relatedIoCs,
    falsePositive, falsePositiveReason, whitelisted, whitelistedReason,
    blacklisted, blacklistedReason
  } = req.body;

  // Validate value and type uniqueness
  const existingIOC = await IOC.findOne({ value, type });
  if (existingIOC) {
    return next(new ErrorResponse('An IOC with this value and type already exists', 400));
  }

  const ioc = await IOC.create({
    value,
    type,
    description,
    confidence,
    severity,
    source,
    sourceName,
    sourceReference,
    firstSeen,
    lastSeen,
    ttl,
    isActive,
    tags,
    killChainPhase,
    mitreAttck,
    context,
    geolocation,
    relatedIoCs,
    falsePositive,
    falsePositiveReason,
    whitelisted,
    whitelistedReason,
    blacklisted,
    blacklistedReason
  });

  res.status(201).json({
    success: true,
    data: ioc
  });
});

// Update IOC
exports.updateIOC = asyncHandler(async (req, res, next) => {
  let ioc = await IOC.findById(req.params.id);

  if (!ioc) {
    return next(new ErrorResponse(`IOC not found with id of ${req.params.id}`, 404));
  }

  // Check if value/type combination is being changed to something that already exists
  if (req.body.value || req.body.type) {
    const value = req.body.value || ioc.value;
    const type = req.body.type || ioc.type;

    const existingIOC = await IOC.findOne({ value, type, _id: { $ne: req.params.id } });
    if (existingIOC) {
      return next(new ErrorResponse('An IOC with this value and type already exists', 400));
    }
  }

  ioc = await IOC.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: ioc
  });
});

// Delete IOC
exports.deleteIOC = asyncHandler(async (req, res, next) => {
  const ioc = await IOC.findById(req.params.id);

  if (!ioc) {
    return next(new ErrorResponse(`IOC not found with id of ${req.params.id}`, 404));
  }

  await ioc.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get IOCs by organization (for sightings)
exports.getIOCsByOrganization = asyncHandler(async (req, res, next) => {
  // IOCs are typically global, but we can filter by source or context
  const iocs = await IOC.find({
    $or: [
      { 'context.incidentId': { $exists: true } },
      { 'context.alertId': { $exists: true } },
      { 'context.threatIntelId': { $exists: true } }
    ]
  })
    .sort({ firstSeen: -1 });

  res.status(200).json({
    success: true,
    count: iocs.length,
    data: iocs
  });
});

// Get IOC statistics
exports.getIOCStats = asyncHandler(async (req, res, next) => {
  const [total, byType, byStatus, bySource] = await Promise.all([
    IOC.countDocuments({}),
    IOC.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    IOC.aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } }
    ]),
    IOC.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      byType: Object.fromEntries(byType.map(item => [item._id, item.count])),
      byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count])),
      bySource: Object.fromEntries(bySource.map(item => [item._id, item.count]))
    }
  });
});

// Get vulnerabilities
exports.getVulnerabilities = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single vulnerability
exports.getVulnerabilityById = asyncHandler(async (req, res, next) => {
  const vulnerability = await Vulnerability.findById(req.params.id);

  if (!vulnerability) {
    return next(new ErrorResponse(`Vulnerability not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: vulnerability
  });
});

// Create vulnerability
exports.createVulnerability = asyncHandler(async (req, res, next) => {
  const {
    title, description, cveId, cweId, severity, cvssScore, cvssVector,
    cvssVersion, confidentialityImpact, integrityImpact, availabilityImpact,
    attackVector, attackComplexity, privilegesRequired, userInteraction,
    scope, publishedDate, modifiedDate, references, affectedProducts,
    weakness, problemType, exploits, patches
  } = req.body;

  // Validate CVE ID uniqueness if provided
  if (cveId) {
    const existingVulnerability = await Vulnerability.findOne({ cveId });
    if (existingVulnerability) {
      return next(new ErrorResponse('A vulnerability with this CVE ID already exists', 400));
    }
  }

  const vulnerability = await Vulnerability.create({
    title,
    description,
    cveId,
    cweId,
    severity,
    cvssScore,
    cvssVector,
    cvssVersion,
    confidentialityImpact,
    integrityImpact,
    availabilityImpact,
    attackVector,
    attackComplexity,
    privilegesRequired,
    userInteraction,
    scope,
    publishedDate,
    modifiedDate,
    references,
    affectedProducts,
    weakness,
    problemType,
    exploits,
    patches
  });

  res.status(201).json({
    success: true,
    data: vulnerability
  });
});

// Update vulnerability
exports.updateVulnerability = asyncHandler(async (req, res, next) => {
  let vulnerability = await Vulnerability.findById(req.params.id);

  if (!vulnerability) {
    return next(new ErrorResponse(`Vulnerability not found with id of ${req.params.id}`, 404));
  }

  // Check if CVE ID is being changed to something that already exists
  if (req.body.cveId && req.body.cveId !== vulnerability.cveId) {
    const existingVulnerability = await Vulnerability.findOne({ cveId: req.body.cveId, _id: { $ne: req.params.id } });
    if (existingVulnerability) {
      return next(new ErrorResponse('A vulnerability with this CVE ID already exists', 400));
    }
  }

  vulnerability = await Vulnerability.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: vulnerability
  });
});

// Delete vulnerability
exports.deleteVulnerability = asyncHandler(async (req, res, next) => {
  const vulnerability = await Vulnerability.findById(req.params.id);

  if (!vulnerability) {
    return next(new ErrorResponse(`Vulnerability not found with id of ${req.params.id}`, 404));
  }

  await vulnerability.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get vulnerabilities by severity
exports.getVulnerabilitiesBySeverity = asyncHandler(async (req, res, next) => {
  const vulnerabilities = await Vulnerability.find({ severity: req.params.severity })
    .sort({ publishedDate: -1 });

  res.status(200).json({
    success: true,
    count: vulnerabilities.length,
    data: vulnerabilities
  });
});

// Get vulnerabilities by CVE ID
exports.getVulnerabilityByCVE = asyncHandler(async (req, res, next) => {
  const vulnerability = await Vulnerability.findOne({ cveId: req.params.cveId.toUpperCase() });

  if (!vulnerability) {
    return next(new ErrorResponse(`Vulnerability not found with CVE ID ${req.params.cveId}`, 404));
  }

  res.status(200).json({
    success: true,
    data: vulnerability
  });
});

// Get vulnerability statistics
exports.getVulnerabilityStats = asyncHandler(async (req, res, next) => {
  const [total, bySeverity, byCVSSVersion] = await Promise.all([
    Vulnerability.countDocuments({}),
    Vulnerability.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    Vulnerability.aggregate([
      { $group: { _id: '$cvssVersion', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      bySeverity: Object.fromEntries(bySeverity.map(item => [item._id, item.count])),
      byCVSSVersion: Object.fromEntries(byCVSSVersion.map(item => [item._id, item.count]))
    }
  });
});

// Get YARA rules
exports.getYaraRules = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single YARA rule
exports.getYaraRuleById = asyncHandler(async (req, res, next) => {
  const yaraRule = await YaraRule.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  if (!yaraRule) {
    return next(new ErrorResponse(`YARA rule not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: yaraRule
  });
});

// Create YARA rule
exports.createYaraRule = asyncHandler(async (req, res, next) => {
  const {
    name, description, author, version, reference, date, modified,
    strings, condition, tags, metadata, source, sourceReference,
    fileSize, hash, isActive, isEnabled, severity
  } = req.body;

  // Validate name uniqueness
  const existingYaraRule = await YaraRule.findOne({ name });
  if (existingYaraRule) {
    return next(new ErrorResponse('A YARA rule with this name already exists', 400));
  }

  const yaraRule = await YaraRule.create({
    name,
    description,
    author,
    version,
    reference,
    date,
    modified,
    strings,
    condition,
    tags,
    metadata,
    source,
    sourceReference,
    fileSize,
    hash,
    isActive,
    isEnabled,
    severity
  });

  res.status(201).json({
    success: true,
    data: yaraRule
  });
});

// Update YARA rule
exports.updateYaraRule = asyncHandler(async (req, res, next) => {
  let yaraRule = await YaraRule.findById(req.params.id);

  if (!yaraRule) {
    return next(new ErrorResponse(`YARA rule not found with id of ${req.params.id}`, 404));
  }

  // Check if name is being changed to something that already exists
  if (req.body.name && req.body.name !== yaraRule.name) {
    const existingYaraRule = await YaraRule.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
    if (existingYaraRule) {
      return next(new ErrorResponse('A YARA rule with this name already exists', 400));
    }
  }

  yaraRule = await YaraRule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: yaraRule
  });
});

// Delete YARA rule
exports.deleteYaraRule = asyncHandler(async (req, res, next) => {
  const yaraRule = await YaraRule.findById(req.params.id);

  if (!yaraRule) {
    return next(new ErrorResponse(`YARA rule not found with id of ${req.params.id}`, 404));
  }

  await yaraRule.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get YARA rules by severity
exports.getYaraRulesBySeverity = asyncHandler(async (req, res, next) => {
  const yaraRules = await YaraRule.find({ severity: req.params.severity, isEnabled: true })
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: yaraRules.length,
    data: yaraRules
  });
});

// Get YARA rule statistics
exports.getYaraRuleStats = asyncHandler(async (req, res, next) => {
  const [total, bySource, bySeverity, byStatus] = await Promise.all([
    YaraRule.countDocuments({}),
    YaraRule.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]),
    YaraRule.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    YaraRule.aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      bySource: Object.fromEntries(bySource.map(item => [item._id, item.count])),
      bySeverity: Object.fromEntries(bySeverity.map(item => [item._id, item.count])),
      byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count]))
    }
  });
});