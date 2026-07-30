const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const User = require('../models/User');
const Team = require('../models/Team');
const Organization = require('../models/Organization');
const Asset = require('../models/Asset');
const Incident = require('../models/Incident');
const Case = require('../models/Case');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const socketEvents = require('../utils/socketEvents');

// Get all alerts
exports.getAlerts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single alert
exports.getAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findById(req.params.id)
    .populate('organization', 'name industry')
    .populate('assignedTo', 'firstName lastName')
    .populate('assignedTeam', 'name')
    .populate('relatedIncident', 'title status severity')
    .populate('relatedCase', 'title status priority')
    .populate('relatedAsset', 'name hostname ipAddress')
    .populate('relatedUser', 'firstName lastName email');

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: alert
  });
});

// Create alert
exports.createAlert = asyncHandler(async (req, res, next) => {
  const {
    title, description, alertType, severity, priority, organizationId,
    source, sourceId, sourceName, assignedToId, assignedTeamId,
    relatedIncidentId, relatedCaseId, relatedAssetId, relatedUserId,
    tags, sourceTimestamp, indicatorsOfCompromise, mitreAttck, rawLog
  } = req.body;

  // Validate organization exists
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return next(new ErrorResponse(`Organization not found with id of ${organizationId}`, 404));
  }

  // Validate assigned user if provided
  if (assignedToId) {
    const user = await User.findById(assignedToId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${assignedToId}`, 404));
    }
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Assigned user must belong to the same organization', 400));
    }
  }

  // Validate assigned team if provided
  if (assignedTeamId) {
    const team = await Team.findById(assignedTeamId);
    if (!team) {
      return next(new ErrorResponse(`Team not found with id of ${assignedTeamId}`, 404));
    }
    if (team.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Assigned team must belong to the same organization', 400));
    }
  }

  // Validate related incident if provided
  if (relatedIncidentId) {
    const incident = await Incident.findById(relatedIncidentId);
    if (!incident) {
      return next(new ErrorResponse(`Incident not found with id of ${relatedIncidentId}`, 404));
    }
    if (incident.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Related incident must belong to the same organization', 400));
    }
  }

  // Validate related case if provided
  if (relatedCaseId) {
    const caseObj = await Case.findById(relatedCaseId);
    if (!caseObj) {
      return next(new ErrorResponse(`Case not found with id of ${relatedCaseId}`, 404));
    }
    if (caseObj.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Related case must belong to the same organization', 400));
    }
  }

  // Validate related asset if provided
  if (relatedAssetId) {
    const asset = await Asset.findById(relatedAssetId);
    if (!asset) {
      return next(new ErrorResponse(`Asset not found with id of ${relatedAssetId}`, 404));
    }
    if (asset.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Related asset must belong to the same organization', 400));
    }
  }

  // Validate related user if provided
  if (relatedUserId) {
    const user = await User.findById(relatedUserId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${relatedUserId}`, 404));
    }
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Related user must belong to the same organization', 400));
    }
  }

  const alert = await Alert.create({
    title,
    description,
    alertType,
    severity,
    priority,
    organization: organizationId,
    source,
    sourceId,
    sourceName,
    assignedTo: assignedToId || null,
    assignedTeam: assignedTeamId || null,
    relatedIncident: relatedIncidentId || null,
    relatedCase: relatedCaseId || null,
    relatedAsset: relatedAssetId || null,
    relatedUser: relatedUserId || null,
    tags: tags || [],
    sourceTimestamp: sourceTimestamp || new Date(),
    indicatorsOfCompromise: indicatorsOfCompromise || [],
    mitreAttck: mitreAttck || [],
    rawLog: rawLog || ''
  });

  // Emit socket event for new alert
  socketEvents.emitAlertEvent(organizationId, 'alertCreated', alert);

  res.status(201).json({
    success: true,
    data: alert
  });
});

// Update alert
exports.updateAlert = asyncHandler(async (req, res, next) => {
  let alert = await Alert.findById(req.params.id);

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  // Validate organization if being updated
  if (req.body.organizationId) {
    const organization = await Organization.findById(req.body.organizationId);
    if (!organization) {
      return next(new ErrorResponse(`Organization not found with id of ${req.body.organizationId}`, 404));
    }
  }

  // Validate assigned user if being updated
  if (req.body.assignedToId) {
    const user = await User.findById(req.body.assignedToId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.body.assignedToId}`, 404));
    }
    const organizationId = alert.organization.toString();
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Assigned user must belong to the same organization', 400));
    }
  }

  // Validate assigned team if being updated
  if (req.body.assignedTeamId) {
    const team = await Team.findById(req.body.assignedTeamId);
    if (!team) {
      return next(new ErrorResponse(`Team not found with id of ${req.body.assignedTeamId}`, 404));
    }
    const organizationId = alert.organization.toString();
    if (team.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Assigned team must belong to the same organization', 400));
    }
  }

  // Validate related incident if being updated
  if (req.body.relatedIncidentId) {
    const incident = await Incident.findById(req.body.relatedIncidentId);
    if (!incident) {
      return next(new ErrorResponse(`Incident not found with id of ${req.body.relatedIncidentId}`, 404));
    }
    const organizationId = alert.organization.toString();
    if (incident.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Related incident must belong to the same organization', 400));
    }
  }

  // Validate related case if being updated
  if (req.body.relatedCaseId) {
    const caseObj = await Case.findById(req.body.relatedCaseId);
    if (!caseObj) {
      return next(new ErrorResponse(`Case not found with id of ${req.body.relatedCaseId}`, 404));
    }
    const organizationId = alert.organization.toString();
    if (caseObj.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Related case must belong to the same organization', 400));
    }
  }

  // Validate related asset if being updated
  if (req.body.relatedAssetId) {
    const asset = await Asset.findById(req.body.relatedAssetId);
    if (!asset) {
      return next(new ErrorResponse(`Asset not found with id of ${req.body.relatedAssetId}`, 404));
    }
    const organizationId = alert.organization.toString();
    if (asset.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Related asset must belong to the same organization', 400));
    }
  }

  // Validate related user if being updated
  if (req.body.relatedUserId) {
    const user = await User.findById(req.body.relatedUserId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.body.relatedUserId}`, 404));
    }
    const organizationId = alert.organization.toString();
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Related user must belong to the same organization', 400));
    }
  }

  alert = await Alert.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('organization', 'name industry')
    .populate('assignedTo', 'firstName lastName')
    .populate('assignedTeam', 'name')
    .populate('relatedIncident', 'title status severity')
    .populate('relatedCase', 'title status priority')
    .populate('relatedAsset', 'name hostname ipAddress')
    .populate('relatedUser', 'firstName lastName email');

  // Emit socket event for updated alert
  socketEvents.emitAlertEvent(alert.organization.toString(), 'alertUpdated', alert);

  res.status(200).json({
    success: true,
    data: alert
  });
});

