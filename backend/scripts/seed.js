'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');

// ── Models ────────────────────────────────────────────────────────────────────
const User             = require('../models/User');
const Organization     = require('../models/Organization');
const Team             = require('../models/Team');
const Asset            = require('../models/Asset');
const Alert            = require('../models/Alert');
const Incident         = require('../models/Incident');
const Case             = require('../models/Case');
const ThreatIntel      = require('../models/ThreatIntelligence');
const IOC              = require('../models/IOC');
const Vulnerability    = require('../models/Vulnerability');
const YaraRule         = require('../models/YaraRule');

// ── Helpers ───────────────────────────────────────────────────────────────────
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randF = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

/** Random date within the last `days` days */
const randDate = (days = 90) => {
  const ms = Date.now() - rand(0, days * 86_400_000);
  return new Date(ms);
};

/** Zero-pad number */
const zp = (n, w = 4) => String(n).padStart(w, '0');

// ── Static reference data ─────────────────────────────────────────────────────

const SEVERITIES   = ['low', 'medium', 'high', 'critical'];
const SEV_WEIGHTS  = [0.15, 0.40, 0.30, 0.15]; // realistic distribution

/** Weighted severity pick */
const pickSev = () => {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < SEVERITIES.length; i++) {
    acc += SEV_WEIGHTS[i];
    if (r < acc) return SEVERITIES[i];
  }
  return 'medium';
};

const COUNTRIES_GEO = [
  { country: 'russia',        lat:  55.75,  lon:  37.62 },
  { country: 'china',         lat:  39.91,  lon: 116.39 },
  { country: 'iran',          lat:  35.69,  lon:  51.42 },
  { country: 'korea-north',   lat:  39.03,  lon: 125.75 },
  { country: 'united-states', lat:  38.90,  lon: -77.04 },
  { country: 'ukraine',       lat:  50.45,  lon:  30.52 },
  { country: 'brazil',        lat: -15.78,  lon: -47.93 },
  { country: 'india',         lat:  28.61,  lon:  77.21 },
  { country: 'germany',       lat:  52.52,  lon:  13.40 },
  { country: 'romania',       lat:  44.43,  lon:  26.10 },
  { country: 'nigeria',       lat:   6.45,  lon:   3.40 },
  { country: 'vietnam',       lat:  21.03,  lon: 105.85 },
  { country: 'turkey',        lat:  39.93,  lon:  32.86 },
  { country: 'pakistan',      lat:  33.72,  lon:  73.04 },
  { country: 'indonesia',     lat:  -6.21,  lon: 106.85 },
  { country: 'united-kingdom',lat:  51.51,  lon:  -0.13 },
  { country: 'france',        lat:  48.86,  lon:   2.35 },
  { country: 'israel',        lat:  31.77,  lon:  35.22 },
];

const APT_GROUPS = [
  { name: 'APT28', aliases: ['Fancy Bear','Sofacy','Pawn Storm'], country: 'russia',      motivation: 'espionage' },
  { name: 'APT29', aliases: ['Cozy Bear','The Dukes'],            country: 'russia',      motivation: 'espionage' },
  { name: 'APT10', aliases: ['Stone Panda','MenuPass'],           country: 'china',       motivation: 'espionage' },
  { name: 'APT41', aliases: ['Double Dragon','Winnti'],           country: 'china',       motivation: 'financial-gain' },
  { name: 'Lazarus Group', aliases: ['HIDDEN COBRA','Zinc'],      country: 'korea-north', motivation: 'financial-gain' },
  { name: 'APT33', aliases: ['Elfin','Refined Kitten'],           country: 'iran',        motivation: 'sabotage' },
  { name: 'APT34', aliases: ['OilRig','HelixKitten'],             country: 'iran',        motivation: 'espionage' },
  { name: 'Sandworm', aliases: ['Voodoo Bear','BlackEnergy'],     country: 'russia',      motivation: 'sabotage' },
  { name: 'FIN7',    aliases: ['Carbanak','Carbon Spider'],       country: 'russia',      motivation: 'financial-gain' },
  { name: 'Turla',   aliases: ['Snake','Uroburos','Waterbug'],    country: 'russia',      motivation: 'espionage' },
  { name: 'Kimsuky', aliases: ['Thallium','Black Banshee'],       country: 'korea-north', motivation: 'espionage' },
  { name: 'MuddyWater', aliases: ['TEMP.Zagros','Static Kitten'], country: 'iran',        motivation: 'espionage' },
  { name: 'APT32', aliases: ['OceanLotus','SeaLotus'],            country: 'vietnam',     motivation: 'espionage' },
  { name: 'Gamaredon', aliases: ['Primitive Bear','Actinium'],    country: 'russia',      motivation: 'sabotage' },
  { name: 'SilverFish', aliases: ['UNC2452'],                     country: 'russia',      motivation: 'espionage' },
  { name: 'APT38', aliases: ['Stardust Chollima'],                country: 'korea-north', motivation: 'financial-gain' },
  { name: 'Equation Group', aliases: ['EQGRP'],                   country: 'united-states', motivation: 'espionage' },
  { name: 'DarkHydrus', aliases: ['LazyMeerkat'],                 country: 'iran',        motivation: 'espionage' },
  { name: 'TA505', aliases: ['Graceful Spider'],                  country: 'russia',      motivation: 'financial-gain' },
  { name: 'Scattered Spider', aliases: ['Starfraud','UNC3944'],   country: 'united-states', motivation: 'financial-gain' },
];

