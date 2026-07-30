const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Team = require('../models/Team');
const Organization = require('../models/Organization');
const Asset = require('../models/Asset');
const Case = require('../models/Case');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const socketEvents = require('../utils/socketEvents');

// Get all incidents
exports.getIncidents = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single incident
exports.getIncident = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id)
    .populate('organization', 'name industry')
    .populate('team', 'name')
    .populate('assignedTo', 'firstName lastName email')
    .populate('reportedBy', 'firstName lastName email')
    .populate('statusHistory.changedBy', 'firstName lastName')
    .populate('affectedAssets', 'name hostname ipAddress')
    .populate('affectedUsers', 'firstName lastName email')
    .populate('relatedCases', 'title status priority')
    .populate('artifacts.uploadedBy', 'firstName lastName email');

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: incident
  });
});

// Create incident
exports.createIncident = asyncHandler(async (req, res, next) => {
  const {
    title, description, incidentType, severity, priority, organizationId,
    department, assignedToId, reportedById, assignedTeamId, tags,
    indicatorsOfCompromise, mitreAttck, affectedAssets, affectedUsers,
    containmentActions, eradicationActions, recoveryActions, lessonsLearned,
    rootCauseAnalysis, financialImpact, dataBreach, complianceImpact, artifacts
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

  // Validate reported by user if provided
  if (reportedById) {
    const user = await User.findById(reportedById);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${reportedById}`, 404));
    }
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Reported by user must belong to the same organization', 400));
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

  // Validate affected assets if provided
  if (affectedAssets && affectedAssets.length > 0) {
    const validAssets = await Asset.find({ _id: { $in: affectedAssets } });
    if (validAssets.length !== affectedAssets.length) {
      return next(new ErrorResponse('One or more asset IDs are invalid', 400));
    }

    // Ensure all assets belong to the same organization
    const invalidAssets = validAssets.filter(a => a.organization.toString() !== organizationId);
    if (invalidAssets.length > 0) {
      return next(new ErrorResponse('All affected assets must belong to the same organization', 400));
    }
  }

  // Validate affected users if provided
  if (affectedUsers && affectedUsers.length > 0) {
    const validUsers = await User.find({ _id: { $in: affectedUsers } });
    if (validUsers.length !== affectedUsers.length) {
      return next(new ErrorResponse('One or more user IDs are invalid', 400));
    }

    // Ensure all users belong to the same organization
    const invalidUsers = validUsers.filter(u => u.organization.toString() !== organizationId);
    if (invalidUsers.length > 0) {
      return next(new ErrorResponse('All affected users must belong to the same organization', 400));
    }
  }

  const incident = await Incident.create({
    title,
    description,
    incidentType,
    severity,
    priority,
    organization: organizationId,
    department: department || null,
    assignedTo: assignedToId || null,
    reportedBy: reportedById || null,
    assignedTeam: assignedTeamId || null,
    tags: tags || [],
    indicatorsOfCompromise: indicatorsOfCompromise || [],
    mitreAttck: mitreAttck || [],
    affectedAssets: affectedAssets || [],
    affectedUsers: affectedUsers || [],
    containmentActions: containmentActions || [],
    eradicationActions: eradicationActions || [],
    recoveryActions: recoveryActions || [],
    lessonsLearned: lessonsLearned || '',
    rootCauseAnalysis: rootCauseAnalysis || '',
    financialImpact: financialImpact || {},
    dataBreach: dataBreach || {},
    complianceImpact: complianceImpact || [],
    artifacts: artifacts || []
  });

  // Emit socket event for new incident
  socketEvents.emitIncidentEvent(organizationId, 'incidentCreated', incident);

  res.status(201).json({
    success: true,
    data: incident
  });
});

// Update incident
exports.updateIncident = asyncHandler(async (req, res, next) => {
  let incident = await Incident.findById(req.params.id);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
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
    const organizationId = incident.organization.toString();
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Assigned user must belong to the same organization', 400));
    }
  }

  // Validate reported by user if being updated
  if (req.body.reportedById) {
    const user = await User.findById(req.body.reportedById);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.body.reportedById}`, 404));
    }
    const organizationId = incident.organization.toString();
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Reported by user must belong to the same organization', 400));
    }
  }

  // Validate assigned team if being updated
  if (req.body.assignedTeamId) {
    const team = await Team.findById(req.body.assignedTeamId);
    if (!team) {
      return next(new ErrorResponse(`Team not found with id of ${req.body.assignedTeamId}`, 404));
    }
    const organizationId = incident.organization.toString();
    if (team.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Assigned team must belong to the same organization', 400));
    }
  }

  // Validate affected assets if being updated
  if (req.body.affectedAssets) {
    const validAssets = await Asset.find({ _id: { $in: req.body.affectedAssets } });
    if (validAssets.length !== req.body.affectedAssets.length) {
      return next(new ErrorResponse('One or more asset IDs are invalid', 400));
    }

    // Ensure all assets belong to the same organization
    const organizationId = incident.organization.toString();
    const invalidAssets = validAssets.filter(a => a.organization.toString() !== organizationId);
    if (invalidAssets.length > 0) {
      return next(new ErrorResponse('All affected assets must belong to the same organization', 400));
    }
  }

  // Validate affected users if being updated
  if (req.body.affectedUsers) {
    const validUsers = await User.find({ _id: { $in: req.body.affectedUsers } });
    if (validUsers.length !== req.body.affectedUsers.length) {
      return next(new ErrorResponse('One or more user IDs are invalid', 400));
    }

    // Ensure all users belong to the same organization
    const organizationId = incident.organization.toString();
    const invalidUsers = validUsers.filter(u => u.organization.toString() !== organizationId);
    if (invalidUsers.length > 0) {
      return next(new ErrorResponse('All affected users must belong to the same organization', 400));
    }
  }

  incident = await Incident.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('organization', 'name industry')
    .populate('team', 'name')
    .populate('assignedTo', 'firstName lastName email')
    .populate('reportedBy', 'firstName lastName email')
    .populate('statusHistory.changedBy', 'firstName lastName')
    .populate('affectedAssets', 'name hostname ipAddress')
    .populate('affectedUsers', 'firstName lastName email')
    .populate('relatedCases', 'title status priority')
    .populate('artifacts.uploadedBy', 'firstName lastName email');

  // Emit socket event for updated incident
  socketEvents.emitIncidentEvent(incident.organization.toString(), 'incidentUpdated', incident);

  res.status(200).json({
    success: true,
    data: incident
  });
});