// Delete alert
exports.deleteAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  const organizationId = alert.organization.toString();

  await alert.remove();

  // Emit socket event for deleted alert
  socketEvents.emitAlertEvent(organizationId, 'alertDeleted', { alertId: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Acknowledge alert
exports.acknowledgeAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  // Check if user has permission to acknowledge
  // In a real app, you'd check roles/permissions here

  alert.status = 'acknowledged';
  alert.assignedTo = req.user.id; // Assign to current user
  await alert.save();

  // Add to status history
  alert.statusHistory.push({
    status: 'acknowledged',
    changedBy: req.user.id,
    changedAt: new Date(),
    note: 'Alert acknowledged'
  });

  await alert.save();

  // Emit socket event for acknowledged alert
  socketEvents.emitAlertEvent(alert.organization.toString(), 'alertAcknowledged', alert);

  res.status(200).json({
    success: true,
    data: alert
  });
});

// Resolve alert
exports.resolveAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  // Check if user has permission to resolve
  // In a real app, you'd check roles/permissions here

  alert.status = 'resolved';
  await alert.save();

  // Add to status history
  alert.statusHistory.push({
    status: 'resolved',
    changedBy: req.user.id,
    changedAt: new Date(),
    note: 'Alert resolved'
  });

  await alert.save();

  // Emit socket event for resolved alert
  socketEvents.emitAlertEvent(alert.organization.toString(), 'alertResolved', alert);

  res.status(200).json({
    success: true,
    data: alert
  });
});

// Mark alert as false positive
exports.falsePositiveAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  // Check if user has permission to mark as false positive
  // In a real app, you'd check roles/permissions here

  alert.status = 'false-positive';
  await alert.save();

  // Add to status history
  alert.statusHistory.push({
    status: 'false-positive',
    changedBy: req.user.id,
    changedAt: new Date(),
    note: 'Alert marked as false positive'
  });

  await alert.save();

  // Emit socket event for false positive alert
  socketEvents.emitAlertEvent(alert.organization.toString(), 'alertFalsePositive', alert);

  res.status(200).json({
    success: true,
    data: alert
  });
});

// Suppress alert
exports.suppressAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  // Check if user has permission to suppress
  // In a real app, you'd check roles/permissions here

  alert.status = 'suppressed';
  await alert.save();

  // Add to status history
  alert.statusHistory.push({
    status: 'suppressed',
    changedBy: req.user.id,
    changedAt: new Date(),
    note: 'Alert suppressed'
  });

  await alert.save();

  // Emit socket event for suppressed alert
  socketEvents.emitAlertEvent(alert.organization.toString(), 'alertSuppressed', alert);

  res.status(200).json({
    success: true,
    data: alert
  });
});

// Get alerts by organization
exports.getAlertsByOrganization = asyncHandler(async (req, res, next) => {
  const alerts = await Alert.find({ organization: req.params.orgId })
    .populate('assignedTo', 'firstName lastName')
    .populate('assignedTeam', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: alerts.length,
    data: alerts
  });
});

// Get alerts by user
exports.getAlertsByUser = asyncHandler(async (req, res, next) => {
  const alerts = await Alert.find({ assignedTo: req.params.userId })
    .populate('organization', 'name industry')
    .populate('assignedTeam', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: alerts.length,
    data: alerts
  });
});

// Get alerts by team
exports.getAlertsByTeam = asyncHandler(async (req, res, next) => {
  const alerts = await Alert.find({ assignedTeam: req.params.teamId })
    .populate('organization', 'name industry')
    .populate('assignedTo', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: alerts.length,
    data: alerts
  });
});

// Get alerts statistics
exports.getAlertStats = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || req.user.organizationId;

  const [total, byStatus, bySeverity, byType, bySource] = await Promise.all([
    Alert.countDocuments({ organization: organizationId }),
    Alert.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Alert.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    Alert.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$alertType', count: { $sum: 1 } } }
    ]),
    Alert.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count])),
      bySeverity: Object.fromEntries(bySeverity.map(item => [item._id, item.count])),
      byType: Object.fromEntries(byType.map(item => [item._id, item.count])),
      bySource: Object.fromEntries(bySource.map(item => [item._id, item.count]))
    }
  });
});