const MALWARE_FAMILIES = [
  { name: 'WannaCry',    type: 'ransomware',    platforms: ['windows'] },
  { name: 'NotPetya',    type: 'wiper',         platforms: ['windows'] },
  { name: 'Emotet',      type: 'trojan',        platforms: ['windows'] },
  { name: 'TrickBot',    type: 'trojan',        platforms: ['windows'] },
  { name: 'Ryuk',        type: 'ransomware',    platforms: ['windows'] },
  { name: 'Cobalt Strike',type:'backdoor',      platforms: ['windows','linux','macos'] },
  { name: 'Mimikatz',    type: 'credential-theft', platforms: ['windows'] },
  { name: 'Conti',       type: 'ransomware',    platforms: ['windows'] },
  { name: 'BlackMatter', type: 'ransomware',    platforms: ['windows'] },
  { name: 'LockBit',     type: 'ransomware',    platforms: ['windows','linux'] },
  { name: 'BlackCat',    type: 'ransomware',    platforms: ['windows','linux'] },
  { name: 'Qakbot',      type: 'trojan',        platforms: ['windows'] },
  { name: 'IcedID',      type: 'banking-trojan',platforms: ['windows'] },
  { name: 'RedLine',     type: 'info-stealer',  platforms: ['windows'] },
  { name: 'AgentTesla',  type: 'info-stealer',  platforms: ['windows'] },
  { name: 'AsyncRAT',    type: 'backdoor',      platforms: ['windows'] },
  { name: 'Remcos',      type: 'backdoor',      platforms: ['windows'] },
  { name: 'NanoCore',    type: 'backdoor',      platforms: ['windows'] },
  { name: 'Formbook',    type: 'info-stealer',  platforms: ['windows'] },
  { name: 'XMRig',       type: 'crypto-miner',  platforms: ['windows','linux','macos'] },
  { name: 'Mirai',       type: 'botnet',        platforms: ['linux','iot-device'] },
  { name: 'Dridex',      type: 'banking-trojan',platforms: ['windows'] },
  { name: 'ZLoader',     type: 'banking-trojan',platforms: ['windows'] },
  { name: 'PlugX',       type: 'backdoor',      platforms: ['windows'] },
  { name: 'Gh0stRAT',    type: 'backdoor',      platforms: ['windows'] },
  { name: 'Havoc',       type: 'backdoor',      platforms: ['windows','linux'] },
  { name: 'Sliver',      type: 'backdoor',      platforms: ['windows','linux','macos'] },
  { name: 'Brute Ratel',  type: 'backdoor',     platforms: ['windows'] },
  { name: 'ShadowPad',   type: 'backdoor',      platforms: ['windows'] },
  { name: 'DoubleAgent', type: 'rootkit',       platforms: ['windows'] },
  { name: 'Industroyer', type: 'wiper',         platforms: ['windows'] },
  { name: 'Stuxnet',     type: 'worm',          platforms: ['windows'] },
  { name: 'BlackEnergy', type: 'backdoor',      platforms: ['windows'] },
  { name: 'Trident',     type: 'spyware',       platforms: ['ios','android'] },
  { name: 'Pegasus',     type: 'spyware',       platforms: ['ios','android'] },
  { name: 'GhostWriter', type: 'apt',           platforms: ['windows'] },
  { name: 'DeadBolt',    type: 'ransomware',    platforms: ['linux'] },
  { name: 'ESXiArgs',    type: 'ransomware',    platforms: ['linux'] },
  { name: 'Raccoon',     type: 'info-stealer',  platforms: ['windows'] },
  { name: 'Vidar',       type: 'info-stealer',  platforms: ['windows'] },
  { name: 'Gootloader',  type: 'trojan',        platforms: ['windows'] },
  { name: 'BumbleBee',   type: 'trojan',        platforms: ['windows'] },
  { name: 'DarkGate',    type: 'backdoor',      platforms: ['windows'] },
  { name: 'PikaBot',     type: 'trojan',        platforms: ['windows'] },
  { name: 'BunnyLoader', type: 'info-stealer',  platforms: ['windows'] },
  { name: 'MetaStealer', type: 'info-stealer',  platforms: ['macos'] },
  { name: 'Atomic Stealer', type: 'info-stealer',platforms: ['macos'] },
  { name: 'SparkRAT',    type: 'backdoor',      platforms: ['windows','linux','macos'] },
  { name: 'Tsunami',     type: 'botnet',        platforms: ['linux'] },
  { name: 'GoBruteforcer', type: 'worm',        platforms: ['linux'] },
];

const CVE_IDS = [
  { id: 'CVE-2021-44228', title: 'Log4Shell - Apache Log4j RCE', cvss: 10.0, severity: 'critical', vendor: 'Apache', product: 'Log4j', version: '2.0-2.14.1' },
  { id: 'CVE-2021-34527', title: 'PrintNightmare - Windows Print Spooler RCE', cvss: 8.8, severity: 'high', vendor: 'Microsoft', product: 'Windows', version: 'Multiple' },
  { id: 'CVE-2022-30190', title: 'Follina - Microsoft MSDT RCE', cvss: 7.8, severity: 'high', vendor: 'Microsoft', product: 'MSDT', version: 'Multiple' },
  { id: 'CVE-2023-23397', title: 'Microsoft Outlook Privilege Escalation', cvss: 9.8, severity: 'critical', vendor: 'Microsoft', product: 'Outlook', version: '2013-2021' },
  { id: 'CVE-2023-44487', title: 'HTTP/2 Rapid Reset Attack (DDoS)', cvss: 7.5, severity: 'high', vendor: 'Multiple', product: 'HTTP/2 Servers', version: 'Multiple' },
  { id: 'CVE-2023-20198', title: 'Cisco IOS XE Web UI Privilege Escalation', cvss: 10.0, severity: 'critical', vendor: 'Cisco', product: 'IOS XE', version: '16.x-17.x' },
  { id: 'CVE-2024-21762', title: 'Fortinet FortiOS Out-of-Bound Write', cvss: 9.6, severity: 'critical', vendor: 'Fortinet', product: 'FortiOS', version: '6.x-7.x' },
  { id: 'CVE-2024-3400',  title: 'Palo Alto Networks PAN-OS Command Injection', cvss: 10.0, severity: 'critical', vendor: 'Palo Alto', product: 'PAN-OS', version: '10.2,11.0,11.1' },
  { id: 'CVE-2022-1388',  title: 'F5 BIG-IP iControl REST Auth Bypass', cvss: 9.8, severity: 'critical', vendor: 'F5', product: 'BIG-IP', version: '13.x-16.x' },
  { id: 'CVE-2021-26084', title: 'Atlassian Confluence OGNL Injection', cvss: 9.8, severity: 'critical', vendor: 'Atlassian', product: 'Confluence', version: 'Before 7.13.2' },
  { id: 'CVE-2022-22965', title: 'Spring4Shell - Spring Framework RCE', cvss: 9.8, severity: 'critical', vendor: 'VMware', product: 'Spring Framework', version: '5.3.x,5.2.x' },
  { id: 'CVE-2021-21985', title: 'VMware vCenter Server RCE', cvss: 9.8, severity: 'critical', vendor: 'VMware', product: 'vCenter Server', version: '6.5-7.0' },
  { id: 'CVE-2023-34362', title: 'MOVEit Transfer SQL Injection', cvss: 9.8, severity: 'critical', vendor: 'Progress', product: 'MOVEit Transfer', version: 'Before 2023.0.1' },
  { id: 'CVE-2023-4966',  title: 'Citrix Bleed - NetScaler Buffer Overflow', cvss: 9.4, severity: 'critical', vendor: 'Citrix', product: 'NetScaler ADC', version: 'Before 14.1-8.50' },
  { id: 'CVE-2022-47966', title: 'Zoho ManageEngine RCE via SAML', cvss: 9.8, severity: 'critical', vendor: 'Zoho', product: 'ManageEngine', version: 'Multiple' },
  { id: 'CVE-2023-27350', title: 'PaperCut MF/NG Auth Bypass and RCE', cvss: 9.8, severity: 'critical', vendor: 'PaperCut', product: 'MF/NG', version: 'Before 22.0.9' },
  { id: 'CVE-2022-26134', title: 'Atlassian Confluence OGNL Injection', cvss: 9.8, severity: 'critical', vendor: 'Atlassian', product: 'Confluence', version: '1.3.0-7.18.0' },
  { id: 'CVE-2021-40444', title: 'MSHTML Platform RCE via ActiveX', cvss: 8.8, severity: 'high', vendor: 'Microsoft', product: 'Windows', version: 'Multiple' },
  { id: 'CVE-2020-1472',  title: 'Zerologon - Netlogon Privilege Escalation', cvss: 10.0, severity: 'critical', vendor: 'Microsoft', product: 'Netlogon', version: 'Multiple' },
  { id: 'CVE-2019-0708',  title: 'BlueKeep - RDP RCE', cvss: 9.8, severity: 'critical', vendor: 'Microsoft', product: 'Remote Desktop', version: 'Win7/Server2008' },
  { id: 'CVE-2023-36884', title: 'Microsoft Office HTML RCE', cvss: 8.3, severity: 'high', vendor: 'Microsoft', product: 'Office', version: 'Multiple' },
  { id: 'CVE-2024-1709',  title: 'ConnectWise ScreenConnect Auth Bypass', cvss: 10.0, severity: 'critical', vendor: 'ConnectWise', product: 'ScreenConnect', version: 'Before 23.9.8' },
  { id: 'CVE-2024-21893', title: 'Ivanti Connect Secure SSRF', cvss: 8.2, severity: 'high', vendor: 'Ivanti', product: 'Connect Secure', version: 'Before 22.4R2.3' },
  { id: 'CVE-2023-46604', title: 'Apache ActiveMQ RCE', cvss: 10.0, severity: 'critical', vendor: 'Apache', product: 'ActiveMQ', version: 'Before 5.15.16' },
  { id: 'CVE-2024-23897', title: 'Jenkins Arbitrary File Read to RCE', cvss: 9.8, severity: 'critical', vendor: 'Jenkins', product: 'Jenkins Core', version: 'Before 2.442' },
  { id: 'CVE-2022-3786',  title: 'OpenSSL Buffer Overflow', cvss: 7.5, severity: 'high', vendor: 'OpenSSL', product: 'OpenSSL', version: '3.0.x' },
  { id: 'CVE-2023-0386',  title: 'Linux Kernel OverlayFS Privilege Escalation', cvss: 7.8, severity: 'high', vendor: 'Linux', product: 'Kernel', version: 'Before 6.2' },
  { id: 'CVE-2023-32233', title: 'Linux Kernel Netfilter Use-After-Free', cvss: 7.8, severity: 'high', vendor: 'Linux', product: 'Kernel', version: 'Before 6.3.2' },
  { id: 'CVE-2022-2586',  title: 'Linux Kernel Netfilter Privilege Escalation', cvss: 7.0, severity: 'high', vendor: 'Linux', product: 'Kernel', version: 'Multiple' },
  { id: 'CVE-2021-3156',  title: 'Sudo Heap Overflow', cvss: 7.8, severity: 'high', vendor: 'Todd Miller', product: 'sudo', version: 'Before 1.9.5p2' },
  { id: 'CVE-2022-0847',  title: 'Dirty Pipe - Linux Kernel Privilege Escalation', cvss: 7.8, severity: 'high', vendor: 'Linux', product: 'Kernel', version: '5.8-5.16' },
  { id: 'CVE-2021-4034',  title: 'PwnKit - Polkit Privilege Escalation', cvss: 7.8, severity: 'high', vendor: 'polkit', product: 'polkit', version: 'Before 0.119' },
  { id: 'CVE-2023-3519',  title: 'Citrix ADC and Gateway RCE', cvss: 9.8, severity: 'critical', vendor: 'Citrix', product: 'ADC/Gateway', version: 'Before 13.1-49.13' },
  { id: 'CVE-2023-42793', title: 'JetBrains TeamCity Auth Bypass', cvss: 9.8, severity: 'critical', vendor: 'JetBrains', product: 'TeamCity', version: 'Before 2023.05.4' },
  { id: 'CVE-2022-41082', title: 'Microsoft Exchange ProxyNotShell RCE', cvss: 8.0, severity: 'high', vendor: 'Microsoft', product: 'Exchange Server', version: '2013-2019' },
  { id: 'CVE-2021-44832', title: 'Apache Log4j2 RCE via JDBC Appender', cvss: 6.6, severity: 'medium', vendor: 'Apache', product: 'Log4j', version: '2.0-2.17.0' },
  { id: 'CVE-2023-24880', title: 'Windows SmartScreen Security Bypass', cvss: 5.4, severity: 'medium', vendor: 'Microsoft', product: 'Windows SmartScreen', version: 'Multiple' },
  { id: 'CVE-2023-28252', title: 'Windows CLFS Driver Privilege Escalation', cvss: 7.8, severity: 'high', vendor: 'Microsoft', product: 'Windows CLFS', version: 'Multiple' },
  { id: 'CVE-2024-30051', title: 'Windows DWM Core Library Privilege Escalation', cvss: 7.8, severity: 'high', vendor: 'Microsoft', product: 'Windows DWM', version: 'Multiple' },
  { id: 'CVE-2024-38112', title: 'Windows MSHTML Platform Spoofing Vulnerability', cvss: 7.5, severity: 'high', vendor: 'Microsoft', product: 'Windows MSHTML', version: 'Multiple' },
];

