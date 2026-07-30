const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Incident title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Incident description is required']
  },
  incidentType: {
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
      'other'
    ],
    required: [true, 'Incident type is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Severity is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'p1', 'p2', 'p3', 'p4'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'investigating', 'contained', 'eradicated', 'recovered', 'closed', 'reopened', 'false-positive'],
    default: 'new'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required']
  },
  department: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  assignedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  tags: [{
    type: String,
    trim: true
  }],
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
  affectedAssets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  }],
  affectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attackTimeline: [{
    timestamp: Date,
    event: String,
    description: String,
    mitreTactic: String,
    mitreTechnique: String,
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    source: String
  }],
  containmentActions: [{
    action: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    assetsAffected: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    }],
    usersAffected: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    effectiveness: {
      type: String,
      enum: ['effective', 'partially-effective', 'ineffective']
    },
    notes: String
  }],
  eradicationActions: [{
    action: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    assetsAffected: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    }],
    usersAffected: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    effectiveness: {
      type: String,
      enum: ['effective', 'partially-effective', 'ineffective']
    },
    notes: String
  }],
  recoveryActions: [{
    action: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    assetsAffected: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    }],
    usersAffected: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    effectiveness: {
      type: String,
      enum: ['effective', 'partially-effective', 'ineffective']
    },
    notes: String
  }],
  lessonsLearned: String,
  rootCauseAnalysis: String,
  financialImpact: {
    directLoss: Number,
    recoveryCost: Number,
    legalCost: Number,
    regulatoryFines: Number,
    reputationalDamage: Number,
    totalEstimated: Number
  },
  dataBreach: {
    occurred: {
      type: Boolean,
      default: false
    },
    recordsAffected: Number,
    dataTypes: [{
      type: String,
      enum: ['pii', 'phi', 'pci', 'ip', 'credentials', 'emails', 'documents', 'source-code', 'financial', 'health', 'other']
    }],
    notificationRequired: {
      type: Boolean,
      default: false
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    notificationDate: Date,
    regulatorNotified: [{
      type: String,
      enum: ['gdpr', 'hipaa', 'pci-dss', 'sox', 'fedramp', 'state']
    }]
  },
  complianceImpact: [{
    framework: {
      type: String,
      enum: ['gdpr', 'hipaa', 'pci-dss', 'sox', 'nist', 'iso-27001', 'cis']
    },
    requirement: String,
    status: {
      type: String,
      enum: ['compliant', 'violation', 'pending-investigation']
    },
    finding: String,
    remediation: String
  }],
  artifacts: [{
    name: String,
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
    }],
    isEvidence: {
      type: Boolean,
      default: false
    }
  }],
  aiAnalysis: {
    summary: String,
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
    suggestedActions: [String],
    similarIncidents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident'
    }],
    generatedAt: {
      type: Date
    },
    modelUsed: String
  },
  incidentNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['new', 'investigating', 'contained', 'eradicated', 'recovered', 'closed', 'reopened', 'false-positive']
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

// Generate incident number before saving
incidentSchema.pre('save', function(next) {
  if (this.isNew && !this.incidentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // This would normally query the DB for the latest incident number for today
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.incidentNumber = `INC-${year}${month}${day}-${random}`;
  }
  next();
});

// Initialize statusHistory when incident is created
incidentSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.reportedBy,
      changedAt: new Date()
    });
  }
  next();
});

// Update statusHistory when status changes
incidentSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.assignedTo || this.reportedBy,
      changedAt: new Date()
    });
  }
  next();
});

// Indexes for efficient querying
incidentSchema.index({ organization: 1, status: 1 });
incidentSchema.index({ organization: 1, severity: 1 });
incidentSchema.index({ organization: 1, incidentType: 1 });
incidentSchema.index({ organization: 1, reportedBy: 1 });
incidentSchema.index({ organization: 1, assignedTo: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);