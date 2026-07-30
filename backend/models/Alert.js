const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Alert description is required']
  },
  alertType: {
    type: String,
    enum: [
      'malware', 'ransomware', 'phishing', 'ddos', 'brute-force',
      'insider-threat', 'data-exfiltration', 'privilege-escalation',
      'lateral-movement', 'command-control', 'privilege-abuse',
      'account-compromise', 'web-application', 'supply-chain',
      'zero-day', 'apt', 'insider-threat', 'credential-theft',
      'business-email-compromise', 'crypto-mining', 'data-breach',
      'policy-violation', 'misconfiguration', 'vulnerability-exploit',
      'social-engineering', 'spoofing', 'tampering', 'repudiation',
      'information-disclosure', 'denial-of-service', 'elevation-of-privilege',
      'anomaly', 'behavioral', 'signature-based', 'heuristic', 'other'
    ],
    required: [true, 'Alert type is required']
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    required: [true, 'Severity is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'p1', 'p2', 'p3', 'p4'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'investigating', 'acknowledged', 'suppressed', 'false-positive', 'resolved', 'closed'],
    default: 'new'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required']
  },
  source: {
    type: String,
    enum: [
      'firewall', 'ids', 'ips', 'antivirus', 'edr', 'siem', 'log-analysis',
      'network-traffic', 'endpoint', 'user-behavior', 'application',
      'database', 'cloud', 'email-gateway', 'web-proxy', 'dns', 'vpn',
      'threat-intelligence', 'vulnerability-scanner', 'api', 'custom-script',
      'manual-entry', 'other'
    ],
    required: [true, 'Alert source is required']
  },
  sourceId: {
    type: String,
    trim: true
  },
  sourceName: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  relatedIncident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  relatedCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  relatedAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  sourceTimestamp: {
    type: Date,
    required: [true, 'Source timestamp is required']
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  indicatorsOfCompromise: [{
    type: {
      type: String,
      enum: ['ip-address', 'domain', 'url', 'file-hash', 'email-address', 'registry-key', 'mutex', 'user-agent', 'file-path', 'process-name', 'registry-value', 'other']
    },
    value: {
      type: String,
      required: true
    },
    description: String,
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    source: {
      type: String,
      enum: ['internal', 'external', 'threat-intelligence', 'user-report']
    },
    firstSeen: Date,
    lastSeen: Date,
    ttl: Number,
    tags: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  mitreAttck: [{
    tactic: {
      type: String,
      enum: [
        'reconnaissance', 'resource-development', 'initial-access',
        'execution', 'persistence', 'privilege-escalation',
        'defense-evasion', 'credential-access', 'discovery',
        'lateral-movement', 'collection', 'command-and-control',
        'exfiltration', 'impact'
      ]
    },
    technique: {
      type: String
    },
    techniqueId: {
      type: String
    },
    subTechnique: {
      type: String
    },
    subTechniqueId: {
      type: String
    }
  }],
  rawLog: {
    type: String,
    maxlength: 10000
  },
  processedLog: {
    type: String,
    maxlength: 10000
  },
  aiAnalysis: {
    isMalicious: {
      type: Boolean,
      default: false
    },
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
    falsePositiveLikelihood: {
      type: Number,
      min: 0,
      max: 100
    },
    suggestedActions: [String],
    similarAlerts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert'
    }],
    generatedAt: {
      type: Date
    },
    modelUsed: String
  },
  alertId: {
    type: String,
    unique: true,
    sparse: true
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['new', 'investigating', 'acknowledged', 'suppressed', 'false-positive', 'resolved', 'closed']
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

// Generate alert ID before saving
alertSchema.pre('save', function(next) {
  if (this.isNew && !this.alertId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // This would normally query the DB for the latest alert ID for today
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.alertId = `ALT-${year}${month}${day}-${random}`;
  }
  next();
});

// Initialize statusHistory when alert is created
alertSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.assignedTo || null, // Initially unassigned
      changedAt: new Date()
    });
  }
  next();
});

// Update statusHistory when status changes
alertSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.assignedTo || null,
      changedAt: new Date()
    });
  }
  next();
});

// Indexes for efficient querying
alertSchema.index({ organization: 1, status: 1 });
alertSchema.index({ organization: 1, severity: 1 });
alertSchema.index({ organization: 1, alertType: 1 });
alertSchema.index({ organization: 1, source: 1 });
alertSchema.index({ organization: 1, assignedTo: 1 });
alertSchema.index({ sourceTimestamp: -1 });
alertSchema.index({ receivedAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);