const ALERT_TYPES = [
  'malware','ransomware','phishing','ddos','brute-force','insider-threat',
  'data-exfiltration','privilege-escalation','lateral-movement','command-control',
  'credential-theft','account-compromise','web-application','zero-day','apt',
  'crypto-mining','vulnerability-exploit','anomaly','behavioral',
];

const INCIDENT_TYPES = [
  'malware','ransomware','phishing','ddos','brute-force','insider-threat',
  'data-exfiltration','privilege-escalation','lateral-movement','command-control',
  'credential-theft','business-email-compromise','zero-day','apt','data-breach',
  'vulnerability-exploit','social-engineering','other',
];

const ALERT_SOURCES = [
  'firewall','ids','ips','antivirus','edr','siem','log-analysis',
  'network-traffic','endpoint','email-gateway','threat-intelligence',
  'vulnerability-scanner','web-proxy','dns',
];

const ASSET_TYPES = [
  'workstation','server','laptop','network-device','firewall','router',
  'switch','database','application-server','web-server','cloud-instance',
  'container','virtual-machine','domain-controller','email-server',
];

const OS_LIST = [
  { name: 'Windows', version: '10 22H2' },
  { name: 'Windows', version: '11 23H2' },
  { name: 'Windows Server', version: '2022' },
  { name: 'Windows Server', version: '2019' },
  { name: 'Ubuntu', version: '22.04 LTS' },
  { name: 'Ubuntu', version: '20.04 LTS' },
  { name: 'CentOS', version: '7.9' },
  { name: 'Red Hat Enterprise Linux', version: '9.2' },
  { name: 'Debian', version: '12 Bookworm' },
  { name: 'macOS', version: '14 Sonoma' },
];

const DEPARTMENTS = [
  'Engineering','Finance','HR','Legal','Marketing','Operations',
  'Sales','Security','DevOps','IT Infrastructure','Research & Development',
];

const MITRE_TACTICS = [
  'initial-access','execution','persistence','privilege-escalation',
  'defense-evasion','credential-access','discovery','lateral-movement',
  'collection','command-and-control','exfiltration','impact',
];

const MITRE_TECHNIQUES = [
  { tactic: 'initial-access',      techniqueId: 'T1566.001', technique: 'Spearphishing Attachment' },
  { tactic: 'initial-access',      techniqueId: 'T1078',     technique: 'Valid Accounts' },
  { tactic: 'execution',           techniqueId: 'T1059.001', technique: 'PowerShell' },
  { tactic: 'execution',           techniqueId: 'T1059.003', technique: 'Windows Command Shell' },
  { tactic: 'persistence',         techniqueId: 'T1547.001', technique: 'Registry Run Keys / Startup Folder' },
  { tactic: 'privilege-escalation',techniqueId: 'T1055',     technique: 'Process Injection' },
  { tactic: 'defense-evasion',     techniqueId: 'T1055.002', technique: 'Portable Executable Injection' },
  { tactic: 'credential-access',   techniqueId: 'T1003.001', technique: 'LSASS Memory' },
  { tactic: 'discovery',           techniqueId: 'T1016',     technique: 'System Network Configuration Discovery' },
  { tactic: 'lateral-movement',    techniqueId: 'T1021.001', technique: 'Remote Desktop Protocol' },
  { tactic: 'lateral-movement',    techniqueId: 'T1021.002', technique: 'SMB/Windows Admin Shares' },
  { tactic: 'collection',          techniqueId: 'T1005',     technique: 'Data from Local System' },
  { tactic: 'command-and-control', techniqueId: 'T1071.001', technique: 'Web Protocols (HTTP/S)' },
  { tactic: 'exfiltration',        techniqueId: 'T1041',     technique: 'Exfiltration Over C2 Channel' },
  { tactic: 'impact',              techniqueId: 'T1486',     technique: 'Data Encrypted for Impact' },
];

