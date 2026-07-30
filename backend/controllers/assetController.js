const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Team = require('../models/Team');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const socketEvents = require('../utils/socketEvents');

// Get all assets
exports.getAssets = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single asset
exports.getAsset = asyncHandler(async (req, res, next) => {
  const asset = await Asset.findById(req.params.id)
    .populate('organization', 'name industry')
    .populate('owner', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: asset
  });
});

// Create asset
exports.createAsset = asyncHandler(async (req, res, next) => {
  const {
    name, description, assetType, hostname, ipAddress, macAddress,
    operatingSystem, manufacturer, model, serialNumber, assetTag,
    organizationId, location, ownerId, assignedToId, department,
    riskLevel, criticality, compliance, networkInterfaces,
    installedSoftware, openPorts, vulnerabilities, tags,
    lastSeen, lastScanned, isAgentInstalled, agentVersion,
    lastAgentCheckin, isMonitored, monitoringAgent
  } = req.body;

  // Validate organization exists
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return next(new ErrorResponse(`Organization not found with id of ${organizationId}`, 404));
  }

  // Validate owner if provided
  if (ownerId) {
    const user = await User.findById(ownerId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${ownerId}`, 404));
    }
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Asset owner must belong to the same organization', 400));
    }
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

  // Validate hostname uniqueness within organization
  if (hostname) {
    const existingAsset = await Asset.findOne({ hostname, organization: organizationId });
    if (existingAsset) {
      return next(new ErrorResponse('Asset with this hostname already exists in the organization', 400));
    }
  }

  // Validate serialNumber uniqueness within organization (if provided)
  if (serialNumber) {
    const existingAsset = await Asset.findOne({ serialNumber, organization: organizationId });
    if (existingAsset) {
      return next(new ErrorResponse('Asset with this serial number already exists in the organization', 400));
    }
  }

  // Validate assetTag uniqueness within organization (if provided)
  if (assetTag) {
    const existingAsset = await Asset.findOne({ assetTag, organization: organizationId });
    if (existingAsset) {
      return next(new ErrorResponse('Asset with this asset tag already exists in the organization', 400));
    }
  }

  const asset = await Asset.create({
    name,
    description,
    assetType,
    hostname,
    ipAddress,
    macAddress,
    operatingSystem,
    manufacturer,
    model,
    serialNumber,
    assetTag,
    organization: organizationId,
    location,
    owner: ownerId || null,
    assignedTo: assignedToId || null,
    department,
    riskLevel,
    criticality,
    compliance,
    networkInterfaces,
    installedSoftware,
    openPorts,
    vulnerabilities,
    tags,
    lastSeen: lastSeen || new Date(),
    lastScanned,
    isAgentInstalled,
    agentVersion,
    lastAgentCheckin,
    isMonitored,
    monitoringAgent
  });

  // Emit socket event for new asset
  socketEvents.emitToOrg(organizationId, 'assetCreated', asset);

  res.status(201).json({
    success: true,
    data: asset
  });
});

// Update asset
exports.updateAsset = asyncHandler(async (req, res, next) => {
  let asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  // Validate organization if being updated
  if (req.body.organizationId) {
    const organization = await Organization.findById(req.body.organizationId);
    if (!organization) {
      return next(new ErrorResponse(`Organization not found with id of ${req.body.organizationId}`, 404));
    }
  }

  // Validate owner if being updated
  if (req.body.ownerId) {
    const user = await User.findById(req.body.ownerId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.body.ownerId}`, 404));
    }
    const organizationId = asset.organization.toString();
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Asset owner must belong to the same organization', 400));
    }
  }

  // Validate assigned user if being updated
  if (req.body.assignedToId) {
    const user = await User.findById(req.body.assignedToId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.body.assignedToId}`, 404));
    }
    const organizationId = asset.organization.toString();
    if (user.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Assigned user must belong to the same organization', 400));
    }
  }

  // Validate hostname uniqueness if being updated
  if (req.body.hostname && req.body.hostname !== asset.hostname) {
    const existingAsset = await Asset.findOne({
      hostname: req.body.hostname,
      organization: asset.organization,
      _id: { $ne: req.params.id }
    });
    if (existingAsset) {
      return next(new ErrorResponse('Asset with this hostname already exists in the organization', 400));
    }
  }

  // Validate serialNumber uniqueness if being updated
  if (req.body.serialNumber && req.body.serialNumber !== asset.serialNumber) {
    const existingAsset = await Asset.findOne({
      serialNumber: req.body.serialNumber,
      organization: asset.organization,
      _id: { $ne: req.params.id }
    });
    if (existingAsset) {
      return next(new ErrorResponse('Asset with this serial number already exists in the organization', 400));
    }
  }

  // Validate assetTag uniqueness if being updated
  if (req.body.assetTag && req.body.assetTag !== asset.assetTag) {
    const existingAsset = await Asset.findOne({
      assetTag: req.body.assetTag,
      organization: asset.organization,
      _id: { $ne: req.params.id }
    });
    if (existingAsset) {
      return next(new ErrorResponse('Asset with this asset tag already exists in the organization', 400));
    }
  }

  asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('organization', 'name industry')
    .populate('owner', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  // Emit socket event for updated asset
  socketEvents.emitToOrg(asset.organization.toString(), 'assetUpdated', asset);

  res.status(200).json({
    success: true,
    data: asset
  });
});

// Delete asset
exports.deleteAsset = asyncHandler(async (req, res, next) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  const organizationId = asset.organization.toString();

  await asset.remove();

  // Emit socket event for deleted asset
  socketEvents.emitToOrg(organizationId, 'assetDeleted', { assetId: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Update asset status
exports.updateAssetStatus = asyncHandler(async (req, res, next) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  const { status } = req.body;

  // Validate status
  const validStatuses = ['active', 'inactive', 'maintenance', 'retired', 'decommissioned', 'lost-stolen'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Invalid status: ${status}`, 400));
  }

  asset.status = status;
  await asset.save();

  // Emit socket event for asset status update
  socketEvents.emitToOrg(asset.organization.toString(), 'assetStatusUpdated', asset);

  res.status(200).json({
    success: true,
    data: asset
  });
});

