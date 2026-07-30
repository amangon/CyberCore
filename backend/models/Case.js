const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Case description is required']
  },
  caseNumber: {
    type: String,
    unique: true,
    required: [true, 'Case number is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'pending-review', 'closed', 'reopened'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required']
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  leadInvestigator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lead investigator is required']
  },
  investigators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  incidents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  classification: {
    type: String,
    enum: ['incident-response', 'threat-hunting', 'vulnerability-management', 'compliance-audit', 'forensics', 'threat-intelligence'],
    default: 'incident-response'
  },
  timeline: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    event: {
      type: String,
      required: true
    },
    description: String,
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    evidence: [{
      type: String
    }]
  }],
  evidence: [{
    type: {
      type: String,
      enum: ['file', 'screenshot', 'log', 'network-pcap', 'memory-dump', 'registry-hive', 'other']
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    hash: {
      md5: String,
      sha1: String,
      sha256: String
    },
    chainOfCustody: [{
      handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      action: {
        type: String,
        enum: ['collected', 'analyzed', 'stored', 'transferred', 'released']
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      notes: String
    }]
  }],
  aiAnalysis: {
    summary: String,
    timelineReconstruction: String,
    attackVector: String,
    impactAssessment: String,
    attribution: String,
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100
    },
    generatedAt: {
      type: Date
    },
    modelUsed: String
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['open', 'in-progress', 'pending-review', 'closed', 'reopened']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate case number before saving
caseSchema.pre('save', function(next) {
  if (this.isNew && !this.caseNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // This would normally query the database for the latest case number for today
    // For simplicity, we're using a timestamp-based approach
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.caseNumber = `CASE-${year}${month}${day}-${random}`;
  }
  next();
});

// Initialize statusHistory when case is created
caseSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.leadInvestigator,
      changedAt: new Date()
    });
  }
  next();
});

// Update statusHistory when status changes
caseSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.leadInvestigator,
      changedAt: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('Case', caseSchema);