// ── Data generators ───────────────────────────────────────────────────────────

const randIP = () => `${rand(1,254)}.${rand(0,254)}.${rand(0,254)}.${rand(1,254)}`;

const randDomain = () => {
  const tlds    = ['com','net','org','io','ru','cn','ir','info','biz','co'];
  const prefixes = ['evil','mal','dark','hack','attack','threat','bot','c2',
                    'cmd','data','exfil','phish','ransom','spy','rat','drop'];
  const bodies  = ['server','host','cdn','node','relay','gate','agent','proxy',
                   'loader','panel','admin','shell','camp','update','stats'];
  return `${pick(prefixes)}-${pick(bodies)}${rand(1,999)}.${pick(tlds)}`;
};

const randHash = (len = 64) => {
  const hex = '0123456789abcdef';
  return Array.from({ length: len }, () => hex[rand(0, 15)]).join('');
};

const randMd5  = () => randHash(32);
const randSha1 = () => randHash(40);
const randSha256 = () => randHash(64);

const randEmail = () => {
  const users   = ['admin','support','noreply','info','billing','helpdesk'];
  const domains = ['gmail.com','protonmail.com','tutanota.com','mail.ru','yandex.ru'];
  return `${pick(users)}${rand(10,9999)}@${pick(domains)}`;
};

const randUrl = (domain) => {
  const paths = ['/wp-login.php','/admin/shell.php','/update.exe',
                 '/payload.js','/gate.php','/panel/login','/c2/beacon'];
  return `https://${domain || randDomain()}${pick(paths)}`;
};

/** Build a small array of MITRE ATT&CK objects */
const buildMitre = (n = 2) =>
  pickN(MITRE_TECHNIQUES, n).map(t => ({
    tactic:      t.tactic,
    technique:   t.technique,
    techniqueId: t.techniqueId,
  }));

/** Build one IOC subdocument for an alert/incident */
const buildInlineIOC = () => {
  const types = ['ip-address','domain','url','file-hash','email-address'];
  const t = pick(types);
  const valMap = {
    'ip-address': randIP(),
    'domain':     randDomain(),
    'url':        randUrl(),
    'file-hash':  randSha256(),
    'email-address': randEmail(),
  };
  return {
    type:      t,
    value:     valMap[t],
    confidence: pick(['low','medium','high']),
    source:    pick(['internal','external','threat-intelligence']),
    firstSeen: randDate(90),
    lastSeen:  randDate(30),
    isActive:  true,
  };
};

// ── Section seeders ───────────────────────────────────────────────────────────

async function seedOrganizationAndUsers() {
  let org = await Organization.findOne({ name: 'SentinelX Operations' });
  if (!org) {
    org = await Organization.create({
      name:        'SentinelX Operations',
      description: 'Primary security operations organization',
      industry:    'Technology',
      size:        'enterprise',
      address:     { street: '1 Cyber Blvd', city: 'San Francisco', state: 'CA', postalCode: '94105', country: 'USA' },
      contactEmail:'soc@sentinelx.ai',
      contactPhone:'+1-415-555-0100',
      website:     'https://sentinelx.ai',
      subscriptionPlan: 'enterprise',
    });
    console.log('  ✔ Organization created');
  } else {
    console.log('  ✔ Organization already exists');
  }

  const userDefs = [
    { firstName:'SOC',    lastName:'Admin',    email:'admin@sentinelx.ai',    role:'admin'    },
    { firstName:'Alice',  lastName:'Analyst',  email:'alice@sentinelx.ai',    role:'analyst'  },
    { firstName:'Bob',    lastName:'Analyst',  email:'bob@sentinelx.ai',      role:'analyst'  },
    { firstName:'Carol',  lastName:'Operator', email:'carol@sentinelx.ai',    role:'operator' },
    { firstName:'Dave',   lastName:'Viewer',   email:'dave@sentinelx.ai',     role:'viewer'   },
  ];

  const users = [];
  for (const def of userDefs) {
    let u = await User.findOne({ email: def.email });
    if (!u) {
      u = await User.create({ ...def, password: 'SentinelX2026!', organization: org._id });
    }
    users.push(u);
  }
  console.log(`  ✔ ${users.length} users ready`);

  let team = await Team.findOne({ name: 'SOC Team Alpha', organization: org._id });
  if (!team) {
    team = await Team.create({
      name:        'SOC Team Alpha',
      description: 'Primary SOC incident response team',
      organization: org._id,
      teamLead:    users[0]._id,
      members:     users.map(u => u._id),
    });
  }
  console.log('  ✔ Team ready');

  return { org, users, team };
}

async function seedThreatIntelligence(org, users) {
  const existing = await ThreatIntel.countDocuments();
  if (existing >= 300) { console.log(`  ✔ ThreatIntelligence already seeded (${existing})`); return await ThreatIntel.find().lean(); }

  const needed = 300 - existing;
  console.log(`  Seeding ${needed} ThreatIntelligence records…`);
  const docs = [];

  for (let i = 0; i < needed; i++) {
    const apt    = pick(APT_GROUPS);
    const mal    = pick(MALWARE_FAMILIES);
    const geo    = pick(COUNTRIES_GEO);
    const typeMap = { 'ransomware':'ransomware','trojan':'trojan','wiper':'wiper',
                      'backdoor':'backdoor','botnet':'botnet','info-stealer':'info-stealer',
                      'spyware':'spyware','crypto-miner':'crypto-miner','apt':'apt-group',
                      'banking-trojan':'banking-trojan','credential-theft':'credential-theft',
                      'rootkit':'rootkit','worm':'worm' };
    const threatType = typeMap[mal.type] || 'other';

    const indicator = {
      type:        'ip-address',
      value:       randIP(),
      confidence:  rand(50, 95),
      severity:    pickSev(),
      source:      'external',
      firstSeen:   randDate(180),
      lastSeen:    randDate(30),
      isActive:    true,
    };

    const malwareFamily = {
      name:       mal.name,
      alias:      mal.aliases || [],
      description:`${mal.name} is a ${mal.type} targeting ${(mal.platforms || ['windows']).join(', ')} systems.`,
      firstSeen:  randDate(365),
      lastSeen:   randDate(30),
      prevalence: pick(['uncommon','common','widespread']),
      platforms:  mal.platforms || ['windows'],
    };

    const campaign = {
      name:        `Operation ${pick(['ShadowFox','IronGate','DarkSide','RedHarvest','BlueRain','SilverMist','IronForge'])} ${zp(i+1,3)}`,
      description: `Targeted campaign by ${apt.name} against enterprise infrastructure.`,
      firstSeen:   randDate(365),
      lastSeen:    randDate(30),
      objectives:  ['espionage','data-theft'],
      targets:     ['government','technology','financial-services'],
      geolocations:[geo.country],
    };

    docs.push({
      title:       `${apt.name} — ${mal.name} Campaign #${zp(i+1,3)}`,
      description: `${apt.name} (also known as ${apt.aliases[0]}) has been observed deploying ${mal.name} against targets in the ${geo.country.replace(/-/g,' ')} region. Attributed with ${pick(['low','medium','high'])} confidence.`,
      threatType,
      threatActor: {
        name:        apt.name,
        alias:       apt.aliases,
        motivation:  apt.motivation,
        sophistication: pick(['advanced','expert','nation-state']),
        resources:   pick(['organized-group','state-sponsored']),
      },
      indicators:      [indicator],
      attribution: {
        confidence:  pick(['medium','high','confirmed']),
        country:     [apt.country],
        malwareFamily:[mal.name],
        campaign:    [campaign.name],
      },
      malwareFamilies: [malwareFamily],
      campaigns:       [campaign],
      sources: [{
        name:        pick(['AlienVault OTX','VirusTotal','Recorded Future','CrowdStrike','Mandiant','Unit 42']),
        type:        'commercial',
        lastUpdated: randDate(7),
        isActive:    true,
        trustLevel:  'high',
        reliability: 'high',
      }],
      tags:   [apt.name.toLowerCase().replace(/ /g,'-'), mal.type, geo.country],
      ttl:    rand(30, 365),
      isActive: true,
    });
  }

  await ThreatIntel.insertMany(docs, { ordered: false });
  console.log(`  ✔ Inserted ${docs.length} ThreatIntelligence records`);
  return await ThreatIntel.find().lean();
}