// Update asset risk level
exports.updateAssetRiskLevel = asyncHandler(async (req, res, next) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  const { riskLevel } = req.body;

  // Validate risk level
  const validRiskLevels = ['low', 'medium', 'high', 'critical'];
  if (!validRiskLevels.includes(riskLevel)) {
    return next(new ErrorResponse(`Invalid risk level: ${riskLevel}`, 400));
  }

  asset.riskLevel = riskLevel;
  await asset.save();

  // Emit socket event for asset risk level update
  socketEvents.emitToOrg(asset.organization.toString(), 'assetRiskLevelUpdated', asset);

  res.status(200).json({
    success: true,
    data: asset
  });
});

// Update asset criticality
exports.updateAssetCriticality = asyncHandler(async (req, res, next) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  const { criticality } = req.body;

  // Validate criticality
  const validCriticalities = ['low', 'medium', 'high', 'critical'];
  if (!validCriticalities.includes(criticality)) {
    return next(new ErrorResponse(`Invalid criticality: ${criticality}`, 400));
  }

  asset.criticality = criticality;
  await asset.save();

  // Emit socket event for asset criticality update
  socketEvents.emitToOrg(asset.organization.toString(), 'assetCriticalityUpdated', asset);

  res.status(200).json({
    success: true,
    data: asset
  });
});

