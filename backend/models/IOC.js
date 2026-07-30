const mongoose = require('mongoose');

const iocSchema = new mongoose.Schema({
  value: {
    type: String,
    required: [true, 'IOC value is required'],
    trim: true
  },
  type: {
    type: String,
    enum: [
      'ip-address-v4', 'ip-address-v6', 'domain', 'hostname', 'url',
      'file-hash-md5', 'file-hash-sha1', 'file-hash-sha256', 'file-hash-ssdeep',
      'email-address', 'email-subject', 'email-body',
      'registry-key', 'registry-value', 'mutex', 'user-agent',
      'file-path', 'process-name', 'service-name', 'driver-name', 'dll',
      'tcp-port', 'udp-port', 'icmp-type', 'arp-mac',
      'windows-service', 'linux-service', 'scheduled-task', 'cron-job',
      'startup-item', 'browser-extension', 'email-header',
      'ssl-cert-subject', 'ssl-cert-issuer', 'ssl-cert-serial',
      'ssl-cert-fingerprint', 'certificate-hash',
      'asn', 'bgp-asn', 'bgp-prefix', 'whois-email', 'whois-phone',
      'whois-address', 'whois-name', 'whois-org',
      'facebook', 'twitter', 'instagram', 'linkedin', 'github',
      'bitcoin-address', 'ethereum-address', 'monero-address',
      'zcash-address', 'dash-address', 'litecoin-address',
      'ripple-address', 'stellar-address', 'dogecoin-address',
      'other-cryptocurrency-address',
      'file-path', 'registry-key', 'registry-value', 'mutex',
      'user-agent', 'ssl-cert', 'network-traffic', 'dns-query',
      'http-method', 'http-user-agent', 'http-referer',
      'http-cookie', 'http-header', 'http-parameter', 'http-body',
      'smtp-header', 'smtp-body', 'pop3-command', 'imap-command',
      'ftp-command', 'telnet-command', 'ssh-command', 'rdp-command',
      'vnc-command', 'icmp-type', 'arp-request', 'dga-domain',
      'mutual-ssl-tls', 'ssl-tls-version', 'ssl-tls-cipher',
      'ssl-tls-extension', 'ja3-hash', 'ja3s-hash', 'ssl-cert',
      ' certificate-transparency', 'certificate-transparency-log',
      'passive-dns', 'passive-dns-response', 'ssl-certificates',
      'ssl-server-test', 'ssl-labs-test', 'other'
    ],
    required: [true, 'IOC type is required']
  },
  description: {
    type: String,
    trim: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: [
      'internal', 'external', 'threat-intelligence', 'malware-analysis',
      'vulnerability-scanner', 'ids-alert', 'ips-alert', 'firewall-log',
      'antivirus-alert', 'edr-alert', 'siem-alert', 'log-analysis',
      'network-traffic', 'email-gateway', 'web-proxy', 'dns-server',
      'vpn-log', 'authentication-log', 'directory-service',
      'application-log', 'database-log', 'cloud-trail', 'azure-ad',
      'g-suite', 'okta', 'duo', 'ping-identity', 'saml', 'ldap',
      'radius', 'tacacs+', 'kerberos', 'ntlm', 'ssh', 'telnet',
      'ftp', 'sftp', 'http', 'https', 'smtp', 'pop3', 'imap',
      'dns', 'dhcp', 'arp', 'icmp', 'snmp', 'ntp', 'ldap',
      'kerberos', 'radius', 'tacacs+', 'ntp', 'dhcp', 'dns',
      'http', 'https', 'ftp', 'sftp', 'ssh', 'telnet', 'mysql',
      'postgres', 'mongodb', 'redis', 'memcached', 'elasticsearch',
      'rabbitmq', 'kafka', 'zookeeper', 'consul', '-etcd', 'vrrp',
      'hsrp', 'glbp', 'stp', 'vtp', 'cdp', 'ldp', 'rsvp',
      'bgp', 'ospf', 'isis', 'rip', 'eigrp', 'mpls', 'vpns',
      'l2tp', 'pptp', 'sstp', 'ikev1', 'ikev2', 'ipsec', 'ssl',
      'tls', 'dtls', 'srtp', 'srtcp', 'mgcp', 'sip', 'h323',
      'radius', 'tacacs+', 'kerberos', 'other'
    ]
  },
  sourceName: {
    type: String,
    trim: true
  },
  sourceReference: {
    type: String,
    trim: true
  },
  firstSeen: {
    type: Date,
    required: [true, 'First seen date is required']
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  ttl: {
    type: Number,
    default: 30 // days
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  killChainPhase: {
    type: String,
    enum: [
      'reconnaissance', 'weaponization', 'delivery', 'exploitation',
      'installation', 'command-and-control', 'actions-on-objectives'
    ]
  },
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
    }
  }],
  context: {
    malwareFamily: {
      type: String,
      trim: true
    },
    threatActor: {
      type: String,
      trim: true
    },
    campaign: {
      type: String,
      trim: true
    },
    tool: {
      type: String,
      trim: true
    },
    vulnerability: {
      type: String,
      trim: true
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident'
    },
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert'
    },
    threatIntelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThreatIntelligence'
    }
  },
  geolocation: {
    country: {
      type: String,
      enum: [
        'afghanistan', 'albania', 'algeria', 'andorra', 'angola',
        'antigua-and-barbuda', 'argentina', 'armenia', 'australia',
        'austria', 'azerbaijan', 'bahamas', 'bahrain', 'bangladesh',
        'barbados', 'belarus', 'belgium', 'belize', 'benin', 'bhutan',
        'bolivia', 'bosnia-and-herzegovina', 'botswana', 'brazil',
        'brunei', 'bulgaria', 'burkina-faso', 'burundi', 'cabo-verde',
        'cambodia', 'cameroon', 'canada', 'central-african-republic',
        'chad', 'chile', 'china', 'colombia', 'comoros', 'congo',
        'democratic-republic-of-the-congo', 'costa-rica', 'croatia',
        'cuba', 'cyprus', 'czech-republic', 'denmark', 'djibouti',
        'dominica', 'dominican-republic', 'ecuador', 'egypt', 'el-salvador',
        'equatorial-guinea', 'eritrea', 'estonia', 'eswatini', 'ethiopia',
        'fiji', 'finland', 'france', 'gabon', 'gambia', 'georgia',
        'germany', 'ghana', 'greece', 'grenada', 'guatemala', 'guinea',
        'guinea-bissau', 'guyana', 'haiti', 'holy-see', 'honduras',
        'hungary', 'iceland', 'india', 'indonesia', 'iran', 'iraq',
        'ireland', 'israel', 'italy', 'jamaica', 'japan', 'jordan',
        'kazakhstan', 'kenya', 'kiribati', 'korea-north', 'korea-south',
        'kosovo', 'kuwait', 'kyrgyzstan', 'laos', 'latvia', 'lebanon',
        'lesotho', 'liberia', 'libya', 'liechtenstein', 'lithuania',
        'luxembourg', 'madagascar', 'malawi', 'malaysia', 'maldives',
        'mali', 'malta', 'marshal-islands', 'mauritania', 'mauritius',
        'mexico', 'micronesia', 'moldova', 'monaco', 'mongolia',
        'montenegro', 'morocco', 'mozambique', 'myanmar', 'namibia',
        'nauru', 'nepal', 'netherlands', 'new-zealand', 'nicaragua',
        'niger', 'nigeria', 'north-macedonia', 'norway', 'oman',
        'pakistan', 'palau', 'panama', 'papua-new-guinea', 'paraguay',
        'peru', 'philippines', 'poland', 'portugal', 'qatar',
        'romania', 'russia', 'rwanda', 'saint-kitts-and-nevis',
        'saint-lucia', 'saint-vincent-and-the-grenadines', 'samoa',
        'san-marino', 'sao-tome-and-principe', 'saudi-arabia',
        'senegal', 'serbia', 'seychelles', 'sierra-leone', 'singapore',
        'slovakia', 'slovenia', 'solomon-islands', 'somalia',
        'south-africa', 'south-sudan', 'spain', 'sri-lanka', 'sudan',
        'suriname', 'sweden', 'switzerland', 'syria', 'taiwan',
        'tajikistan', 'tanzania', 'thailand', 'timor-leste', 'togo',
        'tonga', 'trinidad-and-tobago', 'tunisia', 'turkey',
        'turkmenistan', 'tuvalu', 'uganda', 'ukraine', 'united-arab-emirates',
        'united-kingdom', 'united-states', 'uruguay', 'uzbekistan',
        'vanuatu', 'vatican-city', 'venezuela', 'vietnam', 'yemen',
        'zambia', 'zimbabwe', 'unknown'
      ]
    },
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timezone: String,
    isp: String,
    organization: String,
    asn: Number,
    asName: String
  },
  relatedIoCs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IOC'
  }],
  falsePositive: {
    type: Boolean,
    default: false
  },
  falsePositiveReason: String,
  whitelisted: {
    type: Boolean,
    default: false
  },
  whitelistedReason: String,
  blacklisted: {
    type: Boolean,
    default: false
  },
  blacklistedReason: String,
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
iocSchema.index({ value: 1, type: 1 }, { unique: true });
iocSchema.index({ type: 1 });
iocSchema.index({ value: 1 });
iocSchema.index({ firstSeen: -1 });
iocSchema.index({ lastSeen: -1 });
iocSchema.index({ isActive: 1 });
iocSchema.index({ falsePositive: 1 });
iocSchema.index({ whitelisted: 1 });
iocSchema.index({ blacklisted: 1 });
iocSchema.index({ 'context.malwareFamily': 1 });
iocSchema.index({ 'context.threatActor': 1 });
iocSchema.index({ 'context.campaign': 1 });

module.exports = mongoose.model('IOC', iocSchema);
