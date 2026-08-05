const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Team = require('../models/Team');
const Asset = require('../models/Asset');
const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const Case = require('../models/Case');
const ThreatIntelligence = require('../models/ThreatIntelligence');
const IOC = require('../models/IOC');
const Vulnerability = require('../models/Vulnerability');
const YaraRule = require('../models/YaraRule');
const ScanRecord = require('../models/ScanRecord');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// Get dashboard overview
exports.getDashboardOverview = asyncHandler(async (req, res, next) => {
  // req.user.organization is the ObjectId stored in the User model
  const organizationId = req.params.orgId || (req.user.organization ? req.user.organization.toString() : null);

  // If no organization is associated with the user, return global counts
  const orgFilter = organizationId ? { organization: new mongoose.Types.ObjectId(organizationId) } : {};
  const orgId = organizationId ? new mongoose.Types.ObjectId(organizationId) : null;

  try {
    // Build org-scoped filter — if user has no organization, query is global
    const orgMatchFilter = orgId ? { organization: orgId } : {};

// Get counts for various entities
const [
      userCount,
      organizationCount,
      teamCount,
      assetCount,
      alertCount,
      incidentCount,
      caseCount,
      threatIntelCount,
      iocCount,
      vulnerabilityCount,
      yaraRuleCount,
      scanCount,
      threatIntelData,
      vulnerabilities
    ] = await Promise.all([
      User.countDocuments(orgId ? { organization: orgId } : {}),
      Organization.countDocuments(orgId ? { _id: orgId } : {}),
      Team.countDocuments(orgId ? { organization: orgId } : {}),
      Asset.countDocuments(orgMatchFilter),
      Alert.countDocuments(orgMatchFilter),
      Incident.countDocuments(orgMatchFilter),
      Case.countDocuments(orgMatchFilter),
      ThreatIntelligence.countDocuments({}), // Global threat intel
      IOC.countDocuments({}), // Global IOCs
      Vulnerability.countDocuments({}), // Global vulnerabilities
      YaraRule.countDocuments({}), // Global YARA rules
      ScanRecord.countDocuments(orgId ? { organization: orgId } : {}), // Scans
      ThreatIntelligence.find({}).sort({ createdAt: -1 }).limit(20).lean(), // threatIntelData
      Vulnerability.find({}).sort({ publishedDate: -1 }).limit(20).lean(), // vulnerabilities
    ]);

    // Get recent activity
    const [
      recentAlerts,
      recentIncidents,
      recentCases,
      recentScans
    ] = await Promise.all([
      Alert.find(orgMatchFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedTo', 'firstName lastName'),
      Incident.find(orgMatchFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedTo', 'firstName lastName'),
      Case.find(orgMatchFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('leadInvestigator', 'firstName lastName'),
      ScanRecord.find(orgId ? { organization: orgId } : {})
        .sort({ scannedAt: -1 })
        .limit(10)
        .lean()
    ]);

    // Get top threats (based on alerts)
    const topThreats = await Alert.aggregate([
      ...(orgId ? [{ $match: { organization: orgId } }] : []),
      { $group: { _id: '$alertType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get severity distribution
    const severityDistribution = await Alert.aggregate([
      ...(orgId ? [{ $match: { organization: orgId } }] : []),
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Get status distribution for incidents
    const incidentStatusDistribution = await Incident.aggregate([
      ...(orgId ? [{ $match: { organization: orgId } }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get asset type distribution
    const assetTypeDistribution = await Asset.aggregate([
      ...(orgId ? [{ $match: { organization: orgId } }] : []),
      { $group: { _id: '$assetType', count: { $sum: 1 } } }
    ]);

    // Calculate severity distribution map
    const severityMap = {};
    severityDistribution.forEach(item => {
      severityMap[item._id] = item.count;
    });

    const total = Object.values(severityMap).reduce((sum, count) => sum + count, 0);
    const critical = severityMap['critical'] || 0;
    const high = severityMap['high'] || 0;
    const medium = severityMap['medium'] || 0;
    const low = severityMap['low'] || 0;
    const info = severityMap['info'] || 0;

    // Security score calculation (0-100, higher is better)
    let securityScore = 100;
    if (total > 0) {
      const weighted = (critical * 3) + (high * 2) + (medium * 1);
      const maxPossible = total * 3;
      const riskRatio = weighted / maxPossible;
      securityScore = Math.round((1 - riskRatio) * 100);
    }

    // Security score label
    let securityLabel = 'Poor';
    if (securityScore >= 90) securityLabel = 'Excellent';
    else if (securityScore >= 70) securityLabel = 'Good';
    else if (securityScore >= 50) securityLabel = 'Fair';

    // Threat level calculation (0-100, higher is worse)
    let threatScore = 0;
    if (total > 0) {
      const weighted = (critical * 3) + (high * 2) + (medium * 1);
      const maxPossible = total * 3;
      const riskRatio = weighted / maxPossible;
      threatScore = Math.round(riskRatio * 100);
    }

    // Threat level
    let threatLevel = 'low';
    if (threatScore < 25) threatLevel = 'low';
    else if (threatScore < 50) threatLevel = 'medium';
    else if (threatScore < 75) threatLevel = 'high';
    else threatLevel = 'critical';

    res.status(200).json({
      success: true,
      data: {
counts: {
          users: userCount,
          organizations: organizationCount,
          teams: teamCount,
          assets: assetCount,
          alerts: alertCount,
          incidents: incidentCount,
          cases: caseCount,
          threatIntelligence: threatIntelCount,
          iocs: iocCount,
          vulnerabilities: vulnerabilityCount,
          yaraRules: yaraRuleCount,
          scans: scanCount
        },
        recentActivity: {
          alerts: recentAlerts,
          incidents: recentIncidents,
          cases: recentCases,
          scans: recentScans
        },
        analytics: {
          topThreats: Object.fromEntries(topThreats.map(item => [item._id, item.count])),
          severityDistribution: Object.fromEntries(severityDistribution.map(item => [item._id, item.count])),
          incidentStatusDistribution: Object.fromEntries(incidentStatusDistribution.map(item => [item._id, item.count])),
          assetTypeDistribution: Object.fromEntries(assetTypeDistribution.map(item => [item._id, item.count]))
        },
// Added fields for frontend consumption
        securityScore: {
          score: securityScore,
          label: securityLabel,
          threatsBlocked: alertCount,
          systemsProtected: assetCount,
          lastUpdated: new Date().toISOString()
        },
        threatLevel: {
          level: threatLevel,
          score: threatScore,
          activeThreats: alertCount,
          blockedAttacks: incidentCount,
          lastUpdated: new Date().toISOString()
        },
        // Dashboard widget fields for frontend
assetOverview: {
          totalAssets: assetCount,
          healthy: Math.max(0, assetCount - (severityMap.critical || 0) - (severityMap.high || 0)),
          warning: severityMap.high || 0,
          critical: severityMap.critical || 0,
          offline: 0,
          averageHealth: assetCount > 0 ? Math.round((1 - (critical + high) / Math.max(assetCount,1)) * 100) : 100,
          riskScore: threatScore
        },
        incidentSummary: {
          total: incidentCount,
          critical: severityMap.critical || 0,
          high: severityMap.high || 0,
          medium: severityMap.medium || 0,
          low: severityMap.low || 0,
          investigating: 0,
          resolvedToday: 0
        },
        recentAlerts: recentAlerts.map(a => ({
          id: String(a._id),
          title: a.title || 'Untitled Alert',
          severity: String(a.severity || 'info').toLowerCase(),
          source: a.source || 'Unknown',
          createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
        })),
        recentScans: recentScans.map(s => ({
          id: String(s._id),
          target: s.value || 'Unknown',
          type: s.scanType === 'domain' ? 'url' : s.scanType === 'hash' ? 'hash' : s.scanType || 'file',
          status: s.riskLevel === 'Safe' ? 'safe' : s.riskLevel === 'Low' ? 'safe' : s.riskLevel === 'Medium' ? 'suspicious' : 'malicious',
          riskScore: s.overallThreatScore || 0,
          createdAt: s.scannedAt ? s.scannedAt.toISOString() : new Date().toISOString()
        })),
        aiInsights: {
          predictedRisk: threatLevel,
          confidence: threatScore > 0 ? Math.min(95, 40 + threatScore * 0.5) : 50,
          recommendations: [
            critical > 0 ? `Address ${critical} critical alerts immediately` : null,
            high > 0 ? `Review ${high} high-severity alerts` : null,
            'Continue regular monitoring and threat hunting',
            'Update security controls and review policies'
          ].filter(Boolean),
          newThreatsDetected: alertCount,
          potentialImpact: threatLevel === 'critical' ? 'Critical infrastructure at risk' : threatLevel === 'high' ? 'High risk to operations' : 'Manageable risk level',
          modelStatus: 'online',
          summary: `Security posture is ${securityLabel.toLowerCase()} with ${threatLevel} threat level. ${alertCount} alerts active across ${assetCount} assets.`
        },
threatFeed: [
          ...threatIntelData.map(t => ({
            id: String(t._id),
            title: t.title || 'Unknown Threat',
            description: t.description?.substring(0, 200) || '',
            type: t.threatType || 'intel',
            severity: (t.severity || 'medium').toLowerCase(),
            source: t.sources?.[0]?.type || 'Threat Intelligence',
            timestamp: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
            status: t.isActive ? 'Active' : 'Inactive',
            tags: t.tags || [],
          })),
          ...recentAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').map(a => ({
            id: String(a._id),
            title: a.title || 'Alert',
            description: a.description?.substring(0, 200) || '',
            type: a.alertType || 'alert',
            severity: String(a.severity || 'medium').toLowerCase(),
            source: a.source || 'Alert System',
            timestamp: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
            status: a.status || 'Open',
          })),
        ].slice(0, 20),
        threatChart: [
          ...Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const datestr = d.toISOString().split('T')[0];
            const dayScans = recentScans.filter(s => {
              const sd = new Date(s.scannedAt).toISOString().split('T')[0];
              return sd === datestr;
            });
            return {
              timestamp: datestr,
              value: dayScans.length,
severity: dayScans.some(s => String(s.riskLevel) === 'Critical' || String(s.riskLevel) === 'High') ? 'high' : 'low',
            };
          }),
        ],
        vulnerabilities: vulnerabilities.map(v => ({
          id: String(v._id),
          title: v.title || v.cveId || 'Unknown Vulnerability',
          cve: v.cveId || v.cve,
          severity: (v.severity || 'medium').toLowerCase(),
          cvssScore: v.cvssScore || 0,
          affectedAssets: v.affectedAssets || 0,
          status: v.status || 'open',
          publishedAt: v.publishedDate ? v.publishedDate.toISOString() : v.publishedAt || '',
          lastUpdated: v.modifiedDate ? v.modifiedDate.toISOString() : v.modifiedAt || '',
          description: v.description?.substring(0, 300) || '',
        })),
      }
    });
  } catch (error) {
  next(error);
}
});

// Get attack timeline
exports.getAttackTimeline = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || (req.user.organization ? req.user.organization.toString() : null);
  const { days } = req.query;

  let matchConditions = organizationId ? { organization: new mongoose.Types.ObjectId(organizationId) } : {};
  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    matchConditions.createdAt = { $gte: startDate };
  }

  try {
    // Get incidents with timeline data
    const incidents = await Incident.find(matchConditions)
      .select('title incidentType severity createdAt timeline')
      .sort({ createdAt: -1 });

    // Get alerts with timestamps
    const alerts = await Alert.find(matchConditions)
      .select('title alertType severity sourceTimestamp receivedAt')
      .sort({ sourceTimestamp: -1 });

    // Combine and sort by timestamp
    const timelineEvents = [];

    incidents.forEach(incident => {
      timelineEvents.push({
        id: incident._id,
        type: 'incident',
        title: incident.title,
        subtype: incident.incidentType,
        severity: incident.severity,
        timestamp: incident.createdAt,
        description: `Incident: ${incident.title}`
      });

      // Add timeline events if available
      if (incident.timeline && incident.timeline.length > 0) {
        incident.timeline.forEach(event => {
      timelineEvents.push({
        id: new mongoose.Types.ObjectId().toString(), // Temporary ID
            type: 'incident-event',
            title: incident.title,
            subtype: event.event,
            severity: incident.severity,
            timestamp: event.timestamp,
            description: event.description
          });
        });
      }
    });

    alerts.forEach(alert => {
      timelineEvents.push({
        id: alert._id,
        type: 'alert',
        title: alert.title,
        subtype: alert.alertType,
        severity: alert.severity,
        timestamp: alert.sourceTimestamp,
        description: `Alert from ${alert.source}: ${alert.title}`
      });
    });

    // Sort by timestamp descending
    timelineEvents.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({
      success: true,
      data: timelineEvents.slice(0, 50) // Limit to 50 events
    });
  } catch (error) {
  next(error);
}
});

// Get threat map data (geographical distribution)
exports.getThreatMap = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || (req.user.organization ? req.user.organization.toString() : null);
  const orgFilter = organizationId ? { organization: organizationId } : {};

  try {
    // Get alerts with geolocation data from IOCs or other sources
    const alerts = await Alert.find(orgFilter)
      .select('source sourceName sourceTimestamp severity alertType');

    // In a real implementation, you'd geolocate IPs, domains, etc.
    // For now, we'll return mock data or empty array
    res.status(200).json({
      success: true,
      data: [] // Would contain geographical threat data
    });
  } catch (error) {
  next(error);
}
});

// Get risk score trend
exports.getRiskScoreTrend = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || (req.user.organization ? req.user.organization.toString() : null);
  const { days } = req.query;

  let matchConditions = organizationId ? { organization: new mongoose.Types.ObjectId(organizationId) } : {};
  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    matchConditions.createdAt = { $gte: startDate };
  }

  try {
    // Get incidents with risk scores from AI analysis
    const incidents = await Incident.find(matchConditions)
      .select('aiAnalysis.riskScore createdAt')
      .sort({ createdAt: 1 });

    // Get alerts with risk scores from AI analysis
    const alerts = await Alert.find(matchConditions)
      .select('aiAnalysis.riskScore createdAt')
      .sort({ createdAt: 1 });

    // Combine and calculate daily average risk scores
    const riskData = {};

    incidents.forEach(incident => {
      if (incident.aiAnalysis && incident.aiAnalysis.riskScore !== undefined) {
        const dateStr = incident.createdAt.toISOString().split('T')[0];
        if (!riskData[dateStr]) {
          riskData[dateStr] = { scores: [], count: 0 };
        }
        riskData[dateStr].scores.push(incident.aiAnalysis.riskScore);
        riskData[dateStr].count++;
      }
    });

    alerts.forEach(alert => {
      if (alert.aiAnalysis && alert.aiAnalysis.riskScore !== undefined) {
        const dateStr = alert.createdAt.toISOString().split('T')[0];
        if (!riskData[dateStr]) {
          riskData[dateStr] = { scores: [], count: 0 };
        }
        riskData[dateStr].scores.push(alert.aiAnalysis.riskScore);
        riskData[dateStr].count++;
      }
    });

    // Calculate averages
    const trendData = Object.keys(riskData).map(date => ({
      date,
      averageRiskScore: riskData[date].scores.reduce((a, b) => a + b, 0) / riskData[date].scores.length,
      eventCount: riskData[date].count
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: trendData
    });
  } catch (error) {
  next(error);
}
});

// Get compliance status
exports.getComplianceStatus = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || (req.user.organization ? req.user.organization.toString() : null);
  const orgFilter = organizationId ? { organization: organizationId } : {};

  try {
    // Get assets with compliance data
    const assets = await Asset.find(orgFilter)
      .select('compliance');

    // Calculate compliance statistics
    const complianceStats = {
      total: assets.length,
      compliant: 0,
      nonCompliant: 0,
      partial: 0,
      notAssessed: 0,
      byFramework: {}
    };

    assets.forEach(asset => {
      if (asset.compliance && asset.compliance.status) {
        switch (asset.compliance.status) {
          case 'compliant':
            complianceStats.compliant++;
            break;
          case 'non-compliant':
            complianceStats.nonCompliant++;
            break;
          case 'partial':
            complianceStats.partial++;
            break;
          case 'not-assessed':
            complianceStats.notAssessed++;
            break;
        }

        // Count by framework
        if (asset.compliance.frameworks && Array.isArray(asset.compliance.frameworks)) {
          asset.compliance.frameworks.forEach(framework => {
            if (!complianceStats.byFramework[framework]) {
              complianceStats.byFramework[framework] = { compliant: 0, total: 0 };
            }
            complianceStats.byFramework[framework].total++;
            if (asset.compliance.status === 'compliant') {
              complianceStats.byFramework[framework].compliant++;
            }
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      data: complianceStats
    });
  } catch (error) {
  next(error);
}
});