// Delete incident
exports.deleteIncident = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
  }

  // Check if incident is referenced in any cases
  const casesCount = await Case.countDocuments({ incidents: req.params.id });
  if (casesCount > 0) {
    return next(new ErrorResponse(`Cannot delete incident as it is referenced in ${casesCount} case(s)`, 400));
  }

  const organizationId = incident.organization.toString();

  await incident.remove();

  // Emit socket event for deleted incident
  socketEvents.emitIncidentEvent(organizationId, 'incidentDeleted', { incidentId: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Update incident status
exports.updateIncidentStatus = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
  }

  const { status, note } = req.body;

  // Validate status
  const validStatuses = ['open', 'investigating', 'contained', 'eradicated', 'recovered', 'closed', 'reopened', 'false-positive'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Invalid status: ${status}`, 400));
  }

  // Update status
  incident.status = status;

  // Add to status history
  incident.statusHistory.push({
    status,
    changedBy: req.user.id,
    changedAt: new Date(),
    note: note || `Status changed to ${status}`
  });

  await incident.save();

  // Emit socket event for incident status update
  socketEvents.emitIncidentEvent(incident.organization.toString(), 'incidentStatusUpdated', incident);

  res.status(200).json({
    success: true,
    data: incident
  });
});

// Assign incident to user
exports.assignIncident = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
  }

  const { userId } = req.body;

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
  }

  // Ensure user belongs to the same organization
  if (user.organization.toString() !== incident.organization.toString()) {
    return next(new ErrorResponse('Assigned user must belong to the same organization', 400));
  }

  incident.assignedTo = userId;
  await incident.save();

  // Add to status history
  incident.statusHistory.push({
    status: incident.status,
    changedBy: req.user.id,
    changedAt: new Date(),
    note: `Incident assigned to ${user.firstName} ${user.lastName}`
  });

  await incident.save();

  // Emit socket event for incident assignment
  socketEvents.emitIncidentEvent(incident.organization.toString(), 'incidentAssigned', incident);

  res.status(200).json({
    success: true,
    data: incident
  });
});

// Assign incident to team
exports.assignIncidentToTeam = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
  }

  const { teamId } = req.body;

  // Validate team exists
  const team = await Team.findById(teamId);
  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${teamId}`, 404));
  }

  // Ensure team belongs to the same organization
  if (team.organization.toString() !== incident.organization.toString()) {
    return next(new ErrorResponse('Assigned team must belong to the same organization', 400));
  }

  incident.assignedTeam = teamId;
  await incident.save();

  // Add to status history
  incident.statusHistory.push({
    status: incident.status,
    changedBy: req.user.id,
    changedAt: new Date(),
    note: `Incident assigned to team ${team.name}`
  });

  await incident.save();

  // Emit socket event for incident team assignment
  socketEvents.emitIncidentEvent(incident.organization.toString(), 'incidentAssignedToTeam', incident);

  res.status(200).json({
    success: true,
    data: incident
  });
});