async function seedIOCs(org, users, threatDocs) {
  const existing = await IOC.countDocuments();
  if (existing >= 250) { console.log(`  ✔ IOCs already seeded (${existing})`); return await IOC.find().lean(); }

  const needed = 250 - existing;
  console.log(`  Seeding ${needed} IOC records…`);
  const docs = [];

  const iocTypes = [
    { type: 'ip-address-v4',    gen: randIP },
    { type: 'domain',           gen: randDomain },
    { type: 'url',              gen: randUrl },
    { type: 'file-hash-md5',    gen: randMd5 },
    { type: 'file-hash-sha256', gen: randSha256 },
    { type: 'email-address',    gen: randEmail },
  ];

  const seen = new Set();
  // Pre-populate with any existing values to avoid re-insert
  const existingVals = await IOC.find({}, 'value type').lean();
  existingVals.forEach(e => seen.add(`${e.type}||${e.value}`));

  let attempts = 0;
  while (docs.length < needed && attempts < needed * 5) {
    attempts++;
    const iocDef = pick(iocTypes);
    const value  = iocDef.gen();
    const key    = `${iocDef.type}||${value}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const apt = pick(APT_GROUPS);
    const mal = pick(MALWARE_FAMILIES);
    const geo = pick(COUNTRIES_GEO);
    const sev = pickSev();
    const ti  = threatDocs.length ? pick(threatDocs) : null;

    const killChainMap = {
      'ip-address-v4':    'command-and-control',
      'domain':           'command-and-control',
      'url':              'delivery',
      'file-hash-md5':    'installation',
      'file-hash-sha256': 'installation',
      'email-address':    'delivery',
    };

    docs.push({
      value,
      type:           iocDef.type,
      description:    `${iocDef.type} associated with ${mal.name} by ${apt.name}.`,
      confidence:     rand(40, 95),
      severity:       sev,
      source:         'threat-intelligence',
      sourceName:     pick(['AlienVault OTX','VirusTotal','Abuse.ch','Shodan','GreyNoise','Mandiant']),
      firstSeen:      randDate(180),
      lastSeen:       randDate(30),
      ttl:            rand(7, 90),
      isActive:       Math.random() > 0.1,
      tags:           [mal.type, apt.name.toLowerCase().replace(/ /g,'-')],
      killChainPhase: killChainMap[iocDef.type] || 'delivery',
      mitreAttck:     buildMitre(1),
      context: {
        malwareFamily:  mal.name,
        threatActor:    apt.name,
        campaign:       `Operation-${rand(1000,9999)}`,
        threatIntelId:  ti ? ti._id : undefined,
      },
      geolocation: {
        country:   geo.country,
        latitude:  parseFloat((geo.lat + randF(-5,5)).toFixed(4)),
        longitude: parseFloat((geo.lon + randF(-5,5)).toFixed(4)),
      },
      blacklisted: sev === 'critical' || sev === 'high',
    });
  }

  if (docs.length) {
    await IOC.insertMany(docs, { ordered: false });
  }
  console.log(`  ✔ Inserted ${docs.length} IOC records`);
  return await IOC.find().lean();
}

async function seedVulnerabilities() {
  const existing = await Vulnerability.countDocuments();
  if (existing >= 150) { console.log(`  ✔ Vulnerabilities already seeded (${existing})`); return await Vulnerability.find().lean(); }

  const needed = 150 - existing;
  console.log(`  Seeding ${needed} Vulnerability records…`);

  const existingIds = new Set((await Vulnerability.find({}, 'cveId').lean()).map(v => v.cveId));
  const docs = [];
  let pool = [...CVE_IDS];

  // Fill beyond real CVEs with synthetic ones
  while (pool.length < needed) {
    const year = rand(2019, 2024);
    const num  = rand(10000, 99999);
    const id   = `CVE-${year}-${num}`;
    if (!existingIds.has(id) && !pool.find(p => p.id === id)) {
      const cvssSev = pick(['medium','high','critical']);
      const cvssVal = cvssSev === 'critical' ? randF(9.0,10.0) :
                      cvssSev === 'high'     ? randF(7.0,8.9)  : randF(4.0,6.9);
      pool.push({
        id, title: `Vulnerability in ${pick(['Apache','nginx','OpenSSL','libssl','glibc','curl','libxml2','sqlite'])} (${id})`,
        cvss: cvssVal, severity: cvssSev,
        vendor: pick(['Apache','nginx','OpenSSL','Google','Microsoft','Cisco','VMware']),
        product: pick(['Core','Library','Server','Client','Agent','Connector']),
        version: `${rand(1,10)}.${rand(0,9)}.${rand(0,9)}`,
      });
    }
  }

  pool = pool.filter(p => !existingIds.has(p.id)).slice(0, needed);

  for (const cve of pool) {
    const severity = cve.severity;
    const cvss = cve.cvss;
    docs.push({
      title:       cve.title,
      description: `${cve.title}. A ${severity} severity vulnerability in ${cve.vendor} ${cve.product} ${cve.version} that may allow ${pick(['remote code execution','privilege escalation','information disclosure','denial of service','authentication bypass'])}.`,
      cveId:       cve.id,
      cweId:       `CWE-${pick([20,22,77,78,79,89,94,119,120,125,190,200,276,287,295,400,416,476,502,611,787,798])}`,
      severity,
      cvssScore:   cvss,
      cvssVector:  `CVSS:3.1/AV:N/AC:${pick(['L','H'])}/PR:${pick(['N','L','H'])}/UI:${pick(['N','R'])}/S:${pick(['U','C'])}/C:${pick(['N','L','H'])}/I:${pick(['N','L','H'])}/A:${pick(['N','L','H'])}`,
      cvssVersion: '3.1',
      attackVector: pick(['network','adjacent','local']),
      attackComplexity: pick(['low','high']),
      privilegesRequired: pick(['none','low','high']),
      userInteraction: pick(['none','required']),
      scope: pick(['unchanged','changed']),
      confidentialityImpact: cvss >= 7 ? 'high' : pick(['none','low','high']),
      integrityImpact:       cvss >= 7 ? 'high' : pick(['none','low','high']),
      availabilityImpact:    cvss >= 7 ? pick(['low','high']) : pick(['none','low']),
      publishedDate: randDate(365 * 3),
      modifiedDate:  randDate(90),
      affectedProducts: [{
        vendor: cve.vendor, product: cve.product, version: cve.version,
      }],
      references: [{
        url:    `https://nvd.nist.gov/vuln/detail/${cve.id}`,
        source: 'NVD',
        tags:   ['advisory'],
      }, {
        url:    `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve.id}`,
        source: 'MITRE',
        tags:   ['url'],
      }],
    });
  }

  if (docs.length) {
    await Vulnerability.insertMany(docs, { ordered: false });
  }
  console.log(`  ✔ Inserted ${docs.length} Vulnerability records`);
  return await Vulnerability.find().lean();
}

