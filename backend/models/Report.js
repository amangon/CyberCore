const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Executive', 'Threat', 'Vulnerability', 'Compliance', 'Incident',
      'IOC', 'MITRE', 'Asset', 'Security Score', 'Risk'
    ],
    default: 'Executive'
  },
  department: {
    type: String,
    trim: true
  },
  format: {
    type: String,
    enum: ['PDF', 'CSV', 'JSON', 'EXCEL', 'HTML'],
    default: 'PDF'
  },
  status: {
    type: String,
    enum: ['Completed', 'Scheduled', 'Failed', 'Draft', 'Archived'],
    default: 'Draft'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  author: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  payload: {
    type: mongoose.Schema.Types.Mixed
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate report ID before saving
reportSchema.pre('save', function(next) {
  if (this.isNew && !this.reportId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.reportId = `RPT-${year}${month}-${random}`;
  }
  next();
});

// Indexes
reportSchema.index({ organization: 1, status: 1 });
reportSchema.index({ organization: 1, category: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
