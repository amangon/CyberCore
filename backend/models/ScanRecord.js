const mongoose = require('mongoose');

const ScanRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: mongoose.Schema.ObjectId,
    ref: 'Organization',
  },
  scanType: {
    type: String,
    enum: ['ip', 'url', 'domain', 'hash', 'file'],
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  overallThreatScore: {
    type: Number,
    default: 0,
  },
  riskLevel: {
    type: String,
    enum: ['Safe', 'Low', 'Medium', 'High', 'Critical'],
    default: 'Safe',
  },
  sources: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
summary: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    default: 'Safe',
  },
  threatLevel: {
    type: String,
    default: 'Safe',
  },
  detectionStatus: {
    type: String,
    default: 'No Threat Detected',
  },
  detectionEngines: {
    type: String,
    default: '',
  },
  detectionCount: {
    type: String,
    default: '0',
  },
  threatFamily: {
    type: String,
    default: '',
  },
  blacklistStatus: {
    type: String,
    default: '',
  },
  reputation: {
    type: String,
    default: '',
  },
  aiVerdict: {
    type: String,
    default: '',
  },
  scannedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
ScanRecordSchema.index({ user: 1, createdAt: -1 });
ScanRecordSchema.index({ organization: 1, createdAt: -1 });
ScanRecordSchema.index({ scannedAt: -1 });

module.exports = mongoose.model('ScanRecord', ScanRecordSchema);
