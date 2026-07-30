const mongoose = require('mongoose');

const yaraRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'YARA rule name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    trim: true,
    default: '1.0'
  },
  reference: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  modified: {
    type: Date
  },
  strings: [{
    type: {
      type: String,
      enum: ['string', 'hex', 'regexp', 'integer'],
      required: true
    },
    identifier: {
      type: String,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // Can be string, hex, regexp, or integer
      required: true
    },
    modifiers: [{
      type: String,
      enum: [
        'nocase', 'ascii', 'wide', 'fullword',
        'private', 'global', 'thumb', 'big_endian',
        'little_endian', 'giant_endian', 'len', 'length',
        'offset', 'vmin', 'vmax', 'in', 'matches',
        'private', 'global'
      ]
    }]
  }],
  condition: {
    type: String,
    required: [true, 'YARA rule condition is required']
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: [{
    key: {
      type: String,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  source: {
    type: String,
    enum: ['internal', 'external', 'community', 'commercial', 'research'],
    default: 'internal'
  },
  sourceReference: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number,
    min: 0
  },
  hash: {
    md5: String,
    sha1: String,
    sha256: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
yaraRuleSchema.index({ name: 1 });
yaraRuleSchema.index({ tags: 1 });
yaraRuleSchema.index({ source: 1 });
yaraRuleSchema.index({ severity: 1 });
yaraRuleSchema.index({ isActive: 1 });
yaraRuleSchema.index({ isEnabled: 1 });
yaraRuleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('YaraRule', yaraRuleSchema);