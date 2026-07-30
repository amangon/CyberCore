const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'API key name is required'],
    trim: true
  },
  key: {
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
  permissions: [{
    type: String,
    enum: [
      'read:users', 'write:users', 'delete:users',
      'read:assets', 'write:assets', 'delete:assets',
      'read:alerts', 'write:alerts', 'delete:alerts',
      'read:incidents', 'write:incidents', 'delete:incidents',
      'read:cases', 'write:cases', 'delete:cases',
      'read:threats', 'write:threats', 'delete:threats',
      'read:dashboard', 'write:dashboard',
      'read:reports', 'write:reports',
      'read:settings', 'write:settings',
      'admin:all'
    ]
  }],
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 60
    },
    requestsPerHour: {
      type: Number,
      default: 1000
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  lastUsedAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
apiKeySchema.index({ key: 1 }, { unique: true });
apiKeySchema.index({ user: 1 });
apiKeySchema.index({ organization: 1 });
apiKeySchema.index({ isActive: 1 });
apiKeySchema.index({ expiresAt: 1 });
apiKeySchema.index({ createdAt: -1 });

// Generate a random API key
apiKeySchema.statics.generateKey = function() {
  // Format: sk_live_[random_string] or sk_test_[random_string]
  const prefix = Math.random() > 0.5 ? 'sk_live_' : 'sk_test_';
  const randomPart = crypto.randomBytes(32).toString('hex');
  return prefix + randomPart;
};

// Create a new API key
apiKeySchema.statics.createKey = async function(name, userId, organizationId, permissions = [], options = {}) {
  const key = this.generateKey();

  const apiKey = new this({
    name,
    key,
    user: userId,
    organization: organizationId,
    permissions,
    expiresAt: options.expiresAt,
    rateLimit: options.rateLimit || {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    }
  });

  await apiKey.save();
  return apiKey;
};

// Update last used timestamp and increment usage count
apiKeySchema.methods.incrementUsage = function() {
  this.lastUsedAt = new Date();
  this.usageCount += 1;
  return this.save();
};

// Revoke an API key
apiKeySchema.methods.revoke = function() {
  this.isActive = false;
  return this.save();
};

// Check if API key has expired
apiKeySchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Check if API key has permission
apiKeySchema.methods.hasPermission = function(permission) {
  if (!this.isActive) return false;
  if (this.isExpired()) return false;
  return this.permissions.includes('admin:all') || this.permissions.includes(permission);
};

module.exports = mongoose.model('APIKey', apiKeySchema);