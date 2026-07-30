const Team = require('../models/Team');
const User = require('../models/User');
const Organization = require('../models/Organization');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const socketEvents = require('../utils/socketEvents');

// Get all teams
exports.getTeams = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Get single team
exports.getTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id)
    .populate('organization', 'name industry')
    .populate('teamLead', 'firstName lastName email')
    .populate('members', 'firstName lastName email');

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: team
  });
});

// Create team
exports.createTeam = asyncHandler(async (req, res, next) => {
  const { name, description, organizationId, teamLeadId, members } = req.body;

  // Validate organization exists
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return next(new ErrorResponse(`Organization not found with id of ${organizationId}`, 404));
  }

  // Validate team lead exists if provided
  if (teamLeadId) {
    const teamLead = await User.findById(teamLeadId);
    if (!teamLead) {
      return next(new ErrorResponse(`Team lead not found with id of ${teamLeadId}`, 404));
    }

    // Ensure team lead belongs to the same organization
    if (teamLead.organization.toString() !== organizationId) {
      return next(new ErrorResponse('Team lead must belong to the same organization', 400));
    }
  }

  // Validate members if provided
  if (members && members.length > 0) {
    const validMembers = await User.find({ _id: { $in: members } });
    if (validMembers.length !== members.length) {
      return next(new ErrorResponse('One or more member IDs are invalid', 400));
    }

    // Ensure all members belong to the same organization
    const invalidMembers = validMembers.filter(m => m.organization.toString() !== organizationId);
    if (invalidMembers.length > 0) {
      return next(new ErrorResponse('All team members must belong to the same organization', 400));
    }
  }

  const team = await Team.create({
    name,
    description,
    organization: organizationId,
    teamLead: teamLeadId || null,
    members: members || []
  });

  // Emit socket event for new team
  socketEvents.emitToOrg(organizationId, 'teamCreated', team);

  res.status(201).json({
    success: true,
    data: team
  });
});

// Update team
exports.updateTeam = asyncHandler(async (req, res, next) => {
  let team = await Team.findById(req.params.id);

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Validate organization if being updated
  if (req.body.organizationId) {
    const organization = await Organization.findById(req.body.organizationId);
    if (!organization) {
      return next(new ErrorResponse(`Organization not found with id of ${req.body.organizationId}`, 404));
    }
  }

  // Validate team lead if being updated
  if (req.body.teamLeadId) {
    const teamLead = await User.findById(req.body.teamLeadId);
    if (!teamLead) {
      return next(new ErrorResponse(`Team lead not found with id of ${req.body.teamLeadId}`, 404));
    }

    // Ensure team lead belongs to the same organization
    if (teamLead.organization.toString() !== team.organization.toString()) {
      return next(new ErrorResponse('Team lead must belong to the same team organization', 400));
    }
  }

  // Validate members if being updated
  if (req.body.members) {
    const validMembers = await User.find({ _id: { $in: req.body.members } });
    if (validMembers.length !== req.body.members.length) {
      return next(new ErrorResponse('One or more member IDs are invalid', 400));
    }

    // Ensure all members belong to the same organization
    const organizationId = team.organization.toString();
    const invalidMembers = validMembers.filter(m => m.organization.toString() !== organizationId);
    if (invalidMembers.length > 0) {
      return next(new ErrorResponse('All team members must belong to the same organization', 400));
    }
  }

  team = await Team.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('organization', 'name industry')
    .populate('teamLead', 'firstName lastName email')
    .populate('members', 'firstName lastName email');

  // Emit socket event for updated team
  socketEvents.emitToOrg(team.organization.toString(), 'teamUpdated', team);

  res.status(200).json({
    success: true,
    data: team
  });
});

// Delete team
exports.deleteTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check if there are users associated with this team
  const usersCount = await User.countDocuments({ team: req.params.id });
  if (usersCount > 0) {
    return next(new ErrorResponse(`Cannot delete team as it has ${usersCount} users associated with it`, 400));
  }

  const organizationId = team.organization.toString();

  await team.remove();

  // Emit socket event for deleted team
  socketEvents.emitToOrg(organizationId, 'teamDeleted', { teamId: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Add member to team
exports.addTeamMember = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  const team = await Team.findById(req.params.id);
  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
  }

  // Ensure user belongs to the same organization as the team
  if (user.organization.toString() !== team.organization.toString()) {
    return next(new ErrorResponse('User must belong to the same organization as the team', 400));
  }

  // Check if user is already a member
  if (team.members.includes(userId)) {
    return next(new ErrorResponse('User is already a member of this team', 400));
  }

  team.members.push(userId);
  await team.save();

  // Emit socket event for team member added
  socketEvents.emitToOrg(team.organization.toString(), 'teamMemberAdded', team);

  res.status(200).json({
    success: true,
    data: team
  });
});

// Remove member from team
exports.removeTeamMember = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  const team = await Team.findById(req.params.id);
  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check if user is a member
  if (!team.members.includes(userId)) {
    return next(new ErrorResponse('User is not a member of this team', 400));
  }

  team.members = team.members.filter(id => id.toString() !== userId);
  await team.save();

  // Emit socket event for team member removed
  socketEvents.emitToOrg(team.organization.toString(), 'teamMemberRemoved', team);

  res.status(200).json({
    success: true,
    data: team
  });
});

// Get team members
exports.getTeamMembers = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id)
    .populate('members', 'firstName lastName email role');

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: team.members
  });
});

// Get teams by organization
exports.getTeamsByOrganization = asyncHandler(async (req, res, next) => {
  const teams = await Team.find({ organization: req.params.orgId })
    .populate('teamLead', 'firstName lastName')
    .populate('members', 'firstName lastName');

  res.status(200).json({
    success: true,
    count: teams.length,
    data: teams
  });
});

// Get teams by user
exports.getTeamsByUser = asyncHandler(async (req, res, next) => {
  const teams = await Team.find({ members: req.params.userId })
    .populate('organization', 'name industry')
    .populate('teamLead', 'firstName lastName')
    .populate('members', 'firstName lastName');

  res.status(200).json({
    success: true,
    count: teams.length,
    data: teams
  });
});