async function seedYaraRules(users) {
  const existing = await YaraRule.countDocuments();
  if (existing >= 100) { console.log(`  ✔ YaraRules already seeded (${existing})`); return; }

  const needed = 100 - existing;
  console.log(`  Seeding ${needed} YARA Rule records…`);

  const existingNames = new Set((await YaraRule.find({}, 'name').lean()).map(r => r.name));
  const docs = [];

  for (let i = 0; i < needed * 3 && docs.length < needed; i++) {
    const mal  = pick(MALWARE_FAMILIES);
    const apt  = pick(APT_GROUPS);
    const sev  = pickSev();
    const name = `${mal.name.replace(/ /g,'_')}_${pick(['Dropper','Loader','Beacon','Payload','Injector','C2','Downloader','Backdoor'])}__${zp(i+1,3)}`;
    if (existingNames.has(name)) continue;
    existingNames.add(name);

    const strId1 = `$s${rand(1,9)}`;
    const strId2 = `$h${rand(1,9)}`;
    const strVal1 = randSha256().substring(0,16);
    const strVal2 = Array.from({length:8},()=>rand(0,15).toString(16)).join(' ');

    docs.push({
      name,
      description: `Detects ${mal.name} ${pick(['dropper','loader','payload','C2 beacon','injector'])} associated with ${apt.name}.`,
      author:     pick(['SentinelX Research','ESET','CrowdStrike','Mandiant','Unit42','Kaspersky','Sophos Labs']),
      version:    `${rand(1,3)}.${rand(0,9)}`,
      reference:  `https://attack.mitre.org/software/${pick(['S0154','S0366','S0243','S0030','S0002'])}`,
      date:       randDate(365),
      modified:   randDate(90),
      strings: [
        { type: 'hex',    identifier: strId1, value: strVal2,  modifiers: [] },
        { type: 'string', identifier: strId2, value: strVal1,  modifiers: ['nocase','ascii'] },
      ],
      condition:  `uint16(0) == 0x5A4D and filesize < 5MB and all of them`,
      tags:       [mal.type, apt.name.toLowerCase().replace(/ /g,'-'), sev],
      source:     pick(['external','community','research']),
      severity:   sev,
      isActive:   true,
      isEnabled:  true,
      metadata:   [
        { key: 'malware_family', value: mal.name },
        { key: 'threat_actor',   value: apt.name },
      ],
    });
  }

  if (docs.length) {
    await YaraRule.insertMany(docs, { ordered: false });
  }
  console.log(`  ✔ Inserted ${docs.length} YARA Rule records`);
}

async function seedAssets(org, users) {
  const existing = await Asset.countDocuments({ organization: org._id });
  if (existing >= 200) { console.log(`  ✔ Assets already seeded (${existing})`); return await Asset.find({ organization: org._id }).lean(); }

  const needed = 200 - existing;
  console.log(`  Seeding ${needed} Asset records…`);

  const existingHostnames = new Set((await Asset.find({}, 'hostname').lean())
    .filter(a => a.hostname).map(a => a.hostname));

  const docs = [];
  for (let i = 0; i < needed; i++) {
    const assetType = pick(ASSET_TYPES);
    const os        = pick(OS_LIST);
    const dept      = pick(DEPARTMENTS);
    const riskLevel = pickSev();
    const owner     = pick(users);

    const prefix = {
      workstation:        'WS',  server:       'SRV', laptop:           'LPT',
      'network-device':   'NET', firewall:     'FW',  router:           'RTR',
      switch:             'SWT', database:     'DB',  'application-server':'APP',
      'web-server':       'WEB', 'cloud-instance':'CLD','container':    'CTR',
      'virtual-machine':  'VM',  'domain-controller':'DC','email-server':'EML',
    }[assetType] || 'AST';

    let hostname;
    let attempt = 0;
    do {
      hostname = `${prefix}-${dept.substring(0,3).toUpperCase()}-${zp(rand(1,9999),4)}`;
      attempt++;
    } while (existingHostnames.has(hostname) && attempt < 20);
    if (existingHostnames.has(hostname)) continue;
    existingHostnames.add(hostname);

    const ipAddress = randIP();
    const lastSeen  = randDate(30);

    docs.push({
      name:        hostname,
      description: `${assetType} managed by ${dept} department`,
      assetType,
      hostname,
      ipAddress,
      macAddress:  Array.from({length:6}, () => rand(0,255).toString(16).padStart(2,'0')).join(':').toUpperCase(),
      operatingSystem: { name: os.name, version: os.version, architecture: pick(['x64','x86','arm64']) },
      manufacturer: pick(['Dell','HP','Lenovo','Apple','Cisco','Juniper','Palo Alto','VMware','AWS','Azure']),
      model:        `Model-${rand(1000,9999)}`,
      organization: org._id,
      location: {
        site:     pick(['HQ','Branch-NYC','Branch-London','DC-East','DC-West']),
        building: `Building-${pick(['A','B','C','D'])}`,
        floor:    String(rand(1,10)),
        room:     `Room-${rand(100,999)}`,
      },
      owner:       owner._id,
      assignedTo:  pick(users)._id,
      department:  dept,
      status:      pick(['active','active','active','active','maintenance','inactive']),
      riskLevel,
      criticality: riskLevel,
      compliance: {
        frameworks: pickN(['gdpr','hipaa','pci-dss','nist','iso-27001','cis'], rand(1,3)),
        status:     pick(['compliant','compliant','partial','non-compliant','not-assessed']),
        lastAssessed:    randDate(180),
        nextAssessmentDue: new Date(Date.now() + rand(30,180) * 86400000),
      },
      openPorts: pickN([22,80,443,3389,445,135,3306,5432,6379,8080,8443,27017], rand(2,5)).map(port => ({
        port, protocol: 'TCP',
        service: port === 22 ? 'SSH' : port === 80 ? 'HTTP' : port === 443 ? 'HTTPS' :
                 port === 3389 ? 'RDP' : port === 445 ? 'SMB' : `Port-${port}`,
        state: 'open',
      })),
      tags:           [dept.toLowerCase().replace(/ /g,'-'), assetType, riskLevel],
      lastSeen,
      isAgentInstalled: Math.random() > 0.3,
      agentVersion:   `${rand(1,3)}.${rand(0,9)}.${rand(0,99)}`,
      lastAgentCheckin: randDate(7),
      isMonitored:    Math.random() > 0.15,
      monitoringAgent: pick(['wazuh','crowdstrike','sentinelone','microsoft-defender','carbon-black']),
      createdBy:      owner._id,
      isActive:       true,
    });
  }

  if (docs.length) {
    await Asset.insertMany(docs, { ordered: false });
  }
  console.log(`  ✔ Inserted ${docs.length} Asset records`);
  return await Asset.find({ organization: org._id }).lean();
}

