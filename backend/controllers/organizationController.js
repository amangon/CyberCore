const Organization = require('../models/Organization');
const User = require('../models/User');
const Team = require('../models/Team');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const socketEvents = require('../utils/socketEvents');

// Get all organizations
exports.getOrganizations = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single organization
exports.getOrganization = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    return next(new ErrorResponse(`Organization not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: organization
  });
});

// Create organization
exports.createOrganization = asyncHandler(async (req, res, next) => {
  const { name, description, industry, size, address, contactEmail, contactPhone, website } = req.body;

  // Check if organization already exists
  const existingOrganization = await Organization.findOne({ name });
  if (existingOrganization) {
    return next(new ErrorResponse('Organization already exists with this name', 400));
  }

  const organization = await Organization.create({
    name,
    description,
    industry,
    size,
    address,
    contactEmail,
    contactPhone,
    website
  });

  // Emit socket event for new organization
  socketEvents.emitToOrg(organization._id.toString(), 'organizationCreated', organization);

  res.status(201).json({
    success: true,
    data: organization
  });
});

// Update organization
exports.updateOrganization = asyncHandler(async (req, res, next) => {
  let organization = await Organization.findById(req.params.id);

  if (!organization) {
    return next(new ErrorResponse(`Organization not found with id of ${req.params.id}`, 404));
  }

  organization = await Organization.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Emit socket event for updated organization
  socketEvents.emitToOrg(organization._id.toString(), 'organizationUpdated', organization);

  res.status(200).json({
    success: true,
    data: organization
  });
});

// Delete organization
exports.deleteOrganization = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    return next(new ErrorResponse(`Organization not found with id of ${req.params.id}`, 404));
  }

  // Check if there are users associated with this organization
  const usersCount = await User.countDocuments({ organization: req.params.id });
  if (usersCount > 0) {
    return next(new ErrorResponse(`Cannot delete organization as it has ${usersCount} users associated with it`, 400));
  }

  const organizationId = organization._id.toString();

  await organization.remove();

  // Emit socket event for deleted organization
  socketEvents.emitToOrg(organizationId, 'organizationDeleted', { organizationId });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get organization stats
exports.getOrganizationStats = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    return next(new ErrorResponse(`Organization not found with id of ${req.params.id}`, 404));
  }

  const [usersCount, teamsCount] = await Promise.all([
    User.countDocuments({ organization: req.params.id }),
    Team.countDocuments({ organization: req.params.id })
  ]);

  res.status(200).json({
    success: true,
    data: {
      organizationId: organization._id,
      organizationName: organization.name,
      users: usersCount,
      teams: teamsCount
    }
  });
});

// Get users in organization
exports.getOrganizationUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({ organization: req.params.id })
    .populate('team', 'name')
    .select('-password');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// Get teams in organization
exports.getOrganizationTeams = asyncHandler(async (req, res, next) => {
  const teams = await Team.find({ organization: req.params.id })
    .populate('teamLead', 'firstName lastName')
    .populate('members', 'firstName lastName');

  res.status(200).json({
    success: true,
    count: teams.length,
    data: teams
  });
});