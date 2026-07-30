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
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// Get dashboard overview
exports.getDashboardOverview = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || req.user.organizationId;

  const orgId = new mongoose.Types.ObjectId(organizationId);

  try {
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
      yaraRuleCount
    ] = await Promise.all([
      User.countDocuments({ organization: orgId }),
      Organization.countDocuments({ _id: orgId }),
      Team.countDocuments({ organization: orgId }),
      Asset.countDocuments({ organization: orgId }),
      Alert.countDocuments({ organization: orgId }),
      Incident.countDocuments({ organization: orgId }),
      Case.countDocuments({ organization: orgId }),
      ThreatIntelligence.countDocuments({}), // Global threat intel
      IOC.countDocuments({}), // Global IOCs
      Vulnerability.countDocuments({}), // Global vulnerabilities
      YaraRule.countDocuments({}) // Global YARA rules
    ]);

    // Get recent activity
    const [
      recentAlerts,
      recentIncidents,
      recentCases
    ] = await Promise.all([
      Alert.find({ organization: orgId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedTo', 'firstName lastName'),
      Incident.find({ organization: orgId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedTo', 'firstName lastName'),
      Case.find({ organization: orgId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('leadInvestigator', 'firstName lastName')
    ]);

    // Get top threats (based on alerts)
    const topThreats = await Alert.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$alertType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get severity distribution
    const severityDistribution = await Alert.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Get status distribution for incidents
    const incidentStatusDistribution = await Incident.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get asset type distribution
    const assetTypeDistribution = await Asset.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$assetType', count: { $sum: 1 } } }
    ]);

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
          yaraRules: yaraRuleCount
        },
        recentActivity: {
          alerts: recentAlerts,
          incidents: recentIncidents,
          cases: recentCases
        },
        analytics: {
          topThreats: Object.fromEntries(topThreats.map(item => [item._id, item.count])),
          severityDistribution: Object.fromEntries(severityDistribution.map(item => [item._id, item.count])),
          incidentStatusDistribution: Object.fromEntries(incidentStatusDistribution.map(item => [item._id, item.count])),
          assetTypeDistribution: Object.fromEntries(assetTypeDistribution.map(item => [item._id, item.count]))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get attack timeline
exports.getAttackTimeline = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || req.user.organizationId;
  const { days } = req.query;

  let matchConditions = { organization: new mongoose.Types.ObjectId(organizationId) };
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
  const organizationId = req.params.orgId || req.user.organizationId;

  try {
    // Get alerts with geolocation data from IOCs or other sources
    // For simplicity, we'll use alert source and agent geolocation if available
    const alerts = await Alert.find({ organization: organizationId })
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
  const organizationId = req.params.orgId || req.user.organizationId;
  const { days } = req.query;

  let matchConditions = { organization: new mongoose.Types.ObjectId(organizationId) };
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
  const organizationId = req.params.orgId || req.user.organizationId;

  try {
    // Get assets with compliance data
    const assets = await Asset.find({ organization: organizationId })
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