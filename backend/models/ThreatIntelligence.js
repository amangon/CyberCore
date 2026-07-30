const mongoose = require('mongoose');

const threatIntelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Threat intelligence title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Threat intelligence description is required']
  },
  threatType: {
    type: String,
    enum: [
      'malware', 'ransomware', 'trojan', 'worm', 'virus', 'botnet',
      'apt', 'apt-group', 'threat-actor', 'hacker-group', 'cybercriminal',
      'nation-state', 'hacktivist', 'insider-threat', 'phishing',
      'business-email-compromise', 'social-engineering', 'ransomware-as-a-service',
      'malware-as-a-service', 'exploit-kit', 'botnet-as-a-service',
      'ddos-service', 'zero-day', 'vulnerability', 'credit-card-skimming',
      'banking-trojan', 'info-stealer', 'keylogger', 'rootkit', 'backdoor',
      'wiper', 'spyware', 'adware', 'potentially-unwanted-program',
      'credential-theft', 'data-exfiltration', 'crypto-miner', 'botnet', 'other'
    ],
    required: [true, 'Threat type is required']
  },
  threatActor: {
    name: {
      type: String,
      trim: true
    },
    alias: [{
      type: String,
      trim: true
    }],
    motivation: {
      type: String,
      enum: [
        'financial-gain', 'espionage', 'sabotage', 'hacktivism',
        'personal-grudge', 'recognition', 'insider-threat', 'competitive-advantage',
        'ideological', 'terrorism', 'warfare', 'unknown', 'other'
      ]
    },
    sophistication: {
      type: String,
      enum: ['novice', 'intermediate', 'advanced', 'expert', 'nation-state'],
      default: 'intermediate'
    },
    resources: {
      type: String,
      enum: ['individual', 'small-group', 'organized-group', 'state-sponsored'],
      default: 'small-group'
    },
    motivationDescription: String
  },
  indicators: [{
    type: {
      type: String,
      enum: [
        'ip-address', 'domain', 'url', 'file-hash-md5', 'file-hash-sha1',
        'file-hash-sha256', 'file-hash-ssdeep', 'email-address', 'email-subject',
        'email-body', 'registry-key', 'registry-value', 'mutex', 'user-agent',
        'file-path', 'process-name', 'service-name', 'driver-name', 'dll',
        'registry-key', 'registry-value', 'file-path', 'process-name',
        'service-name', 'driver-name', 'dll', 'tcp-port', 'udp-port',
        'website-title', 'website-description', 'html-title', 'html-meta',
        'javascript', 'css', 'image-hash', 'pdf-hash', 'office-doc-hash',
        'android-apk', 'ios-app', 'windows-service', 'linux-service',
        'scheduled-task', 'cron-job', 'startup-item', 'browser-extension',
        'email-header', 'user-agent', 'ssl-cert-subject', 'ssl-cert-issuer',
        'ssl-cert-serial', 'ssl-cert-fingerprint', 'certificate-hash',
        'asn', 'bgp-prefix', 'whois-email', 'whois-phone', 'whois-address',
        'whois-name', 'whois-org', 'Facebook', 'Twitter', 'Instagram',
        'LinkedIn', 'GitHub', 'Bitcoin-address', 'Ethereum-address',
        'monero-address', 'zcash-address', 'dash-address', 'litecoin-address',
        'ripple-address', 'stellar-address', 'dogecoin-address',
        'other-cryptocurrency-address', 'file-path', 'registry-key',
        'registry-value', 'mutex', 'user-agent', 'ssl-cert', 'network-traffic',
        'dns-query', 'http-method', 'http-user-agent', 'http-referer',
        'http-cookie', 'http-header', 'http-parameter', 'http-body',
        'smtp-header', 'smtp-body', 'pop3-command', 'imap-command',
        'ftp-command', 'telnet-command', 'ssh-command', 'rdp-command',
        'vnc-command', 'icmp-type', 'arp-request', 'dga-domain',
        'mutual-ssl-tls', 'ssl-tls-version', 'ssl-tls-cipher',
        'ssl-tls-extension', 'ja3-hash', 'ja3s-hash', 'other'
      ]
    },
    value: {
      type: String,
      required: true
    },
    description: String,
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
      'internal', 'external', 'commercial-feed', 'open-source',
      'government', 'isac', 'cisa', 'ncsc', 'fs-isac',
      'other'
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
    firstSeen: Date,
    lastSeen: Date,
    ttl: Number,
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
    }]
  }],
  attribution: {
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high', 'confirmed'],
      default: 'medium'
    },
    country: [{
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
    }],
    organization: [{
      type: String,
      trim: true
    }],
    malwareFamily: [{
      type: String,
      trim: true
    }],
    campaign: [{
      type: String,
      trim: true
    }],
    tool: [{
      type: String,
      trim: true
    }]
  },
  malwareFamilies: [{
    name: {
      type: String,
      trim: true,
      required: true
    },
    alias: [{
      type: String,
      trim: true
    }],
    description: String,
    firstSeen: Date,
    lastSeen: Date,
    prevalence: {
      type: String,
      enum: ['rare', 'uncommon', 'common', 'widespread', 'epidemic'],
      default: 'uncommon'
    },
    platforms: [{
      type: String,
      enum: [
        'windows', 'macos', 'linux', 'android', 'ios',
        'network-device', 'iot-device', 'scada', 'ics',
        'mainframe', 'unix', 'bsd', 'solaris', 'other'
      ]
    }],
    fileTypes: [{
      type: String,
      enum: [
        'exe', 'dll', 'sys', 'bat', 'cmd', 'vbs', 'js', 'wsf',
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'zip', 'rar', '7z', 'iso', 'img', 'bin',
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff',
        'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv',
        'apk', 'ipa', 'app', 'deb', 'rpm',
        'ini', 'conf', 'cfg', 'txt', 'log',
        'sql', 'bak', 'old', 'tmp', 'bak',
        'other'
      ]
    }],
    capabilities: [{
      type: String,
      enum: [
        'data-exfiltration', 'data-encryption', 'data-destruction',
        'credential-theft', 'privilege-escalation', 'persistence',
        'lateral-movement', 'discovery', 'collection',
        'command-and-control', 'anti-analysis', 'anti-vm',
        'anti-debugging', 'code-injection', 'process-injection',
        'dll-injection', 'reflective-dll-injection', 'process-hollowing',
        'process-doppelganging', 'process-herpaderping',
        'hook-injection', 'apc-injection', 'thread-hijacking',
        'process-replacement', 'timestomping', 'fileless',
        'registry-modules',
        'signed-binary-proxy-execution', 'signed-binary-proxy-execution',
        'binary-padding', 'timestomping', 'file-deletion',
        'indicator-removal-on-host', 'indicator-removal-on-host',
        'timestomping', 'timestomping', 'timestomping', 'timestomping',
        'timestomping', 'timestomping', 'timestomping', 'timestomping',
        'other'
      ]
    }],
    behavior: [{
      type: String,
      enum: [
        'network-traffic', 'file-system', 'registry', 'process',
        'service', 'driver', 'scheduled-task', 'startup-item',
        'browser-extension', 'email', 'dns', 'http', 'https',
        'smtp', 'pop3', 'imap', 'ftp', 'telnet', 'ssh', 'rdp',
        'vnc', 'icmp', 'arp', 'other'
      ]
    }]
  }],
  toolkits: [{
    name: {
      type: String,
      trim: true,
      required: true
    },
    version: String,
    description: String,
    firstSeen: Date,
    lastSeen: Date,
    providers: [{
      type: String,
      trim: true
    }],
    license: {
      type: String,
      enum: ['open-source', 'commercial', 'freeware', 'shareware', 'proprietary', 'unknown'],
      default: 'unknown'
    },
    capabilities: [{
      type: String,
      enum: [
        'vulnerability-scanning', 'exploitation', 'post-exploitation',
        'privilege-escalation', 'persistence', 'lateral-movement',
        'data-exfiltration', 'command-and-control', 'defense-evasion',
        'credential-access', 'discovery', 'collection',
        'anti-forensics', 'pivoting', 'tunneling', 'proxy',
        'socks-proxy', 'http-proxy', 'dns-tunneling', 'icmp-tunneling',
        'payload-generation', 'obfuscation', 'encryption', 'packing',
        'anti-analysis', 'anti-vm', 'anti-debugging', 'fuzzing',
        'exploit-development', 'reverse-engineering', 'malware-development',
        'vulnerability-research', 'threat-intel', 'osint', 'social-engineering',
        'phishing', 'credential-harvesting', 'brute-force', 'password-spraying',
        'credential-stuffing', 'account-takeover', 'session-hijacking',
        'cookie-theft', 'man-in-the-middle', 'ssl-stripping', 'downgrade-attack',
        'rebinding-attack', 'dns-hijacking', 'bgp-hijacking', 'route-hijacking',
        'man-in-the-middle', 'ssl-stripping', 'downgrade-attack',
        'rebinding-attack', 'dns-hijacking', 'bgp-hijacking', 'route-hijacking',
        'other'
      ]
    }],
    platforms: [{
      type: String,
      enum: [
        'windows', 'macos', 'linux', 'android', 'ios',
        'network-device', 'iot-device', 'scada', 'ics',
        'mainframe', 'unix', 'bsd', 'solaris', 'other'
      ]
    }]
  }],
  campaigns: [{
    name: {
      type: String,
      trim: true,
      required: true
    },
    alias: [{
      type: String,
      trim: true
    }],
    description: String,
    firstSeen: Date,
    lastSeen: Date,
    objectives: [{
      type: String,
      enum: [
        'espionage', 'sabotage', 'financial-theft', 'data-theft',
        'intellectual-property-theft', 'credentials-theft',
        'infrastructure-disruption', 'reputation-damage',
        'political-influence', 'ideological-promotion',
        'terrorist-activity', 'ransomware', 'ddos', 'botnet',
        'spyware', 'adware', 'crypto-mining', 'business-disruption',
        'supply-chain-compromise', 'manufacturing-disruption',
        'financial-fraud', 'identity-theft', 'account-takeover',
        'business-email-compromise', 'wire-fraud', 'ach-fraud',
        'credit-card-fraud', 'gift-card-fraud', 'loyalty-fraud',
        'insider-threat', 'privilege-abuse', 'data-manipulation',
        'data-destruction', 'ransomware', 'wiper', 'other'
      ]
    }],
    targets: [{
      type: String,
      enum: [
        'government', 'military', 'intelligence', 'diplomatic',
        'financial-services', 'banking', 'insurance', 'investment',
        'healthcare', 'hospital', 'clinic', 'pharma', 'biotech',
        'energy', 'power-grid', 'oil', 'gas', 'renewable',
        'manufacturing', 'automotive', 'aerospace', 'defense',
        'technology', 'software', 'hardware', 'telecom', 'isp',
        'media', 'entertainment', 'gaming', 'sports',
        'retail', 'ecommerce', 'hospitality', 'travel', 'airline',
        'education', 'school', 'university', 'research',
        'religious', 'non-profit', 'ngo', 'charity',
        'agriculture', 'farming', 'livestock', 'fisheries',
        'mining', 'construction', 'real-estate', 'property',
        'legal', 'law-firm', 'consulting', 'accounting',
        'transportation', 'logistics', 'shipping', 'rail',
        'maritime', 'port', 'airport', 'logistics-hub',
        'other'
      ]
    }],
    industries: [{
      type: String,
      enum: [
        'government', 'defense', 'intelligence',
        'financial-services', 'banking', 'insurance', 'investment',
        'healthcare', 'pharmaceuticals', 'biotechnology',
        'energy', 'utilities', 'oil-and-gas', 'renewable-energy',
        'manufacturing', 'automotive', 'aerospace', 'defense',
        'technology', 'software', 'hardware', 'telecommunications',
        'media', 'entertainment', 'gaming', 'sports',
        'retail', 'e-commerce', 'hospitality', 'travel', 'aviation',
        'education', 'research', 'academic',
        'religious', 'non-profit', 'ngo', 'charity',
        'agriculture', 'fishing', 'forestry', 'mining',
        'construction', 'real-estate', 'property-management',
        'legal', 'law', 'consulting', 'accounting', 'financial-services',
        'transportation', 'logistics', 'supply-chain', 'shipping',
        'maritime', 'aviation', 'rail', 'other'
      ]
    }],
    geolocations: [{
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
    }],
    infrastructure: [{
      type: String,
      enum: [
        'ip-address', 'domain', 'url', 'hostname', 'asn', 'bgp',
        'whois-record', 'dns-record', 'mx-record', 'txt-record',
        'spf-record', 'dkim-record', 'dmarc-record', 'nameserver',
        'web-server', 'ftp-server', 'mail-server', 'dns-server',
        'dhcp-server', 'domain-controller', 'sql-server',
        'exchange-server', 'sharepoint-server', 'active-directory',
        'ldap-server', 'radius-server', 'vpn-server', 'proxy-server',
        'load-balancer', 'firewall', 'ids', 'ips', 'waf', 'reverse-proxy',
        'cdn', 'cloud-storage', 'blob-storage', 'object-storage',
        'database-server', 'nosql-database', 'message-queue',
        'cache-server', 'load-balancer', 'application-server',
        'web-api', 'rest-api', 'soap-api', 'graphql-api',
        'microservice', 'container', 'docker', 'kubernetes',
        'virtual-machine', 'hypervisor', 'bare-metal', 'other'
      ]
    }]
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sources: [{
    name: {
      type: String,
      trim: true,
      required: true
    },
    type: {
      type: String,
      enum: [
        'government', 'isac', 'vendor', 'open-source', 'commercial',
        'research', 'academic', 'crowd-sourced', 'honeynet',
        'malware-sandbox', 'threat-actor-tracking', 'incident-response',
        'malware-reversing', 'vulnerability-research', 'exploit-db',
        'packet-forensics', 'network-traffic-analysis', 'log-analysis',
        'memory-analysis', 'disk-forensics', 'mobile-forensics',
        'cloud-forensics', 'iot-forensics', 'social-media', 'dark-web',
        'deep-web', 'paste-site', 'code-repository', 'forum', 'blog',
        'news-article', 'research-paper', 'whitepaper', 'blog-post',
        'twitter', 'reddit', 'discord', 'telegram', 'signal', 'whats-app',
        'other'
      ],
      required: true
    },
    url: {
      type: String,
      trim: true
    },
    apiKey: String,
    apiSecret: String,
    username: String,
    password: String,
    lastUpdated: Date,
    updateFrequency: {
      type: String,
      enum: [
        'real-time', 'hourly', 'daily', 'weekly', 'monthly',
        'quarterly', 'biannually', 'annually', 'as-needed', 'never'
      ],
      default: 'daily'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    trustLevel: {
      type: String,
      enum: ['unverified', 'low', 'medium', 'high', 'trusted'],
      default: 'medium'
    },
    reliability: {
      type: String,
      enum: ['unverified', 'low', 'medium', 'high', 'confirmed'],
      default: 'medium'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  ttl: {
    type: Number,
    default: 30 // days
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
threatIntelSchema.index({ 'indicators.value': 1 });
threatIntelSchema.index({ 'indicators.type': 1 });
threatIntelSchema.index({ 'malwareFamilies.name': 1 });
threatIntelSchema.index({ 'toolkits.name': 1 });
threatIntelSchema.index({ 'campaigns.name': 1 });
threatIntelSchema.index({ 'attribution.country': 1 });
threatIntelSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ThreatIntelligence', threatIntelSchema);