async function seedAlerts(org, users, assets, threatDocs, iocDocs) {
  const existing = await Alert.countDocuments({ organization: org._id });
  if (existing >= 500) { console.log(`  ✔ Alerts already seeded (${existing})`); return await Alert.find({ organization: org._id }).lean(); }

  const needed = 500 - existing;
  console.log(`  Seeding ${needed} Alert records…`);

  const docs = [];
  const statusOptions = ['new','new','new','investigating','acknowledged','resolved','false-positive'];

  for (let i = 0; i < needed; i++) {
    const alertType = pick(ALERT_TYPES);
    const severity  = pickSev();
    const source    = pick(ALERT_SOURCES);
    const asset     = assets.length ? pick(assets) : null;
    const mal       = pick(MALWARE_FAMILIES);
    const apt       = pick(APT_GROUPS);
    const geo       = pick(COUNTRIES_GEO);
    const ts        = randDate(90);
    const mitre     = buildMitre(rand(1,3));
    const status    = pick(statusOptions);

    const iocSubset = iocDocs.length
      ? [buildInlineIOC(), ...(Math.random() > 0.5 ? [buildInlineIOC()] : [])]
      : [buildInlineIOC()];

    const riskScore = severity === 'critical' ? rand(80,100) :
                      severity === 'high'     ? rand(60,79)  :
                      severity === 'medium'   ? rand(35,59)  : rand(10,34);

    docs.push({
      title:       `${alertType.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} Detected — ${source.toUpperCase()} #${zp(i+1,4)}`,
      description: `${source.toUpperCase()} detected ${alertType.replace(/-/g,' ')} activity associated with ${mal.name}. Attributed to ${apt.name}. Source IP in ${geo.country.replace(/-/g,' ')}.`,
      alertType,
      severity,
      priority:    severity === 'critical' ? 'p1' : severity === 'high' ? 'p2' : severity === 'medium' ? 'p3' : 'p4',
      status,
      organization: org._id,
      source,
      sourceName:   `${source.toUpperCase()}-Sensor-${rand(1,20)}`,
      assignedTo:   Math.random() > 0.4 ? pick(users)._id : undefined,
      relatedAsset: asset ? asset._id : undefined,
      tags:         [alertType, mal.type, severity],
      sourceTimestamp: ts,
      receivedAt:   new Date(ts.getTime() + rand(1000, 60000)),
      processedAt:  new Date(ts.getTime() + rand(60000, 300000)),
      indicatorsOfCompromise: iocSubset,
      mitreAttck:   mitre,
      aiAnalysis: {
        isMalicious:          severity !== 'info',
        confidenceScore:      rand(55, 99),
        riskScore,
        falsePositiveLikelihood: status === 'false-positive' ? rand(60,90) : rand(5,25),
        suggestedActions: [
          'Isolate affected endpoint',
          'Block IOC at perimeter firewall',
          'Collect forensic artifacts',
          'Notify incident response team',
        ].slice(0, rand(2,4)),
        generatedAt: new Date(),
        modelUsed:   'SentinelX-AI-v2',
      },
      isActive: true,
    });
  }

  // Insert in batches of 100
  for (let b = 0; b < docs.length; b += 100) {
    await Alert.insertMany(docs.slice(b, b + 100), { ordered: false });
  }
  console.log(`  ✔ Inserted ${docs.length} Alert records`);
  return await Alert.find({ organization: org._id }).lean();
}

async function seedIncidents(org, users, assets, alerts) {
  const existing = await Incident.countDocuments({ organization: org._id });
  if (existing >= 80) { console.log(`  ✔ Incidents already seeded (${existing})`); return await Incident.find({ organization: org._id }).lean(); }

  const needed = 80 - existing;
  console.log(`  Seeding ${needed} Incident records…`);

  const docs = [];
  const statusOptions = ['new','investigating','investigating','contained','eradicated','recovered','closed'];

  for (let i = 0; i < needed; i++) {
    const incidentType = pick(INCIDENT_TYPES);
    const severity     = pickSev();
    const reporter     = pick(users);
    const assignee     = pick(users);
    const asset        = assets.length ? pick(assets) : null;
    const relAlerts    = alerts.length ? pickN(alerts, rand(1,4)).map(a => a._id) : [];
    const mal          = pick(MALWARE_FAMILIES);
    const apt          = pick(APT_GROUPS);
    const ts           = randDate(90);
    const status       = pick(statusOptions);
    const mitre        = buildMitre(rand(2,4));

    const affectedAssets = assets.length ? pickN(assets, rand(1,3)).map(a => a._id) : [];

    const timeline = [
      { timestamp: ts, event: 'Incident Detected', description: `Initial detection via ${pick(['SIEM','EDR','IDS','Firewall'])} alert.` },
      { timestamp: new Date(ts.getTime() + rand(300000, 1800000)), event: 'Triage Started', description: 'Analyst began initial triage and assessment.' },
    ];
    if (['investigating','contained','eradicated','recovered','closed'].includes(status)) {
      timeline.push({ timestamp: new Date(ts.getTime() + rand(1800000, 7200000)), event: 'Investigation In Progress', description: `Evidence collection started. ${mal.name} artifacts identified on affected systems.` });
    }

    const riskScore = severity === 'critical' ? rand(80,100) :
                      severity === 'high'     ? rand(60,79)  :
                      severity === 'medium'   ? rand(35,59)  : rand(10,34);

    docs.push({
      title:        `${incidentType.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} Incident — ${zp(rand(1,9999),4)}`,
      description:  `Security incident involving ${mal.name} malware attributed to ${apt.name}. ${severity.toUpperCase()} severity event requiring immediate response.`,
      incidentType,
      severity,
      priority:     severity === 'critical' ? 'p1' : severity === 'high' ? 'p2' : 'p3',
      status,
      organization: org._id,
      assignedTo:   assignee._id,
      reportedBy:   reporter._id,
      tags:         [incidentType, mal.type, severity],
      timeline,
      mitreAttck:   mitre,
      affectedAssets,
      indicatorsOfCompromise: [buildInlineIOC(), buildInlineIOC()],
      dataBreach: {
        occurred:             ['data-breach','data-exfiltration'].includes(incidentType),
        recordsAffected:      rand(100, 500000),
        dataTypes:            pickN(['pii','credentials','emails','financial'], rand(1,3)),
        notificationRequired: severity === 'critical',
        notificationSent:     false,
      },
      financialImpact: {
        directLoss:         severity === 'critical' ? rand(50000, 5000000) : rand(0, 100000),
        recoveryCost:       rand(10000, 500000),
        totalEstimated:     severity === 'critical' ? rand(100000, 10000000) : rand(10000, 500000),
      },
      aiAnalysis: {
        summary:        `AI assessment: ${mal.name} infection attributed to ${apt.name}. Recommend isolation and forensic analysis.`,
        attackVector:   pick(['Email phishing','Exploit kit','Supply chain compromise','Brute force','Insider threat']),
        impactAssessment: `${severity} impact on business operations.`,
        attribution:    `${apt.name} (${apt.aliases[0]}) with ${pick(['low','medium','high'])} confidence.`,
        confidenceScore: rand(60, 95),
        riskScore,
        suggestedActions: [
          'Isolate affected systems immediately',
          `Run ${mal.name}-specific YARA rules`,
          'Reset all privileged account credentials',
          'Review firewall rules and block C2 IPs',
        ],
        generatedAt: new Date(),
        modelUsed:   'SentinelX-AI-v2',
      },
      isActive: true,
    });
  }

  await Incident.insertMany(docs, { ordered: false });
  console.log(`  ✔ Inserted ${docs.length} Incident records`);
  return await Incident.find({ organization: org._id }).lean();
}

