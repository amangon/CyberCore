const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Auto-cleanup after 30 days
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceName: String,
    location: String
  }
});

// Indexes
refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ organization: 1 });
refreshTokenSchema.index({ expiresAt: 1 });
refreshTokenSchema.index({ isRevoked: 1 });
refreshTokenSchema.index({ token: 1 }, { unique: true });

// Generate a random token
refreshTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(40).toString('hex');
};

// Create a new refresh token
refreshTokenSchema.statics.createToken = async function(userId, organizationId, deviceInfo = {}) {
  const token = this.generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

  const refreshToken = new this({
    token,
    user: userId,
    organization: organizationId,
    expiresAt,
    deviceInfo
  });

  await refreshToken.save();
  return refreshToken;
};

// Revoke a refresh token
refreshTokenSchema.methods.revoke = function() {
  this.isRevoked = true;
  return this.save();
};

// Revoke all refresh tokens for a user
refreshTokenSchema.statics.revokeUserTokens = async function(userId, organizationId) {
  return this.updateMany(
    { user: userId, organization: organizationId, isRevoked: false },
    { isRevoked: true }
  );
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);