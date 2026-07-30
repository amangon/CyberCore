const mongoose = require('mongoose');
const Case = require('../models/Case');
const User = require('../models/User');
const Team = require('../models/Team');
const Organization = require('../models/Organization');
const Incident = require('../models/Incident');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const socketEvents = require('../utils/socketEvents');

// Get all cases
exports.getCases = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single case
exports.getCase = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id)
    .populate('organization', 'name industry')
    .populate('team', 'name')
    .populate('leadInvestigator', 'firstName lastName email')
    .populate('investigators', 'firstName lastName email')
    .populate('incidents', 'title status severity')
    .populate('statusHistory.changedBy', 'firstName lastName')
    .populate('evidence.uploadedBy', 'firstName lastName email');

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Create case
exports.createCase = asyncHandler(async (req, res, next) => {
  const {
    title, description, caseNumber, status, priority, organizationId,
    teamId, leadInvestigatorId, investigatorIds, incidentIds, tags,
    classification, timeline, evidence, aiAnalysis
  } = req.body;

  // Validate organization exists
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return next(new ErrorResponse(`Organization not found with id of ${organizationId}`, 404));
  }

  // Validate team if provided
  if (teamId) {
    const team = await Team.findById(teamId);
    if (!team) {
      return next(new ErrorResponse(`Team not found with id of ${teamId}`, 404));
    }
    if (team.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Team must belong to the same organization', 400));
    }
  }

  // Validate lead investigator if provided
  if (leadInvestigatorId) {
    const user = await User.findById(leadInvestigatorId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${leadInvestigatorId}`, 404));
    }
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Lead investigator must belong to the same organization', 400));
    }
  }

  // Validate investigators if provided
  if (investigatorIds && investigatorIds.length > 0) {
    const validInvestigators = await User.find({ _id: { $in: investigatorIds } });
    if (validInvestigators.length !== investigatorIds.length) {
      return next(new ErrorResponse('One or more investigator IDs are invalid', 400));
    }

    // Ensure all investigators belong to the same organization
    const invalidInvestigators = validInvestigators.filter(i => i.organization.toString() !== organizationId);
    if (invalidInvestigators.length > 0) {
      return next(new ErrorResponse('All investigators must belong to the same organization', 400));
    }
  }

  // Validate incidents if provided
  if (incidentIds && incidentIds.length > 0) {
    const validIncidents = await Incident.find({ _id: { $in: incidentIds } });
    if (validIncidents.length !== incidentIds.length) {
      return next(new ErrorResponse('One or more incident IDs are invalid', 400));
    }

    // Ensure all incidents belong to the same organization
    const invalidIncidents = validIncidents.filter(i => i.organization.toString() !== organizationId);
    if (invalidIncidents.length > 0) {
      return next(new ErrorResponse('All incidents must belong to the same organization', 400));
    }
  }

  const caseObj = await Case.create({
    title,
    description,
    caseNumber: caseNumber || null, // Will be generated in pre-save hook
    status,
    priority,
    organization: organizationId,
    team: teamId || null,
    leadInvestigator: leadInvestigatorId || null,
    investigators: investigatorIds || [],
    incidents: incidentIds || [],
    tags: tags || [],
    classification: classification || 'incident-response',
    timeline: timeline || [],
    evidence: evidence || [],
    aiAnalysis: aiAnalysis || {}
  });

  // Emit socket event for new case
  socketEvents.emitToOrg(organizationId, 'caseCreated', caseObj);

  res.status(201).json({
    success: true,
    data: caseObj
  });
});

// Update case
exports.updateCase = asyncHandler(async (req, res, next) => {
  let caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  // Validate organization if being updated
  if (req.body.organizationId) {
    const organization = await Organization.findById(req.body.organizationId);
    if (!organization) {
      return next(new ErrorResponse(`Organization not found with id of ${req.body.organizationId}`, 404));
    }
  }

  // Validate team if being updated
  if (req.body.teamId) {
    const team = await Team.findById(req.body.teamId);
    if (!team) {
      return next(new ErrorResponse(`Team not found with id of ${req.body.teamId}`, 404));
    }
    const organizationId = caseObj.organization.toString();
    if (team.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Team must belong to the same organization', 400));
    }
  }

  // Validate lead investigator if being updated
  if (req.body.leadInvestigatorId) {
    const user = await User.findById(req.body.leadInvestigatorId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.body.leadInvestigatorId}`, 404));
    }
    const organizationId = caseObj.organization.toString();
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Lead investigator must belong to the same organization', 400));
    }
  }

  // Validate investigators if being updated
  if (req.body.investigatorIds) {
    const validInvestigators = await User.find({ _id: { $in: req.body.investigatorIds } });
    if (validInvestigators.length !== req.body.investigatorIds.length) {
      return next(new ErrorResponse('One or more investigator IDs are invalid', 400));
    }

    // Ensure all investigators belong to the same organization
    const organizationId = caseObj.organization.toString();
    const invalidInvestigators = validInvestigators.filter(i => i.organization.toString() !== organizationId);
    if (invalidInvestigators.length > 0) {
      return next(new ErrorResponse('All investigators must belong to the same organization', 400));
    }
  }

  // Validate incidents if being updated
  if (req.body.incidentIds) {
    const validIncidents = await Incident.find({ _id: { $in: req.body.incidentIds } });
    if (validIncidents.length !== req.body.incidentIds.length) {
      return next(new ErrorResponse('One or more incident IDs are invalid', 400));
    }

    // Ensure all incidents belong to the same organization
    const organizationId = caseObj.organization.toString();
    const invalidIncidents = validIncidents.filter(i => i.organization.toString() !== organizationId);
    if (invalidIncidents.length > 0) {
      return next(new ErrorResponse('All incidents must belong to the same organization', 400));
    }
  }

  caseObj = await Case.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('organization', 'name industry')
    .populate('team', 'name')
    .populate('leadInvestigator', 'firstName lastName email')
    .populate('investigators', 'firstName lastName email')
    .populate('incidents', 'title status severity')
    .populate('statusHistory.changedBy', 'firstName lastName')
    .populate('evidence.uploadedBy', 'firstName lastName email');

  // Emit socket event for updated case
  socketEvents.emitToOrg(caseObj.organization.toString(), 'caseUpdated', caseObj);

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Delete case
exports.deleteCase = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  const organizationId = caseObj.organization.toString();

  await caseObj.remove();

  // Emit socket event for deleted case
  socketEvents.emitToOrg(organizationId, 'caseDeleted', { caseId: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Update case status
exports.updateCaseStatus = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  const { status, note } = req.body;

  // Validate status
  const validStatuses = ['open', 'in-progress', 'pending-review', 'closed', 'reopened'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Invalid status: ${status}`, 400));
  }

  // Update status
  caseObj.status = status;

  // Add to status history
  caseObj.statusHistory.push({
    status,
    changedBy: req.user.id,
    changedAt: new Date(),
    note: note || `Status changed to ${status}`
  });

  await caseObj.save();

  // Emit socket event for case status update
  socketEvents.emitToOrg(caseObj.organization.toString(), 'caseStatusUpdated', caseObj);

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Assign lead investigator
exports.assignLeadInvestigator = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  const { userId } = req.body;

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
  }

  // Ensure user belongs to the same organization
  if (user.organization.toString() !== caseObj.organization.toString()) {
    return next(new ErrorResponse('Lead investigator must belong to the same organization', 400));
  }

  caseObj.leadInvestigator = userId;
  await caseObj.save();

  // Add to status history
  caseObj.statusHistory.push({
    status: caseObj.status,
    changedBy: req.user.id,
    changedAt: new Date(),
    note: `Lead investigator assigned to ${user.firstName} ${user.lastName}`
  });

  await caseObj.save();

  // Emit socket event for lead investigator assigned
  socketEvents.emitToOrg(caseObj.organization.toString(), 'caseLeadInvestigatorAssigned', caseObj);

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Add investigator
exports.addInvestigator = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  const { userId } = req.body;

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
  }

  // Ensure user belongs to the same organization
  if (user.organization.toString() !== caseObj.organization.toString()) {
    return next(new ErrorResponse('Investigator must belong to the same organization', 400));
  }

  // Check if user is already an investigator
  if (caseObj.investigators.includes(userId)) {
    return next(new ErrorResponse('User is already an investigator on this case', 400));
  }

  caseObj.investigators.push(userId);
  await caseObj.save();

  // Emit socket event for investigator added
  socketEvents.emitToOrg(caseObj.organization.toString(), 'caseInvestigatorAdded', caseObj);

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Remove investigator
exports.removeInvestigator = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  const { userId } = req.body;

  // Check if user is an investigator
  if (!caseObj.investigators.includes(userId)) {
    return next(new ErrorResponse('User is not an investigator on this case', 400));
  }

  caseObj.investigators = caseObj.investigators.filter(id => id.toString() !== userId);
  await caseObj.save();

  // Emit socket event for investigator removed
  socketEvents.emitToOrg(caseObj.organization.toString(), 'caseInvestigatorRemoved', caseObj);

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Add incident to case
exports.addIncidentToCase = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  const { incidentId } = req.body;

  // Validate incident exists
  const incident = await Incident.findById(incidentId);
  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${incidentId}`, 404));
  }

  // Ensure incident belongs to the same organization
  if (incident.organization.toString() !== caseObj.organization.toString()) {
    return next(new ErrorResponse('Incident must belong to the same organization', 400));
  }

  // Check if incident is already in case
  if (caseObj.incidents.includes(incidentId)) {
    return next(new ErrorResponse('Incident is already part of this case', 400));
  }

  caseObj.incidents.push(incidentId);
  await caseObj.save();

  // Emit socket event for incident added to case
  socketEvents.emitToOrg(caseObj.organization.toString(), 'caseIncidentAdded', caseObj);

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Remove incident from case
exports.removeIncidentFromCase = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  const { incidentId } = req.body;

  // Check if incident is in case
  if (!caseObj.incidents.includes(incidentId)) {
    return next(new ErrorResponse('Incident is not part of this case', 400));
  }

  caseObj.incidents = caseObj.incidents.filter(id => id.toString() !== incidentId);
  await caseObj.save();

  // Emit socket event for incident removed from case
  socketEvents.emitToOrg(caseObj.organization.toString(), 'caseIncidentRemoved', caseObj);

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Add evidence to case
exports.addEvidence = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  const {
    type, name, description, filePath, fileSize, mimeType,
    uploadedById, hash
  } = req.body;

  // Validate uploaded by user if provided
  if (uploadedById) {
    const user = await User.findById(uploadedById);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${uploadedById}`, 404));
    }
    if (user.organization.toString() !== caseObj.organization.toString()) {
      return next(new ErrorResponse('User uploading evidence must belong to the same organization', 400));
    }
  }

  const evidence = {
    type,
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
    }]
  };

  caseObj.evidence.push(evidence);
  await caseObj.save();

  // Emit socket event for evidence added
  socketEvents.emitToOrg(caseObj.organization.toString(), 'caseEvidenceAdded', caseObj);

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Remove evidence from case
exports.removeEvidence = asyncHandler(async (req, res, next) => {
  const caseObj = await Case.findById(req.params.id);

  if (!caseObj) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  const { evidenceId } = req.body;

  // Check if evidence exists in case
  const evidenceIndex = caseObj.evidence.findIndex(e => e._id.toString() === evidenceId);
  if (evidenceIndex === -1) {
    return next(new ErrorResponse('Evidence not found in this case', 404));
  }

  caseObj.evidence.splice(evidenceIndex, 1);
  await caseObj.save();

  // Emit socket event for evidence removed
  socketEvents.emitToOrg(caseObj.organization.toString(), 'caseEvidenceRemoved', caseObj);

  res.status(200).json({
    success: true,
    data: caseObj
  });
});

// Get cases by organization
exports.getCasesByOrganization = asyncHandler(async (req, res, next) => {
  const cases = await Case.find({ organization: req.params.orgId })
    .populate('leadInvestigator', 'firstName lastName')
    .populate('team', 'name')
    .populate('investigators', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: cases.length,
    data: cases
  });
});

// Get cases by user
exports.getCasesByUser = asyncHandler(async (req, res, next) => {
  const cases = await Case.find({
    $or: [
      { leadInvestigator: req.params.userId },
      { investigators: req.params.userId }
    ]
  })
    .populate('organization', 'name industry')
    .populate('team', 'name')
    .populate('leadInvestigator', 'firstName lastName')
    .populate('investigators', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: cases.length,
    data: cases
  });
});

// Get cases by team
exports.getCasesByTeam = asyncHandler(async (req, res, next) => {
  const cases = await Case.find({ team: req.params.teamId })
    .populate('organization', 'name industry')
    .populate('leadInvestigator', 'firstName lastName')
    .populate('team', 'name')
    .populate('investigators', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: cases.length,
    data: cases
  });
});

// Cases statistics
exports.getCaseStats = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || req.user.organizationId;

  const [total, byStatus, byPriority, byClassification] = await Promise.all([
    Case.countDocuments({ organization: organizationId }),
    Case.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Case.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    Case.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$classification', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count])),
      byPriority: Object.fromEntries(byPriority.map(item => [item._id, item.count])),
      byClassification: Object.fromEntries(byClassification.map(item => [item._id, item.count]))
    }
  });
});