async function seedCases(org, users, incidents) {
  const existing = await Case.countDocuments({ organization: org._id });
  if (existing >= 40) { console.log(`  ✔ Cases already seeded (${existing})`); return; }

  const needed = 40 - existing;
  console.log(`  Seeding ${needed} Case records…`);

  const existingCaseNums = new Set((await Case.find({}, 'caseNumber').lean()).map(c => c.caseNumber));
  const docs = [];

  const classifications = [
    'incident-response','threat-hunting','forensics',
    'vulnerability-management','threat-intelligence','compliance-audit',
  ];
  const statusOptions = ['open','in-progress','in-progress','pending-review','closed'];

  for (let i = 0; i < needed; i++) {
    const lead         = pick(users);
    const investigators = pickN(users, rand(1,3));
    const priority     = pick(['medium','high','critical']);
    const status       = pick(statusOptions);
    const cls          = pick(classifications);
    const mal          = pick(MALWARE_FAMILIES);
    const apt          = pick(APT_GROUPS);
    const ts           = randDate(90);

    let caseNumber;
    let tries = 0;
    do {
      const d = new Date(ts);
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const dy= String(d.getDate()).padStart(2,'0');
      caseNumber = `CASE-${y}${m}${dy}-${zp(rand(1,9999))}`;
      tries++;
    } while (existingCaseNums.has(caseNumber) && tries < 20);
    existingCaseNums.add(caseNumber);

    const linkedIncidents = incidents.length ? pickN(incidents, rand(1,3)).map(inc => inc._id) : [];

    docs.push({
      title:          `${cls.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} — ${mal.name} — ${apt.name}`,
      description:    `Investigation case for ${cls} activity involving ${mal.name} malware attributed to ${apt.name}. Priority: ${priority.toUpperCase()}.`,
      caseNumber,
      status,
      priority,
      classification: cls,
      organization:   org._id,
      leadInvestigator: lead._id,
      investigators:  investigators.map(u => u._id),
      incidents:      linkedIncidents,
      tags:           [cls, mal.type, priority],
      timeline: [
        { timestamp: ts, event: 'Case Opened', description: `Case initiated by ${lead.firstName} ${lead.lastName}.` },
        { timestamp: new Date(ts.getTime() + rand(600000, 3600000)), event: 'Initial Assessment', description: 'Preliminary evidence reviewed and scope defined.' },
      ],
      aiAnalysis: {
        summary:          `Case involves ${mal.name} activity from ${apt.name}. ${linkedIncidents.length} linked incidents under investigation.`,
        attackVector:     pick(['Phishing email','Exploit kit','Watering hole','Supply chain']),
        impactAssessment: `${priority} business impact across ${linkedIncidents.length} incidents.`,
        attribution:      `${apt.name} — ${pick(['low','medium','high','confirmed'])} confidence`,
        confidenceScore:  rand(55, 95),
        riskScore:        priority === 'critical' ? rand(75,100) : priority === 'high' ? rand(55,74) : rand(30,54),
        generatedAt:      new Date(),
        modelUsed:        'SentinelX-AI-v2',
      },
      isActive: true,
    });
  }

  if (docs.length) {
    await Case.insertMany(docs, { ordered: false });
  }
  console.log(`  ✔ Inserted ${docs.length} Case records`);
}

// ── Main entry point ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  SentinelX AI — Database Seed Script');
  console.log('═'.repeat(50));

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  });
  console.log('✅  MongoDB connected\n');

  // ── Step 1: Foundation (org, users, team) ──────────────────────────────
  console.log('📦  Step 1/8 — Organization, Users & Team');
  const { org, users, team } = await seedOrganizationAndUsers();

  // ── Step 2: Threat Intelligence ─────────────────────────────────────────
  console.log('\n📦  Step 2/8 — Threat Intelligence (300 records)');
  const threatDocs = await seedThreatIntelligence(org, users);

  // ── Step 3: IOCs ────────────────────────────────────────────────────────
  console.log('\n📦  Step 3/8 — IOCs (250 records)');
  const iocDocs = await seedIOCs(org, users, threatDocs);

  // ── Step 4: Vulnerabilities ──────────────────────────────────────────────
  console.log('\n📦  Step 4/8 — Vulnerabilities (150 records)');
  await seedVulnerabilities();

  // ── Step 5: YARA Rules ──────────────────────────────────────────────────
  console.log('\n📦  Step 5/8 — YARA Rules (100 records)');
  await seedYaraRules(users);

  // ── Step 6: Assets ──────────────────────────────────────────────────────
  console.log('\n📦  Step 6/8 — Assets (200 records)');
  const assetDocs = await seedAssets(org, users);

  // ── Step 7: Alerts ──────────────────────────────────────────────────────
  console.log('\n📦  Step 7/8 — Alerts (500 records)');
  const alertDocs = await seedAlerts(org, users, assetDocs, threatDocs, iocDocs);

  // ── Step 8: Incidents ───────────────────────────────────────────────────
  console.log('\n📦  Step 8a/8 — Incidents (80 records)');
  const incidentDocs = await seedIncidents(org, users, assetDocs, alertDocs);

  // ── Step 8b: Cases ─────────────────────────────────────────────────────
  console.log('\n📦  Step 8b/8 — Cases (40 records)');
  await seedCases(org, users, incidentDocs);

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('📊  Final counts in database:');
  const counts = await Promise.all([
    ThreatIntel.countDocuments(),
    IOC.countDocuments(),
    Vulnerability.countDocuments(),
    YaraRule.countDocuments(),
    Asset.countDocuments({ organization: org._id }),
    Alert.countDocuments({ organization: org._id }),
    Incident.countDocuments({ organization: org._id }),
    Case.countDocuments({ organization: org._id }),
    User.countDocuments({ organization: org._id }),
  ]);
  const labels = ['ThreatIntelligence','IOCs','Vulnerabilities','YaraRules','Assets','Alerts','Incidents','Cases','Users'];
  labels.forEach((l, i) => console.log(`   ${l.padEnd(20)} ${counts[i]}`));

  console.log('\n✅  Seeding complete!');
  console.log('\n🔐  Admin login:');
  console.log('   Email:    admin@sentinelx.ai');
  console.log('   Password: SentinelX2026!\n');
  await mongoose.disconnect();
}

// ── Destroy mode ──────────────────────────────────────────────────────────────
async function destroy() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('⚠️  Destroying all seeded data…');
  await Promise.all([
    ThreatIntel.deleteMany({}),
    IOC.deleteMany({}),
    Vulnerability.deleteMany({}),
    YaraRule.deleteMany({}),
    Asset.deleteMany({}),
    Alert.deleteMany({}),
    Incident.deleteMany({}),
    Case.deleteMany({}),
    User.deleteMany({ email: /@sentinelx\.ai$/ }),
    Organization.deleteMany({ name: 'SentinelX Operations' }),
    Team.deleteMany({ name: 'SOC Team Alpha' }),
  ]);
  console.log('✅  All seeded data destroyed.');
  await mongoose.disconnect();
}

// ── CLI entry ─────────────────────────────────────────────────────────────────
if (process.argv[2] === '--destroy') {
  destroy().catch(err => { console.error(err); process.exit(1); });
} else {
  main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
}
