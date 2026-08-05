const ThreatIntelligence = require('../models/ThreatIntelligence');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const IOC = require('../models/IOC');
const Vulnerability = require('../models/Vulnerability');
const YaraRule = require('../models/YaraRule');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

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