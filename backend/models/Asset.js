const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assetType: {
    type: String,
    enum: [
      'workstation', 'server', 'laptop', 'mobile-device', 'tablet',
      'network-device', 'firewall', 'router', 'switch', 'load-balancer',
      'database', 'application-server', 'web-server', 'dns-server',
      'dhcp-server', 'domain-controller', 'email-server', 'file-server',
      'backup-system', 'ids-ips', 'vpn-gateway', 'proxy-server',
      'cloud-instance', 'container', 'virtual-machine', 'iot-device',
      'printer', 'scanner', 'other'
    ],
    required: [true, 'Asset type is required']
  },
  hostname: {
    type: String,
    trim: true,
    unique: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  macAddress: {
    type: String,
    trim: true
  },
  operatingSystem: {
    name: String,
    version: String,
    architecture: String
  },
  manufacturer: String,
  model: String,
  serialNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  assetTag: {
    type: String,
    unique: true,
    sparse: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required']
  },
  location: {
    site: String,
    building: String,
    floor: String,
    room: String,
    rack: String,
    position: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'retired', 'decommissioned', 'lost-stolen'],
    default: 'active'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  criticality: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  compliance: {
    frameworks: [{
      type: String,
      enum: ['gdpr', 'hipaa', 'pci-dss', 'sox', 'nist', 'iso-27001', 'cis']
    }],
    status: {
      type: String,
      enum: ['compliant', 'non-compliant', 'partial', 'not-assessed']
    },
    lastAssessed: Date,
    nextAssessmentDue: Date
  },
  networkInterfaces: [{
    name: String,
    macAddress: String,
    ipAddress: String,
    ipv6Address: String,
    subnetMask: String,
    gateway: String,
    dhcpEnabled: Boolean
  }],
  installedSoftware: [{
    name: String,
    version: String,
    vendor: String,
    installDate: Date,
    licenseKey: String
  }],
  openPorts: [{
    port: Number,
    protocol: String,
    service: String,
    state: String
  }],
  vulnerabilities: [{
    cveId: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    cvssScore: Number,
    description: String,
    publishedDate: Date,
    modifiedDate: Date,
    references: [String],
    status: {
      type: String,
      enum: ['open', 'in-progress', 'remediated', 'false-positive', 'risk-accepted']
    },
    remediation: String,
    remediatedDate: Date,
    remediatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  lastSeen: {
    type: Date,
    default: Date.now
  },
  lastScanned: {
    type: Date
  },
  isAgentInstalled: {
    type: Boolean,
    default: false
  },
  agentVersion: String,
  lastAgentCheckin: Date,
  isMonitored: {
    type: Boolean,
    default: true
  },
  monitoringAgent: {
    type: String,
    enum: ['wazuh', 'osquery', 'carbon-black', 'crowdstrike', 'sentinelone', 'microsoft-defender', 'other']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
assetSchema.index({ organization: 1, hostname: 1 });
assetSchema.index({ organization: 1, ipAddress: 1 });
assetSchema.index({ organization: 1, assetTag: 1 });
assetSchema.index({ organization: 1, serialNumber: 1 });

module.exports = mongoose.model('Asset', assetSchema);