// Scan asset for vulnerabilities
exports.scanAsset = asyncHandler(async (req, res, next) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  // In a real implementation, this would trigger an actual vulnerability scan
  // For now, we'll just update the lastScanned timestamp
  asset.lastScanned = new Date();
  await asset.save();

  // Emit socket event for asset scan initiated
  socketEvents.emitToOrg(asset.organization.toString(), 'assetScanInitiated', {
    assetId: asset._id,
    lastScanned: asset.lastScanned
  });

  res.status(200).json({
    success: true,
    data: {
      message: 'Asset scan initiated',
      assetId: asset._id,
      lastScanned: asset.lastScanned
    }
  });
});

// Install agent on asset
exports.installAgent = asyncHandler(async (req, res, next) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  const { agentVersion, monitoringAgent } = req.body;

  asset.isAgentInstalled = true;
  asset.agentVersion = agentVersion || null;
  asset.monitoringAgent = monitoringAgent || null;
  asset.lastAgentCheckin = new Date();
  await asset.save();

  // Emit socket event for agent installed
  socketEvents.emitToOrg(asset.organization.toString(), 'agentInstalled', asset);

  res.status(200).json({
    success: true,
    data: asset
  });
});

// Uninstall agent from asset
exports.uninstallAgent = asyncHandler(async (req, res, next) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  asset.isAgentInstalled = false;
  asset.agentVersion = null;
  asset.lastAgentCheckin = null;
  await asset.save();

  // Emit socket event for agent uninstalled
  socketEvents.emitToOrg(asset.organization.toString(), 'agentUninstalled', asset);

  res.status(200).json({
    success: true,
    data: asset
  });
});

// Update agent checkin
exports.updateAgentCheckin = asyncHandler(async (req, res, next) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new ErrorResponse(`Asset not found with id of ${req.params.id}`, 404));
  }

  asset.lastAgentCheckin = new Date();
  await asset.save();

  // Emit socket event for agent checkin updated
  socketEvents.emitToOrg(asset.organization.toString(), 'agentCheckinUpdated', asset);

  res.status(200).json({
    success: true,
    data: asset
  });
});

// Get assets by organization
exports.getAssetsByOrganization = asyncHandler(async (req, res, next) => {
  const assets = await Asset.find({ organization: req.params.orgId })
    .populate('owner', 'firstName lastName')
    .populate('assignedTo', 'firstName lastName')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: assets.length,
    data: assets
  });
});

// Get assets by user (owner or assigned)
exports.getAssetsByUser = asyncHandler(async (req, res, next) => {
  const assets = await Asset.find({
    $or: [
      { owner: req.params.userId },
      { assignedTo: req.params.userId }
    ]
  })
    .populate('organization', 'name industry')
    .populate('owner', 'firstName lastName')
    .populate('assignedTo', 'firstName lastName')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: assets.length,
    data: assets
  });
});

// Get assets by team
exports.getAssetsByTeam = asyncHandler(async (req, res, next) => {
  // This would require a more complex query in a real implementation
  // For now, we'll get assets where assignedTo is in the team
  const team = await Team.findById(req.params.teamId).populate('members');
  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.teamId}`, 404));
  }

  const memberIds = team.members.map(member => member._id);
  const assets = await Asset.find({ assignedTo: { $in: memberIds } })
    .populate('organization', 'name industry')
    .populate('assignedTo', 'firstName lastName')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: assets.length,
    data: assets
  });
});

// Assets statistics
exports.getAssetStats = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.orgId || req.user.organizationId;

  const [total, byType, byStatus, byRiskLevel, byCriticality] = await Promise.all([
    Asset.countDocuments({ organization: organizationId }),
    Asset.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$assetType', count: { $sum: 1 } } }
    ]),
    Asset.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Asset.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]),
    Asset.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$criticality', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      byType: Object.fromEntries(byType.map(item => [item._id, item.count])),
      byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count])),
      byRiskLevel: Object.fromEntries(byRiskLevel.map(item => [item._id, item.count])),
      byCriticality: Object.fromEntries(byCriticality.map(item => [item._id, item.count]))
    }
  });
});