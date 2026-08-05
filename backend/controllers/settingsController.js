const User = require('../models/User');
const APIKey = require('../models/APIKey');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const cloudinaryService = require('../services/cloudinaryService');

// @desc    Get current user profile
// @route   GET /api/settings/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('organization', 'name industry');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      title: user.title || '',
      phone: user.phone || '',
      timezone: user.timezone || 'UTC',
      locale: user.locale || 'en-US',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      department: user.department || '',
      location: user.location || '',
      role: user.role,
      organization: user.organization || null,
      createdAt: user.createdAt,
    }
  });
});

// @desc    Update current user profile
// @route   PUT /api/settings/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {};
  const allowedFields = [
    'firstName', 'lastName', 'title', 'phone', 'timezone',
    'locale', 'bio', 'department', 'location'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      fieldsToUpdate[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      title: user.title || '',
      phone: user.phone || '',
      timezone: user.timezone || 'UTC',
      locale: user.locale || 'en-US',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      department: user.department || '',
      location: user.location || '',
      role: user.role,
    }
  });
});

// @desc    Upload/update avatar
// @route   POST /api/settings/profile/avatar
// @access  Private
exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please provide an image file', 400));
  }

  let avatarUrl = null;

  // Try Cloudinary first
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const uploadResult = await cloudinaryService.uploadFile(
        req.file.buffer,
        `avatar-${req.user.id}`
      );
      if (uploadResult && uploadResult.url) {
        avatarUrl = uploadResult.url;
      }
    } catch (err) {
      // Fall through to base64 fallback
    }
  }

  // Fallback: store as base64 data URL
  if (!avatarUrl) {
    const base64 = req.file.buffer.toString('base64');
    avatarUrl = `data:${req.file.mimetype};base64,${base64}`;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatarUrl },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: {
      avatarUrl: user.avatarUrl,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    }
  });
});

// ============================================================
// API KEY MANAGEMENT
// ============================================================

// @desc    Get all API keys for current user
// @route   GET /api/settings/api-keys
// @access  Private
exports.getApiKeys = asyncHandler(async (req, res, next) => {
  const keys = await APIKey.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: keys.map(key => ({
      id: key._id,
      name: key.name,
      key: key.key,
      description: key.description || '',
      status: key.isActive ? 'active' : (key.isExpired() ? 'expired' : 'revoked'),
      lastUsed: key.lastUsedAt ? key.lastUsedAt.toISOString() : 'Never',
      expiresAt: key.expiresAt ? key.expiresAt.toISOString() : 'Never',
      permissions: key.permissions,
      createdAt: key.createdAt,
    }))
  });
});

// @desc    Generate a new API key
// @route   POST /api/settings/api-keys
// @access  Private
exports.generateApiKey = asyncHandler(async (req, res, next) => {
  const { name, description, expiresInDays } = req.body;

  if (!name) {
    return next(new ErrorResponse('API key name is required', 400));
  }

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (parseInt(expiresInDays) || 365));

  const apiKey = await APIKey.createKey(
    name,
    req.user.id,
    req.user.organization || req.user.id,
    req.body.permissions || ['read:dashboard'],
    { expiresAt }
  );

  res.status(201).json({
    success: true,
    data: {
      id: apiKey._id,
      name: apiKey.name,
      key: apiKey.key, // Only returned once on creation
      description: description || '',
      status: 'active',
      expiresAt: apiKey.expiresAt.toISOString(),
      permissions: apiKey.permissions,
      createdAt: apiKey.createdAt,
    }
  });
});

// @desc    Revoke an API key
// @route   PUT /api/settings/api-keys/:id/revoke
// @access  Private
exports.revokeApiKey = asyncHandler(async (req, res, next) => {
  const apiKey = await APIKey.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!apiKey) {
    return next(new ErrorResponse('API key not found', 404));
  }

  await apiKey.revoke();

  res.status(200).json({
    success: true,
    data: { message: 'API key revoked successfully' }
  });
});

// @desc    Delete an API key
// @route   DELETE /api/settings/api-keys/:id
// @access  Private
exports.deleteApiKey = asyncHandler(async (req, res, next) => {
  const apiKey = await APIKey.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });

  if (!apiKey) {
    return next(new ErrorResponse('API key not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { message: 'API key deleted successfully' }
  });
});

// @desc    Regenerate an API key (revoke old, create new)
// @route   POST /api/settings/api-keys/:id/regenerate
// @access  Private
exports.regenerateApiKey = asyncHandler(async (req, res, next) => {
  const oldKey = await APIKey.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!oldKey) {
    return next(new ErrorResponse('API key not found', 404));
  }

  // Revoke old key
  await oldKey.revoke();

  // Create new key with same settings
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 365);

  const newKey = await APIKey.createKey(
    oldKey.name,
    req.user.id,
    req.user.organization || req.user.id,
    oldKey.permissions,
    { expiresAt }
  );

  res.status(201).json({
    success: true,
    data: {
      id: newKey._id,
      name: newKey.name,
      key: newKey.key,
      status: 'active',
      expiresAt: newKey.expiresAt.toISOString(),
      permissions: newKey.permissions,
      createdAt: newKey.createdAt,
    }
  });
});

// ============================================================
// SETTINGS METADATA
// ============================================================

// @desc    Get organization settings
// @route   GET /api/settings/organization
// @access  Private
exports.getOrganizationSettings = asyncHandler(async (req, res, next) => {
  const Organization = require('../models/Organization');
  const org = await Organization.findById(req.user.organization);

  if (!org) {
    return next(new ErrorResponse('Organization not found', 404));
  }

  res.status(200).json({
    success: true,
    data: org
  });
});
