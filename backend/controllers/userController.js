const User = require('../models/User');
const Organization = require('../models/Organization');
const Team = require('../models/Team');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const socketEvents = require('../utils/socketEvents');

// Get all users
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single user
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('organization', 'name industry')
    .populate('team', 'name');

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// Create user
exports.createUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role, organizationId, teamId } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Validate organization exists
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return next(new ErrorResponse(`Organization not found with id of ${organizationId}`, 404));
  }

  // Validate team exists if provided
  if (teamId) {
    const team = await Team.findById(teamId);
    if (!team) {
      return next(new ErrorResponse(`Team not found with id of ${teamId}`, 404));
    }
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    organization: organizationId,
    team: teamId || null
  });

  // Emit socket event for new user
  socketEvents.emitToOrg(organizationId, 'userCreated', user);

  res.status(201).json({
    success: true,
    data: user
  });
});

// Update user
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
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
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('organization', 'name industry')
    .populate('team', 'name');

  // Emit socket event for updated user
  socketEvents.emitToOrg(user.organization.toString(), 'userUpdated', user);

  res.status(200).json({
    success: true,
    data: user
  });
});

// Delete user
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  const organizationId = user.organization.toString();

  await user.remove();

  // Emit socket event for deleted user
  socketEvents.emitToOrg(organizationId, 'userDeleted', { userId: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Toggle user status
exports.toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  user.isActive = !user.isActive;
  await user.save();

  // Emit socket event for user status toggled
  socketEvents.emitToOrg(user.organization.toString(), 'userStatusToggled', user);

  res.status(200).json({
    success: true,
    data: user
  });
});

// Get users by organization
exports.getUsersByOrganization = asyncHandler(async (req, res, next) => {
  const users = await User.find({ organization: req.params.orgId })
    .populate('team', 'name')
    .select('-password');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// Get users by team
exports.getUsersByTeam = asyncHandler(async (req, res, next) => {
  const users = await User.find({ team: req.params.teamId })
    .populate('organization', 'name industry')
    .select('-password');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});