// Add containment action
exports.addContainmentAction = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
  }

  const { action, description, performedById, assetsAffected, usersAffected, effectiveness, notes } = req.body;

  // Validate performed by user if provided
  if (performedById) {
    const user = await User.findById(performedById);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${performedById}`, 404));
    }
    if (user.organization.toString() !== incident.organization.toString()) {
      return next(new ErrorResponse('User performing action must belong to the same organization', 400));
    }
  }

  // Validate affected assets if provided
  if (assetsAffected && assetsAffected.length > 0) {
    const validAssets = await Asset.find({ _id: { $in: assetsAffected } });
    if (validAssets.length !== assetsAffected.length) {
      return next(new ErrorResponse('One or more asset IDs are invalid', 400));
    }
  }

  // Validate affected users if provided
  if (usersAffected && usersAffected.length > 0) {
    const validUsers = await User.find({ _id: { $in: usersAffected } });
    if (validUsers.length !== usersAffected.length) {
      return next(new ErrorResponse('One or more user IDs are invalid', 400));
    }
  }

  const containmentAction = {
    action,
    description,
    performedBy: performedById || null,
    performedAt: new Date(),
    assetsAffected: assetsAffected || [],
    usersAffected: usersAffected || [],
    effectiveness: effectiveness || 'unknown',
    notes: notes || ''
  };

  incident.containmentActions.push(containmentAction);
  await incident.save();

  // Emit socket event for containment action added
  socketEvents.emitIncidentEvent(incident.organization.toString(), 'containmentActionAdded', incident);

  res.status(200).json({
    success: true,
    data: incident
  });
});

// Add eradication action
exports.addEradicationAction = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
  }

  const { action, description, performedById, assetsAffected, usersAffected, effectiveness, notes } = req.body;

  // Validate performed by user if provided
  if (performedById) {
    const user = await User.findById(performedById);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${performedById}`, 404));
    }
    if (user.organization.toString() !== incident.organization.toString()) {
      return next(new ErrorResponse('User performing action must belong to the same organization', 400));
    }
  }

  // Validate affected assets if provided
  if (assetsAffected && assetsAffected.length > 0) {
    const validAssets = await Asset.find({ _id: { $in: assetsAffected } });
    if (validAssets.length !== assetsAffected.length) {
      return next(new ErrorResponse('One or more asset IDs are invalid', 400));
    }
  }

  // Validate affected users if provided
  if (usersAffected && usersAffected.length > 0) {
    const validUsers = await User.find({ _id: { $in: usersAffected } });
    if (validUsers.length !== usersAffected.length) {
      return next(new ErrorResponse('One or more user IDs are invalid', 400));
    }
  }

  const eradicationAction = {
    action,
    description,
    performedBy: performedById || null,
    performedAt: new Date(),
    assetsAffected: assetsAffected || [],
    usersAffected: usersAffected || [],
    effectiveness: effectiveness || 'unknown',
    notes: notes || ''
  };

  incident.eradicationActions.push(eradicationAction);
  await incident.save();

  // Emit socket event for eradication action added
  socketEvents.emitIncidentEvent(incident.organization.toString(), 'eradicationActionAdded', incident);

  res.status(200).json({
    success: true,
    data: incident
  });
});

// Add recovery action
exports.addRecoveryAction = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
  }

  const { action, description, performedById, assetsAffected, usersAffected, effectiveness, notes } = req.body;

  // Validate performed by user if provided
  if (performedById) {
    const user = await User.findById(performedById);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${performedById}`, 404));
    }
    if (user.organization.toString() !== incident.organization.toString()) {
      return next(new ErrorResponse('User performing action must belong to the same organization', 400));
    }
  }

  // Validate affected assets if provided
  if (assetsAffected && assetsAffected.length > 0) {
    const validAssets = await Asset.find({ _id: { $in: assetsAffected } });
    if (validAssets.length !== assetsAffected.length) {
      return next(new ErrorResponse('One or more asset IDs are invalid', 400));
    }
  }

  // Validate affected users if provided
  if (usersAffected && usersAffected.length > 0) {
    const validUsers = await User.find({ _id: { $in: usersAffected } });
    if (validUsers.length !== usersAffected.length) {
      return next(new ErrorResponse('One or more user IDs are invalid', 400));
    }
  }

  const recoveryAction = {
    action,
    description,
    performedBy: performedById || null,
    performedAt: new Date(),
    assetsAffected: assetsAffected || [],
    usersAffected: usersAffected || [],
    effectiveness: effectiveness || 'unknown',
    notes: notes || ''
  };

  incident.recoveryActions.push(recoveryAction);
  await incident.save();

  // Emit socket event for recovery action added
  socketEvents.emitIncidentEvent(incident.organization.toString(), 'recoveryActionAdded', incident);

  res.status(200).json({
    success: true,
    data: incident
  });
});

// Add artifact to incident
exports.addArtifact = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404));
  }

  const {
    name, description, filePath, fileSize, mimeType, uploadedById,
    hash, isEvidence
  } = req.body;

  // Validate uploaded by user if provided
  if (uploadedById) {
    const user = await User.findById(uploadedById);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${uploadedById}`, 404));
    }
    if (user.organization.toString() !== incident.organization.toString()) {
      return next(new ErrorResponse('User uploading artifact must belong to the same organization', 400));
    }
  }

  const artifact = {
    name,
    description,
    filePath,
    fileSize,
    mimeType,
    uploadedBy: uploadedById || null,
    uploadedAt: new Date(),
    hash: hash || {},
    chainOfCustody: [{
      handledBy: uploadedById || null,
      action: 'collected',
      timestamp: new Date(),
      notes: 'Initial collection'
    }],
    isEvidence: isEvidence || false
  };

  incident.artifacts.push(artifact);
  await incident.save();

  // Emit socket event for artifact added
  socketEvents.emitIncidentEvent(incident.organization.toString(), 'artifactAdded', incident);

  res.status(200).json({
    success: true,
    data: incident
  });
});

// Get incidents by organization
exports.getIncidentsByOrganization = asyncHandler(async (req, res, next) => {
  const incidents = await Incident.find({ organization: req.params.orgId })
    .populate('assignedTo', 'firstName lastName')
    .populate('assignedTeam', 'name')
    .populate('reportedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: incidents.length,
    data: incidents
  });
});

// Get incidents by user
exports.getIncidentsByUser = asyncHandler(async (req, res, next) => {
  const incidents = await Incident.find({
    $or: [
      { assignedTo: req.params.userId },
      { reportedBy: req.params.userId },
      { 'affectedUsers': req.params.userId }
    ]
  })
    .populate('organization', 'name industry')
    .populate('assignedTo', 'firstName lastName')
    .populate('assignedTeam', 'name')
    .populate('reportedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: incidents.length,
    data: incidents
  });
});

// Get incidents by team
exports.getIncidentsByTeam = asyncHandler(async (req, res, next) => {
  const incidents = await Incident.find({ assignedTeam: req.params.teamId })
    .populate('organization', 'name industry')
    .populate('assignedTo', 'firstName lastName')
    .populate('assignedTeam', 'name')
    .populate('reportedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: incidents.length,
    data: incidents
  });
});

// Incidents statistics
exports.getIncidentStats = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || req.user.organizationId;

  const [total, byStatus, bySeverity, byType, byPriority] = await Promise.all([
    Incident.countDocuments({ organization: organizationId }),
    Incident.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Incident.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    Incident.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$incidentType', count: { $sum: 1 } } }
    ]),
    Incident.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count])),
      bySeverity: Object.fromEntries(bySeverity.map(item => [item._id, item.count])),
      byType: Object.fromEntries(byType.map(item => [item._id, item.count])),
      byPriority: Object.fromEntries(byPriority.map(item => [item._id, item.count]))
    }
  });
});