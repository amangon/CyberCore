/**
 * @file reportMock.ts
 * @description Realistic enterprise cybersecurity mock data for SentinelX AI.
 * Modelled after Microsoft Defender XDR, CrowdStrike Falcon, and Splunk ES report output.
 * Organisation profile: financial services firm, 1 200+ assets, multi-cloud environment.
 */

import {
  Report,
  ReportStatus,
  ReportType,
  ReportFormat,
  Severity,
  ComplianceFramework,
  DashboardSummary,
  ReportAuthor,
  ReportDepartment,
  SecurityScore,
  RiskScore,
  ExecutiveSummary,
  ThreatSummary,
  IncidentSummary,
  AssetSummary,
  ComplianceSummary,
  MitreCoverage,
  CVEStatistic,
  IOCStatistic,
  ReportRecommendation,
  ReportInsight,
  ReportChart,
  ReportWidget,
  ReportTable,
  ReportHistory,
  ReportAttachment,
  ReportComment,
  ReportBranding,
  ReportSchedule,
  ReportShare,
  ReportPermission,
  ReportKPI,
} from "../types/report";

// ---------------------------------------------------------------------------
// Shared reference data
// ---------------------------------------------------------------------------

const AUTHORS: readonly ReportAuthor[] = [
  {
    id: "usr-001",
    name: "Alexandra Chen",
    email: "a.chen@sentinelx.corp",
    title: "Chief Information Security Officer",
    avatarUrl: "https://cdn.sentinelx.corp/avatars/usr-001.png",
  },
  {
    id: "usr-002",
    name: "Marcus Webb",
    email: "m.webb@sentinelx.corp",
    title: "Senior Threat Intelligence Analyst",
    avatarUrl: "https://cdn.sentinelx.corp/avatars/usr-002.png",
  },
  {
    id: "usr-003",
    name: "Priya Nair",
    email: "p.nair@sentinelx.corp",
    title: "SOC Lead",
    avatarUrl: "https://cdn.sentinelx.corp/avatars/usr-003.png",
  },
  {
    id: "usr-004",
    name: "Daniel Okafor",
    email: "d.okafor@sentinelx.corp",
    title: "Vulnerability Management Engineer",
    avatarUrl: "https://cdn.sentinelx.corp/avatars/usr-004.png",
  },
  {
    id: "usr-005",
    name: "Sofia Reyes",
    email: "s.reyes@sentinelx.corp",
    title: "Compliance Officer",
    avatarUrl: "https://cdn.sentinelx.corp/avatars/usr-005.png",
  },
  {
    id: "usr-006",
    name: "James Thornton",
    email: "j.thornton@sentinelx.corp",
    title: "Principal Security Engineer",
    avatarUrl: "https://cdn.sentinelx.corp/avatars/usr-006.png",
  },
  {
    id: "usr-007",
    name: "Yuki Tanaka",
    email: "y.tanaka@sentinelx.corp",
    title: "Incident Response Manager",
    avatarUrl: "https://cdn.sentinelx.corp/avatars/usr-007.png",
  },
];

const DEPARTMENTS: readonly ReportDepartment[] = [
  {
    id: "dept-001",
    name: "Security Operations",
    division: "Cybersecurity",
    contactEmail: "soc@sentinelx.corp",
  },
  {
    id: "dept-002",
    name: "Threat Intelligence",
    division: "Cybersecurity",
    contactEmail: "ti@sentinelx.corp",
  },
  {
    id: "dept-003",
    name: "Compliance & Risk",
    division: "Legal & Risk",
    contactEmail: "compliance@sentinelx.corp",
  },
  {
    id: "dept-004",
    name: "Vulnerability Management",
    division: "Cybersecurity",
    contactEmail: "vulnmgmt@sentinelx.corp",
  },
  {
    id: "dept-005",
    name: "Executive Leadership",
    division: "Corporate",
    contactEmail: "exec@sentinelx.corp",
  },
  {
    id: "dept-006",
    name: "Incident Response",
    division: "Cybersecurity",
    contactEmail: "ir@sentinelx.corp",
  },
];

const BRANDING: ReportBranding = {
  logoUrl: "https://cdn.sentinelx.corp/brand/logo-full.svg",
  primaryColor: "#0A74DA",
  secondaryColor: "#E8F0FE",
  footerText:
    "CONFIDENTIAL — SentinelX AI Security Platform © 2026 Apex Financial Group",
  classificationLabel: "TLP:AMBER",
  showWatermark: true,
};

const DEFAULT_SCHEDULE: ReportSchedule = {
  enabled: true,
  cronExpression: "0 6 1 * *",
  timezone: "America/New_York",
  nextRunAt: "2026-09-01T06:00:00.000Z",
  lastRunAt: "2026-08-01T06:00:00.000Z",
  notifyEmails: ["ciso@sentinelx.corp", "exec@sentinelx.corp"],
  autoArchive: true,
};

const WEEKLY_SCHEDULE: ReportSchedule = {
  enabled: true,
  cronExpression: "0 7 * * 1",
  timezone: "America/New_York",
  nextRunAt: "2026-08-03T07:00:00.000Z",
  lastRunAt: "2026-07-27T07:00:00.000Z",
  notifyEmails: ["soc@sentinelx.corp"],
  autoArchive: false,
};

// ---------------------------------------------------------------------------
// Reusable section builders
// ---------------------------------------------------------------------------

function makeSecurityScore(score: number, delta: number): SecurityScore {
  const grade =
    score >= 90
      ? "Excellent"
      : score >= 75
      ? "Good"
      : score >= 60
      ? "Fair"
      : score >= 40
      ? "Poor"
      : "Critical";
  return {
    score,
    grade,
    delta,
    breakdown: {
      Endpoint: Math.min(100, score + 3),
      Network: Math.max(0, score - 5),
      Identity: Math.min(100, score + 1),
      Cloud: Math.max(0, score - 2),
      Application: Math.min(100, score + 4),
      Data: Math.max(0, score - 6),
    },
    calculatedAt: "2026-08-01T06:00:00.000Z",
  };
}

function makeRiskScore(score: number, delta: number): RiskScore {
  const level =
    score <= 25
      ? "Low"
      : score <= 50
      ? "Medium"
      : score <= 75
      ? "High"
      : "Critical";
  return {
    score,
    level,
    delta,
    breakdown: {
      Vulnerability: Math.round(score * 0.35),
      Threat: Math.round(score * 0.28),
      Compliance: Math.round(score * 0.18),
      Configuration: Math.round(score * 0.19),
    },
    topRiskFactors: [
      "Unpatched critical CVEs on internet-facing assets",
      "Overprivileged service accounts in Azure AD",
      "Incomplete MFA enforcement on VPN endpoints",
    ],
    calculatedAt: "2026-08-01T06:00:00.000Z",
  };
}

function makeExecutiveSummary(opts: {
  score: number;
  critical: number;
}): ExecutiveSummary {
  return {
    overview:
      "During the reporting period, Apex Financial Group maintained a strong security posture against an elevated external threat landscape. The SOC processed 1.4 million security events, escalating 312 to tier-2 analysis. Credential-based attacks targeting Azure AD remained the primary threat vector, consistent with CISA advisories issued in Q3 2026. Patch compliance improved by 4 percentage points following the completion of Project Ironclad. Three critical vulnerabilities in widely deployed network appliances were remediated within SLA.",
    overallPosture: opts.score,
    criticalFindings: opts.critical,
    topRisks: [
      "CVE-2026-40211 actively exploited in the wild — Palo Alto PAN-OS affected",
      "Lateral movement detected in DMZ segment (IR-2026-089 — contained)",
      "SOC2 Type II evidence collection gap in cloud logging pipeline",
      "Phishing campaign targeting finance team — 3 credential resets executed",
    ],
    improvements: [
      "MFA adoption increased from 84 % to 96 % across all BU accounts",
      "Mean time to detect dropped from 38 minutes to 21 minutes",
      "Endpoint coverage expanded to 1 187 of 1 210 managed devices",
    ],
    keyMetrics: [
      {
        label: "Security Score",
        value: opts.score,
        unit: "/100",
        previousValue: opts.score - 3,
        changePercent: 3.4,
        severity: Severity.LOW,
      },
      {
        label: "Mean Time to Detect",
        value: 21,
        unit: "min",
        previousValue: 38,
        changePercent: -44.7,
        severity: Severity.LOW,
      },
      {
        label: "Mean Time to Respond",
        value: 94,
        unit: "min",
        previousValue: 127,
        changePercent: -26,
        severity: Severity.MEDIUM,
      },
      {
        label: "Critical CVEs Open",
        value: opts.critical,
        unit: "findings",
        previousValue: opts.critical + 4,
        changePercent: -28.6,
        severity: Severity.HIGH,
      },
      {
        label: "Patch Compliance",
        value: 91,
        unit: "%",
        previousValue: 87,
        changePercent: 4.6,
        severity: Severity.LOW,
      },
    ],
    strategicRecommendations: [
      "Accelerate Privileged Access Workstation rollout for Tier-1 admin accounts by Q4 2026",
      "Initiate SOC2 Type II re-audit scope expansion to cover AWS GovCloud workloads",
      "Fund dedicated cloud identity security tooling to address Azure AD gaps",
      "Establish a formal Threat Intelligence sharing agreement with FS-ISAC",
    ],
  };
}

function makeThreatSummary(): ThreatSummary {
  return {
    totalThreats: 4821,
    criticalThreats: 18,
    highThreats: 97,
    mediumThreats: 683,
    lowThreats: 4023,
    topThreatCategories: [
      "Credential Theft",
      "Phishing / Spear-Phishing",
      "Ransomware Precursor",
      "PowerShell Abuse",
      "Privilege Escalation",
      "Cloud Token Abuse",
      "Lateral Movement",
      "Data Exfiltration Attempt",
    ],
    geographicOrigins: ["RU", "CN", "KP", "IR", "NG", "BR", "UA"],
    meanTimeToDetect: 21,
    meanTimeToRespond: 94,
    trend: "improving",
  };
}

function makeIncidentSummary(): IncidentSummary {
  return {
    totalIncidents: 47,
    openIncidents: 9,
    resolvedIncidents: 34,
    inProgressIncidents: 4,
    averageSeverityScore: 62,
    topIncidentIds: ["IR-2026-089", "IR-2026-074", "IR-2026-061", "IR-2026-055"],
    averageResolutionTimeHours: 6.4,
    escalatedCount: 5,
  };
}

function makeAssetSummary(): AssetSummary {
  return {
    totalAssets: 1210,
    criticalAssets: 47,
    offlineAssets: 23,
    unmonitoredAssets: 31,
    assetsByType: {
      Server: 312,
      Endpoint: 641,
      "Network Device": 104,
      "Cloud Workload": 89,
      "IoT/OT": 64,
    },
    assetsBySegment: {
      "Corporate LAN": 489,
      DMZ: 87,
      "Azure Production": 312,
      "AWS GovCloud": 98,
      "OT Network": 64,
      "Remote VPN": 160,
    },
    coveragePercent: 97.4,
    newlyDiscovered: 14,
  };
}

function makeComplianceSummary(): ComplianceSummary {
  return {
    frameworks: [
      ComplianceFramework.SOC2,
      ComplianceFramework.PCI_DSS,
      ComplianceFramework.NIST,
      ComplianceFramework.ISO27001,
      ComplianceFramework.GDPR,
    ],
    overallScore: 84,
    frameworkScores: {
      [ComplianceFramework.ISO27001]: 88,
      [ComplianceFramework.NIST]: 86,
      [ComplianceFramework.CIS]: 79,
      [ComplianceFramework.PCI_DSS]: 91,
      [ComplianceFramework.SOC2]: 83,
      [ComplianceFramework.HIPAA]: 77,
      [ComplianceFramework.GDPR]: 85,
      [ComplianceFramework.CISA]: 82,
    },
    passedControls: 318,
    failedControls: 41,
    notAssessedControls: 22,
    topGaps: [
      "CC6.1 — Logical access controls — incomplete MFA on legacy VPN",
      "PCI-DSS 6.3 — Vulnerability management SLA breach on 3 in-scope hosts",
      "NIST CSF RS.MI-2 — Incident containment playbook not updated for cloud IR",
      "ISO 27001 A.12.6 — Patch management process exception for OT network",
    ],
    nextReviewDate: "2026-10-15T00:00:00.000Z",
  };
}

function makeMitreCoverage(): MitreCoverage {
  return {
    totalTactics: 14,
    coveredTactics: 11,
    totalTechniques: 193,
    coveredTechniques: 141,
    coveragePercent: 73.1,
    topGapTactics: ["TA0010 — Exfiltration", "TA0042 — Resource Development"],
    strongestTactics: [
      "TA0001 — Initial Access",
      "TA0002 — Execution",
      "TA0003 — Persistence",
    ],
  };
}

function makeCVEStatistics(): readonly CVEStatistic[] {
  return [
    {
      cveId: "CVE-2026-40211",
      description:
        "Palo Alto Networks PAN-OS — unauthenticated RCE in GlobalProtect gateway via malformed HTTP/2 CONTINUATION frame",
      cvssScore: 9.8,
      severity: Severity.CRITICAL,
      affectedAssets: 4,
      exploitAvailable: true,
      patchAvailable: true,
      publishedAt: "2026-06-18T00:00:00.000Z",
    },
    {
      cveId: "CVE-2026-33741",
      description:
        "Microsoft Exchange Server — SSRF leading to privilege escalation via crafted Autodiscover request",
      cvssScore: 8.8,
      severity: Severity.HIGH,
      affectedAssets: 2,
      exploitAvailable: true,
      patchAvailable: true,
      publishedAt: "2026-05-12T00:00:00.000Z",
    },
    {
      cveId: "CVE-2025-47774",
      description:
        "VMware vCenter Server — heap overflow in DCERPC service allows unauthenticated code execution",
      cvssScore: 9.1,
      severity: Severity.CRITICAL,
      affectedAssets: 3,
      exploitAvailable: true,
      patchAvailable: true,
      publishedAt: "2025-11-04T00:00:00.000Z",
    },
    {
      cveId: "CVE-2026-21234",
      description:
        "Cisco IOS XE — command injection in web UI management interface (CVSSv3.1 9.0)",
      cvssScore: 9.0,
      severity: Severity.CRITICAL,
      affectedAssets: 7,
      exploitAvailable: true,
      patchAvailable: false,
      publishedAt: "2026-07-02T00:00:00.000Z",
    },
    {
      cveId: "CVE-2025-1234",
      description:
        "OpenSSH pre-auth race condition (regreSSHion variant) — remote code execution as root on glibc-based Linux",
      cvssScore: 8.1,
      severity: Severity.HIGH,
      affectedAssets: 19,
      exploitAvailable: true,
      patchAvailable: true,
      publishedAt: "2025-07-01T00:00:00.000Z",
    },
    {
      cveId: "CVE-2026-18812",
      description:
        "Fortinet FortiGate — buffer overflow in SSL-VPN daemon allows pre-auth RCE",
      cvssScore: 9.6,
      severity: Severity.CRITICAL,
      affectedAssets: 2,
      exploitAvailable: false,
      patchAvailable: true,
      publishedAt: "2026-07-21T00:00:00.000Z",
    },
    {
      cveId: "CVE-2026-29011",
      description:
        "Apache HTTP Server mod_proxy — HTTP request smuggling via malformed Content-Length header",
      cvssScore: 7.5,
      severity: Severity.HIGH,
      affectedAssets: 11,
      exploitAvailable: false,
      patchAvailable: true,
      publishedAt: "2026-04-09T00:00:00.000Z",
    },
    {
      cveId: "CVE-2025-38512",
      description:
        "Windows LDAP client — integer overflow triggers heap corruption on crafted LDAP response",
      cvssScore: 8.8,
      severity: Severity.HIGH,
      affectedAssets: 214,
      exploitAvailable: false,
      patchAvailable: true,
      publishedAt: "2025-10-08T00:00:00.000Z",
    },
  ];
}

function makeIOCStatistics(): readonly IOCStatistic[] {
  return [
    {
      type: "IP Address",
      total: 1847,
      malicious: 412,
      suspicious: 289,
      blocked: 398,
      topIndicators: [
        "45.142.212.100",
        "194.165.16.43",
        "91.92.248.199",
        "185.220.101.32",
        "103.76.228.14",
      ],
    },
    {
      type: "Domain",
      total: 634,
      malicious: 187,
      suspicious: 112,
      blocked: 176,
      topIndicators: [
        "update-service.microsofts-cdn.com",
        "cdn-analytics.azure-blob-store.net",
        "secure-login.apexfinancials.workers.dev",
        "telemetry.win32-updater.io",
        "auth.teams-conference.live",
      ],
    },
    {
      type: "File Hash (SHA-256)",
      total: 312,
      malicious: 89,
      suspicious: 43,
      blocked: 84,
      topIndicators: [
        "3d2b4a1f8e9c7d6b5a4e3c2b1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2",
        "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
        "deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
        "cafe0000111122223333444455556666777788889999aaaabbbbccccddddeeee",
        "f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff00010203040506070809101112131415",
      ],
    },
    {
      type: "URL",
      total: 428,
      malicious: 156,
      suspicious: 94,
      blocked: 148,
      topIndicators: [
        "https://update-service.microsofts-cdn.com/patch/kb5041234.exe",
        "https://cdn-analytics.azure-blob-store.net/c2/beacon",
        "http://103.76.228.14:8080/upload?id=apexfin",
        "https://secure-login.apexfinancials.workers.dev/oauth",
        "http://91.92.248.199/rat/stage2.bin",
      ],
    },
    {
      type: "Email Address",
      total: 219,
      malicious: 78,
      suspicious: 61,
      blocked: 74,
      topIndicators: [
        "it-support@microsofts-cdn.com",
        "noreply@apex-financial-alert.com",
        "security-team@apexfinancials.workers.dev",
        "hr-payroll@apexfin-notifications.net",
        "cfo-office@apexfinancialgrp.co",
      ],
    },
  ];
}

function makeRecommendations(): readonly ReportRecommendation[] {
  return [
    {
      id: "rec-001",
      title: "Patch CVE-2026-40211 on all PAN-OS GlobalProtect gateways",
      description:
        "Four internet-facing Palo Alto GlobalProtect gateways running PAN-OS 11.1.x are vulnerable to CVE-2026-40211 (CVSS 9.8). Active exploitation has been observed in financial services verticals by threat actor COZY SCORPION. Upgrade to PAN-OS 11.1.4-h1 or later within 24 hours. Apply network-level mitigations (block non-corporate source IPs on GP port) as an immediate compensating control.",
      priority: Severity.CRITICAL,
      effort: "Low",
      impact: "High",
      status: "In Progress",
      frameworks: [ComplianceFramework.NIST, ComplianceFramework.CIS],
      dueDate: "2026-08-03T00:00:00.000Z",
    },
    {
      id: "rec-002",
      title: "Enforce MFA on all legacy VPN endpoints (PCI DSS 8.4)",
      description:
        "Fourteen VPN concentrator profiles still permit password-only authentication, violating PCI DSS 4.0 requirement 8.4. Enable RADIUS-based MFA using Duo Security or Microsoft Entra ID MFA for all profiles. This gap was flagged in the last QSA assessment and constitutes a compensating control finding. Completion is required before the Q3 PCI DSS external scan.",
      priority: Severity.HIGH,
      effort: "Medium",
      impact: "High",
      status: "Open",
      frameworks: [ComplianceFramework.PCI_DSS, ComplianceFramework.SOC2],
      dueDate: "2026-08-31T00:00:00.000Z",
    },
    {
      id: "rec-003",
      title: "Remove persistent admin sessions in Azure AD Privileged Identity Management",
      description:
        "Eleven Global Administrator accounts have active permanent role assignments in Azure AD, bypassing PIM just-in-time workflows. Convert all GA assignments to eligible-only with 4-hour activation windows and require justification + approval for activation. This directly addresses the overprivileged service accounts risk identified in the risk register.",
      priority: Severity.HIGH,
      effort: "Low",
      impact: "High",
      status: "Open",
      frameworks: [ComplianceFramework.SOC2, ComplianceFramework.NIST],
      dueDate: "2026-08-15T00:00:00.000Z",
    },
    {
      id: "rec-004",
      title: "Deploy Privileged Access Workstations for Tier-0 and Tier-1 admins",
      description:
        "CrowdStrike telemetry shows Tier-1 administrators regularly accessing privileged systems from standard workstations that also receive email and browse the internet. Deploy dedicated PAWs running hardened Windows 11 images per MSRC guidance. Begin with the 23 Azure and AD admins, then expand to network admins. Expected to reduce lateral movement risk by 60 %.",
      priority: Severity.HIGH,
      effort: "High",
      impact: "High",
      status: "Open",
      frameworks: [
        ComplianceFramework.CIS,
        ComplianceFramework.NIST,
        ComplianceFramework.ISO27001,
      ],
      dueDate: "2026-12-31T00:00:00.000Z",
    },
    {
      id: "rec-005",
      title: "Remediate SOC2 CC6.1 logging gap in cloud pipeline",
      description:
        "The AWS GovCloud CloudTrail → Splunk pipeline has a 4-hour retention gap for S3 data-plane events in the us-gov-east-1 region due to a misconfigured SQS subscription. This creates an evidence gap for SOC2 CC6.1 (logical access monitoring). Fix the SQS policy and validate log completeness before the Q4 Type II audit window.",
      priority: Severity.MEDIUM,
      effort: "Low",
      impact: "Medium",
      status: "In Progress",
      frameworks: [ComplianceFramework.SOC2, ComplianceFramework.GDPR],
      dueDate: "2026-08-20T00:00:00.000Z",
    },
    {
      id: "rec-006",
      title: "Extend EDR coverage to OT/ICS network segment",
      description:
        "Sixty-four OT/ICS assets in the trading floor network segment operate without any EDR or behavioural monitoring. Deploy CrowdStrike Falcon for IoT or Microsoft Defender for IoT sensors on the network tap to achieve passive monitoring without disrupting OT protocols. Coordinate change window with OT operations team.",
      priority: Severity.MEDIUM,
      effort: "High",
      impact: "High",
      status: "Open",
      frameworks: [ComplianceFramework.NIST, ComplianceFramework.CIS],
      dueDate: "2026-11-30T00:00:00.000Z",
    },
  ];
}

function makeInsights(): readonly ReportInsight[] {
  return [
    {
      id: "ins-001",
      title: "COZY SCORPION campaign targeting GlobalProtect infrastructure",
      description:
        "SentinelX AI correlates indicators across 14 global feeds confirming an active nation-state campaign (attributed to COZY SCORPION, assessed with high confidence to be SVR-affiliated) specifically targeting financial services GlobalProtect gateways. The campaign exploits CVE-2026-40211 to establish persistent HTTPS tunnels using a custom implant (LIGHTCANAL). Four IOCs matching this campaign were detected in network egress logs on 2026-07-28.",
      severity: Severity.CRITICAL,
      source: "AI Threat Correlation",
      relatedIds: ["CVE-2026-40211", "IR-2026-089", "45.142.212.100", "194.165.16.43"],
      generatedAt: "2026-08-01T04:12:00.000Z",
    },
    {
      id: "ins-002",
      title: "Anomalous Azure AD sign-in pattern — credential stuffing campaign",
      description:
        "Between 2026-07-22 and 2026-07-29, Microsoft Entra ID Protection logged 8 470 failed authentications against 412 unique accounts originating from 23 Tor exit nodes and 6 cloud proxy ranges. Password spray pattern consistent with Scattered Spider TTP (T1110.003). Three accounts were successfully compromised before automated response triggered conditional access block. All three accounts have been reset and investigated.",
      severity: Severity.HIGH,
      source: "AI Behavioral Analysis",
      relatedIds: ["IR-2026-074", "T1110.003", "usr-entra-412"],
      generatedAt: "2026-07-29T08:44:00.000Z",
    },
    {
      id: "ins-003",
      title: "PowerShell AMSI bypass attempts — insider threat signal",
      description:
        "CrowdStrike Falcon detected 47 AMSI bypass attempts across 3 endpoints in the trading analytics team over 5 days. All events originate from the same user account (privilege: standard user). No malware payloads were successfully executed; however, the pattern is consistent with insider exploration or a compromised account performing reconnaissance. The account has been flagged for UEBA review.",
      severity: Severity.HIGH,
      source: "UEBA Engine",
      relatedIds: ["T1562.001", "T1059.001", "endpoint-win-0412"],
      generatedAt: "2026-07-31T11:20:00.000Z",
    },
    {
      id: "ins-004",
      title: "Phishing campaign delivery rate reduced by 94 % after DMARC enforcement",
      description:
        "Following DMARC policy enforcement on all 12 corporate domains in July 2026, the inbound phishing delivery rate dropped from 1.2 % to 0.07 %. SentinelX AI tracked 3 410 blocked spoofed delivery attempts targeting the finance and HR teams during the reporting period. The DMARC enforcement also surfaced 4 previously unknown shadow-IT email sending domains.",
      severity: Severity.LOW,
      source: "AI Threat Correlation",
      relatedIds: ["T1566.001", "phish-campaign-2026-07"],
      generatedAt: "2026-07-30T09:15:00.000Z",
    },
    {
      id: "ins-005",
      title: "Shadow SaaS discovery — unsanctioned file-sharing tool in Finance",
      description:
        "Cloud Access Security Broker telemetry identified 212 uploads totalling 4.7 GB of data to an unsanctioned personal Dropbox account from three endpoints in the Finance department over the past 30 days. No classified or PCI-scoped data was confirmed in the sampled uploads, but the activity violates the Acceptable Use Policy. The department head has been notified and a DLP policy exception review is underway.",
      severity: Severity.MEDIUM,
      source: "CASB Telemetry",
      relatedIds: ["dept-001", "endpoint-win-0287", "endpoint-win-0291"],
      generatedAt: "2026-07-26T14:02:00.000Z",
    },
  ];
}

function makeCharts(): readonly ReportChart[] {
  return [
    {
      id: "chart-001",
      type: "line",
      title: "Security Events Over Time",
      description: "Daily volume of ingested and escalated security events over the reporting period.",
      series: [
        {
          name: "Total Events (thousands)",
          data: [38, 41, 36, 44, 52, 47, 39, 43, 46, 41, 37, 45, 49, 51],
        },
        {
          name: "Escalated to Tier-2",
          data: [18, 22, 15, 27, 31, 24, 19, 21, 26, 20, 17, 23, 29, 33],
        },
      ],
      categories: [
        "Jul 18", "Jul 19", "Jul 20", "Jul 21", "Jul 22", "Jul 23", "Jul 24",
        "Jul 25", "Jul 26", "Jul 27", "Jul 28", "Jul 29", "Jul 30", "Jul 31",
      ],
    },
    {
      id: "chart-002",
      type: "bar",
      title: "Incidents by Severity",
      description: "Distribution of the 47 tracked incidents by assigned severity level.",
      series: [
        {
          name: "Incident Count",
          data: [4, 12, 21, 10],
        },
      ],
      categories: ["Critical", "High", "Medium", "Low"],
    },
    {
      id: "chart-003",
      type: "donut",
      title: "Asset Coverage by Segment",
      description: "Percentage of monitored assets grouped by network segment.",
      series: [
        {
          name: "Assets",
          data: [489, 87, 312, 98, 64, 160],
        },
      ],
      categories: [
        "Corporate LAN", "DMZ", "Azure Production", "AWS GovCloud", "OT Network", "Remote VPN",
      ],
    },
    {
      id: "chart-004",
      type: "area",
      title: "MTTD / MTTR Trend (minutes)",
      description: "Rolling weekly mean time to detect and mean time to respond.",
      series: [
        { name: "MTTD", data: [38, 34, 29, 21] },
        { name: "MTTR", data: [127, 118, 105, 94] },
      ],
      categories: ["Week 1", "Week 2", "Week 3", "Week 4"],
    },
    {
      id: "chart-005",
      type: "radar",
      title: "MITRE ATT&CK Tactic Coverage",
      description: "Detection coverage percentage mapped across the 14 MITRE ATT&CK tactics.",
      series: [
        {
          name: "Coverage %",
          data: [92, 88, 84, 76, 71, 68, 74, 81, 79, 65, 58, 70, 62, 55],
        },
      ],
      categories: [
        "Initial Access", "Execution", "Persistence", "Privilege Escalation",
        "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
        "Collection", "Command and Control", "Exfiltration", "Impact",
        "Reconnaissance", "Resource Development",
      ],
    },
  ];
}

function makeWidgets(): readonly ReportWidget[] {
  return [
    {
      id: "wgt-score-card",
      type: "scoreCard",
      title: "Security Score",
      description: "High-level composite security posture score.",
      dataSource: "security-score",
      defaultSize: { w: 3, h: 2 },
      configurable: true,
      icon: "shield-check",
    },
    {
      id: "wgt-risk-gauge",
      type: "gauge",
      title: "Risk Score",
      description: "Composite organizational risk gauge.",
      dataSource: "risk-score",
      defaultSize: { w: 3, h: 2 },
      configurable: true,
      icon: "gauge",
    },
    {
      id: "wgt-threat-timeline",
      type: "chart",
      title: "Threat Volume Timeline",
      description: "Time-series chart of detected threats.",
      dataSource: "threat-analytics",
      defaultSize: { w: 6, h: 3 },
      configurable: true,
      icon: "activity",
    },
    {
      id: "wgt-incident-table",
      type: "table",
      title: "Open Incidents",
      description: "Table of currently open and in-progress incidents.",
      dataSource: "incident-analytics",
      defaultSize: { w: 6, h: 4 },
      configurable: true,
      icon: "list",
    },
    {
      id: "wgt-top-cves",
      type: "table",
      title: "Top CVEs",
      description: "Ranked list of highest-severity CVEs affecting the environment.",
      dataSource: "top-cves",
      defaultSize: { w: 4, h: 4 },
      configurable: true,
      icon: "bug",
    },
    {
      id: "wgt-mitre-heatmap",
      type: "heatmap",
      title: "MITRE ATT&CK Heatmap",
      description: "Coverage heatmap across MITRE tactics and techniques.",
      dataSource: "mitre-coverage",
      defaultSize: { w: 6, h: 4 },
      configurable: true,
      icon: "grid",
    },
    {
      id: "wgt-compliance-donut",
      type: "chart",
      title: "Compliance Framework Scores",
      description: "Donut chart of scores per compliance framework.",
      dataSource: "compliance-analytics",
      defaultSize: { w: 4, h: 3 },
      configurable: true,
      icon: "check-circle",
    },
    {
      id: "wgt-exec-summary",
      type: "text",
      title: "Executive Summary",
      description: "AI-generated narrative summary of the reporting period.",
      dataSource: "executive-summary",
      defaultSize: { w: 12, h: 3 },
      configurable: false,
      icon: "file-text",
    },
    {
      id: "wgt-geo-map",
      type: "map",
      title: "Threat Origin Map",
      description: "Geographic distribution of inbound threat traffic.",
      dataSource: "top-countries",
      defaultSize: { w: 6, h: 4 },
      configurable: true,
      icon: "globe",
    },
    {
      id: "wgt-ioc-summary",
      type: "table",
      title: "IOC Summary",
      description: "Breakdown of indicators of compromise by type and disposition.",
      dataSource: "ioc-analytics",
      defaultSize: { w: 6, h: 3 },
      configurable: true,
      icon: "target",
    },
  ];
}

function makeTables(): readonly ReportTable[] {
  return [
    {
      id: "tbl-open-incidents",
      title: "Open & In-Progress Incidents",
      columns: ["ID", "Title", "Severity", "Status", "Owner", "Opened"],
      rows: [
        ["IR-2026-089", "Suspected C2 tunnel via GlobalProtect", "Critical", "Contained", "Yuki Tanaka", "2026-07-28"],
        ["IR-2026-074", "Credential stuffing campaign — Entra ID", "High", "In Progress", "Priya Nair", "2026-07-22"],
        ["IR-2026-061", "AMSI bypass activity — trading analytics", "High", "In Progress", "Marcus Webb", "2026-07-19"],
        ["IR-2026-055", "Shadow SaaS data exfiltration risk", "Medium", "Open", "Sofia Reyes", "2026-07-15"],
      ],
    },
    {
      id: "tbl-top-vulnerable-hosts",
      title: "Top Vulnerable Hosts",
      columns: ["Hostname", "IP", "Critical CVEs", "Segment", "Owner"],
      rows: [
        ["edge-fw-gp-01", "10.20.4.11", "1", "DMZ", "Network Team"],
        ["edge-fw-gp-02", "10.20.4.12", "1", "DMZ", "Network Team"],
        ["vc-prod-cluster-a", "10.10.2.55", "1", "Azure Production", "Cloud Platform Team"],
        ["ios-xe-core-sw12", "10.5.0.12", "1", "Corporate LAN", "Network Team"],
      ],
    },
  ];
}

function makeAttachments(): readonly ReportAttachment[] {
  return [
    {
      id: "att-001",
      fileName: "SentinelX_Executive_Summary_Q3_2026.pdf",
      fileType: "application/pdf",
      sizeBytes: 842_112,
      uploadedBy: "usr-001",
      uploadedAt: "2026-08-01T06:05:00.000Z",
      url: "mock://attachments/att-001.pdf",
    },
    {
      id: "att-002",
      fileName: "IR-2026-089_Forensic_Timeline.xlsx",
      fileType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      sizeBytes: 231_884,
      uploadedBy: "usr-007",
      uploadedAt: "2026-07-29T10:40:00.000Z",
      url: "mock://attachments/att-002.xlsx",
    },
    {
      id: "att-003",
      fileName: "PCI_DSS_Gap_Assessment_2026.docx",
      fileType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 156_432,
      uploadedBy: "usr-005",
      uploadedAt: "2026-07-25T13:12:00.000Z",
      url: "mock://attachments/att-003.docx",
    },
  ];
}

function makeComments(): readonly ReportComment[] {
  return [
    {
      id: "cmt-001",
      authorId: "usr-001",
      content:
        "Approved for distribution to the board. Please add the CVE-2026-40211 remediation timeline as an appendix before the Friday sync.",
      createdAt: "2026-08-01T07:30:00.000Z",
      resolved: false,
    },
    {
      id: "cmt-002",
      authorId: "usr-003",
      content:
        "SOC has validated all containment actions for IR-2026-089. Recommend downgrading from Critical to High pending final root-cause confirmation.",
      createdAt: "2026-07-30T16:05:00.000Z",
      resolved: true,
    },
    {
      id: "cmt-003",
      authorId: "usr-005",
      content:
        "Compliance section needs the updated PCI DSS 4.0 control mapping — will attach by EOD Monday.",
      createdAt: "2026-07-29T11:22:00.000Z",
      resolved: false,
    },
  ];
}

function makePermissions(): readonly ReportPermission[] {
  return [
    { userId: "usr-001", role: "Owner", canEdit: true, canShare: true, canDelete: true },
    { userId: "usr-003", role: "Editor", canEdit: true, canShare: true, canDelete: false },
    { userId: "usr-002", role: "Viewer", canEdit: false, canShare: false, canDelete: false },
    { userId: "usr-005", role: "Editor", canEdit: true, canShare: false, canDelete: false },
  ];
}

function makeShares(): readonly ReportShare[] {
  return [
    {
      id: "shr-001",
      sharedWith: ["exec@sentinelx.corp", "board@sentinelx.corp"],
      sharedBy: "usr-001",
      sharedAt: "2026-08-01T07:32:00.000Z",
      linkUrl: "mock://shared-reports/rpt-exec-q3-2026",
      expiresAt: "2026-09-01T00:00:00.000Z",
    },
    {
      id: "shr-002",
      sharedWith: ["ir@sentinelx.corp"],
      sharedBy: "usr-007",
      sharedAt: "2026-07-29T10:50:00.000Z",
      linkUrl: "mock://shared-reports/rpt-ir-089-postmortem",
      expiresAt: null,
    },
  ];
}

function makeHistory(reportId: string): readonly ReportHistory[] {
  return [
    {
      id: `hist-${reportId}-001`,
      action: "created",
      performedBy: "usr-001",
      timestamp: "2026-07-01T06:00:00.000Z",
      details: "Report generated from monthly executive template.",
    },
    {
      id: `hist-${reportId}-002`,
      action: "updated",
      performedBy: "usr-003",
      timestamp: "2026-07-15T09:20:00.000Z",
      details: "Incident summary section refreshed with latest SOC data.",
    },
    {
      id: `hist-${reportId}-003`,
      action: "exported",
      performedBy: "usr-001",
      timestamp: "2026-08-01T06:10:00.000Z",
      details: "Exported to PDF for board distribution.",
    },
  ];
}

function makeKPIs(): readonly ReportKPI[] {
  return [
    { label: "Security Score", value: 82, unit: "/100", trend: "up", severity: Severity.LOW },
    { label: "Risk Score", value: 38, unit: "/100", trend: "down", severity: Severity.MEDIUM },
    { label: "Compliance Score", value: 84, unit: "%", trend: "up", severity: Severity.LOW },
    { label: "Open Critical Findings", value: 4, unit: "findings", trend: "down", severity: Severity.CRITICAL },
    { label: "Mean Time to Detect", value: 21, unit: "min", trend: "down", severity: Severity.LOW },
    { label: "Mean Time to Respond", value: 94, unit: "min", trend: "down", severity: Severity.MEDIUM },
    { label: "Patch Compliance", value: 91, unit: "%", trend: "up", severity: Severity.LOW },
    { label: "Asset Coverage", value: 97.4, unit: "%", trend: "up", severity: Severity.LOW },
  ];
}

// ---------------------------------------------------------------------------
// Report entities
// ---------------------------------------------------------------------------

const securityScore = makeSecurityScore(82, 3);
const riskScore = makeRiskScore(38, -6);
const executiveSummary = makeExecutiveSummary({ score: 82, critical: 4 });
const threatSummary = makeThreatSummary();
const incidentSummary = makeIncidentSummary();
const assetSummary = makeAssetSummary();
const complianceSummary = makeComplianceSummary();
const mitreCoverage = makeMitreCoverage();
const cveStatistics = makeCVEStatistics();
const iocStatistics = makeIOCStatistics();
const recommendations = makeRecommendations();
const insights = makeInsights();
const charts = makeCharts();
const widgets = makeWidgets();
const tables = makeTables();
const attachments = makeAttachments();
const comments = makeComments();
const permissions = makePermissions();
const shares = makeShares();
const kpis = makeKPIs();

export const mockReports: Report[] = [
  {
    id: "rpt-exec-q3-2026",
    title: "Executive Security Briefing — Q3 2026",
    description:
      "Monthly executive-level summary of security posture, top risks, and strategic recommendations for Apex Financial Group leadership.",
    type: ReportType.EXECUTIVE,
    format: ReportFormat.PDF,
    status: ReportStatus.PUBLISHED,
    severity: Severity.HIGH,
    owner: "Alexandra Chen",
    author: AUTHORS[0],
    department: DEPARTMENTS[4],
    tags: ["executive", "monthly", "board-ready"],
    createdAt: "2026-07-01T06:00:00.000Z",
    updatedAt: "2026-08-01T07:32:00.000Z",
    publishedAt: "2026-08-01T06:10:00.000Z",
    securityScore,
    riskScore,
    executiveSummary,
    threatSummary,
    incidentSummary,
    assetSummary,
    complianceSummary,
    mitreCoverage,
    cveStatistics,
    iocStatistics,
    recommendations,
    insights,
    charts,
    widgets: [...widgets].slice(0, 6),
    tables,
    attachments,
    comments,
    branding: BRANDING,
    schedule: DEFAULT_SCHEDULE,
    shares,
    permissions,
    history: makeHistory("rpt-exec-q3-2026"),
    kpis,
    builderLayout: null,
  },
  {
    id: "rpt-ir-089-postmortem",
    title: "Incident Postmortem — IR-2026-089 (Suspected C2 via GlobalProtect)",
    description:
      "Detailed forensic timeline, root cause analysis, and remediation status for the containment of a suspected command-and-control tunnel exploiting CVE-2026-40211.",
    type: ReportType.INCIDENT,
    format: ReportFormat.PDF,
    status: ReportStatus.IN_REVIEW,
    severity: Severity.CRITICAL,
    owner: "Yuki Tanaka",
    author: AUTHORS[6],
    department: DEPARTMENTS[5],
    tags: ["incident", "postmortem", "critical", "mitre-mapped"],
    createdAt: "2026-07-28T15:10:00.000Z",
    updatedAt: "2026-07-30T16:05:00.000Z",
    publishedAt: null,
    securityScore: makeSecurityScore(76, -4),
    riskScore: makeRiskScore(54, 9),
    executiveSummary: makeExecutiveSummary({ score: 76, critical: 6 }),
    threatSummary,
    incidentSummary,
    assetSummary,
    complianceSummary,
    mitreCoverage,
    cveStatistics: cveStatistics.filter((c) => c.cveId === "CVE-2026-40211"),
    iocStatistics,
    recommendations: recommendations.filter((r) => r.id === "rec-001"),
    insights: insights.filter((i) => i.id === "ins-001"),
    charts: charts.filter((c) => c.id === "chart-001" || c.id === "chart-004"),
    widgets: widgets.filter((w) => w.dataSource === "incident-analytics"),
    tables: tables.filter((t) => t.id === "tbl-open-incidents"),
    attachments: attachments.filter((a) => a.id === "att-002"),
    comments: comments.filter((c) => c.id === "cmt-002"),
    branding: BRANDING,
    schedule: null,
    shares: shares.filter((s) => s.id === "shr-002"),
    permissions,
    history: makeHistory("rpt-ir-089-postmortem"),
    kpis: kpis.filter((k) => k.label.includes("Detect") || k.label.includes("Respond")),
    builderLayout: null,
  },
  {
    id: "rpt-vuln-monthly-jul2026",
    title: "Vulnerability Management Report — July 2026",
    description:
      "Comprehensive scan results, patch compliance metrics, and prioritized remediation guidance for critical and high-severity CVEs across the environment.",
    type: ReportType.VULNERABILITY,
    format: ReportFormat.EXCEL,
    status: ReportStatus.PUBLISHED,
    severity: Severity.HIGH,
    owner: "Daniel Okafor",
    author: AUTHORS[3],
    department: DEPARTMENTS[3],
    tags: ["vulnerability", "monthly", "patch-compliance"],
    createdAt: "2026-07-31T18:00:00.000Z",
    updatedAt: "2026-07-31T18:45:00.000Z",
    publishedAt: "2026-07-31T19:00:00.000Z",
    securityScore,
    riskScore,
    executiveSummary: makeExecutiveSummary({ score: 82, critical: 4 }),
    threatSummary,
    incidentSummary,
    assetSummary,
    complianceSummary,
    mitreCoverage,
    cveStatistics,
    iocStatistics,
    recommendations: recommendations.filter((r) =>
      ["rec-001", "rec-006"].includes(r.id)
    ),
    insights: [],
    charts: charts.filter((c) => c.id === "chart-002"),
    widgets: widgets.filter((w) => w.dataSource === "top-cves"),
    tables: tables.filter((t) => t.id === "tbl-top-vulnerable-hosts"),
    attachments: [],
    comments: [],
    branding: BRANDING,
    schedule: WEEKLY_SCHEDULE,
    shares: [],
    permissions,
    history: makeHistory("rpt-vuln-monthly-jul2026"),
    kpis: kpis.filter((k) => k.label.includes("Patch") || k.label.includes("Critical")),
    builderLayout: null,
  },
  {
    id: "rpt-compliance-soc2-q3-2026",
    title: "SOC 2 Type II Readiness Report — Q3 2026",
    description:
      "Control-by-control assessment of SOC 2 Type II readiness ahead of the Q4 external audit, including identified gaps and remediation owners.",
    type: ReportType.COMPLIANCE,
    format: ReportFormat.PDF,
    status: ReportStatus.DRAFT,
    severity: Severity.MEDIUM,
    owner: "Sofia Reyes",
    author: AUTHORS[4],
    department: DEPARTMENTS[2],
    tags: ["compliance", "soc2", "audit-prep"],
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-29T11:22:00.000Z",
    publishedAt: null,
    securityScore,
    riskScore,
    executiveSummary: makeExecutiveSummary({ score: 82, critical: 4 }),
    threatSummary,
    incidentSummary,
    assetSummary,
    complianceSummary,
    mitreCoverage,
    cveStatistics: [],
    iocStatistics: [],
    recommendations: recommendations.filter((r) => r.id === "rec-005"),
    insights: [],
    charts: charts.filter((c) => c.id === "chart-003"),
    widgets: widgets.filter((w) => w.dataSource === "compliance-analytics"),
    tables: [],
    attachments: attachments.filter((a) => a.id === "att-003"),
    comments: comments.filter((c) => c.id === "cmt-003"),
    branding: BRANDING,
    schedule: null,
    shares: [],
    permissions,
    history: makeHistory("rpt-compliance-soc2-q3-2026"),
    kpis: kpis.filter((k) => k.label.includes("Compliance")),
    builderLayout: null,
  },
  {
    id: "rpt-threat-intel-weekly-30",
    title: "Weekly Threat Intelligence Digest — Week 30",
    description:
      "Rollup of active campaigns, newly observed IOCs, and threat actor activity relevant to the financial services sector.",
    type: ReportType.THREAT_INTEL,
    format: ReportFormat.HTML,
    status: ReportStatus.PUBLISHED,
    severity: Severity.HIGH,
    owner: "Marcus Webb",
    author: AUTHORS[1],
    department: DEPARTMENTS[1],
    tags: ["threat-intel", "weekly", "campaign-tracking"],
    createdAt: "2026-07-27T07:00:00.000Z",
    updatedAt: "2026-07-27T07:05:00.000Z",
    publishedAt: "2026-07-27T07:05:00.000Z",
    securityScore,
    riskScore,
    executiveSummary: makeExecutiveSummary({ score: 82, critical: 4 }),
    threatSummary,
    incidentSummary,
    assetSummary,
    complianceSummary,
    mitreCoverage,
    cveStatistics: cveStatistics.slice(0, 3),
    iocStatistics,
    recommendations: [],
    insights: insights.filter((i) => ["ins-001", "ins-002"].includes(i.id)),
    charts: charts.filter((c) => c.id === "chart-005"),
    widgets: widgets.filter((w) => w.dataSource === "top-countries"),
    tables: [],
    attachments: [],
    comments: [],
    branding: BRANDING,
    schedule: WEEKLY_SCHEDULE,
    shares: [],
    permissions,
    history: makeHistory("rpt-threat-intel-weekly-30"),
    kpis: kpis.filter((k) => k.label.includes("Security") || k.label.includes("Risk")),
    builderLayout: null,
  },
  {
    id: "rpt-asset-inventory-jul2026",
    title: "Asset Inventory & Coverage Report — July 2026",
    description:
      "Snapshot of the managed asset inventory, monitoring coverage, and newly discovered/unmonitored assets across all network segments.",
    type: ReportType.ASSET,
    format: ReportFormat.CSV,
    status: ReportStatus.ARCHIVED,
    severity: Severity.LOW,
    owner: "James Thornton",
    author: AUTHORS[5],
    department: DEPARTMENTS[0],
    tags: ["asset-management", "coverage", "archived"],
    createdAt: "2026-06-30T05:00:00.000Z",
    updatedAt: "2026-07-05T09:00:00.000Z",
    publishedAt: "2026-06-30T06:00:00.000Z",
    securityScore: makeSecurityScore(79, 1),
    riskScore: makeRiskScore(41, -2),
    executiveSummary: makeExecutiveSummary({ score: 79, critical: 5 }),
    threatSummary,
    incidentSummary,
    assetSummary,
    complianceSummary,
    mitreCoverage,
    cveStatistics: [],
    iocStatistics: [],
    recommendations: [],
    insights: insights.filter((i) => i.id === "ins-005"),
    charts: charts.filter((c) => c.id === "chart-003"),
    widgets: widgets.filter((w) => w.dataSource === "security-score"),
    tables: [],
    attachments: [],
    comments: [],
    branding: BRANDING,
    schedule: null,
    shares: [],
    permissions,
    history: makeHistory("rpt-asset-inventory-jul2026"),
    kpis: kpis.filter((k) => k.label.includes("Asset")),
    builderLayout: null,
  },
];

export const mockDashboardSummary: DashboardSummary = {
  totalReports: mockReports.length,
  publishedReports: mockReports.filter((r) => r.status === ReportStatus.PUBLISHED)
    .length,
  draftReports: mockReports.filter((r) => r.status === ReportStatus.DRAFT).length,
  scheduledReports: mockReports.filter((r) => r.schedule?.enabled).length,
  criticalFindings: 4,
  securityScore,
  riskScore,
  complianceScore: complianceSummary.overallScore,
  lastUpdated: "2026-08-01T07:32:00.000Z",
};

export const mockExecutiveKPIs: readonly ReportKPI[] = kpis;
export const mockSecurityScore: SecurityScore = securityScore;
export const mockRiskScore: RiskScore = riskScore;
export const mockComplianceScore = complianceSummary;
export const mockThreatAnalytics: ThreatSummary = threatSummary;
export const mockIncidentAnalytics: IncidentSummary = incidentSummary;
export const mockAssetAnalytics: AssetSummary = assetSummary;
export const mockRiskAnalytics: RiskScore = riskScore;
export const mockComplianceAnalytics: ComplianceSummary = complianceSummary;
export const mockMitreCoverage: MitreCoverage = mitreCoverage;
export const mockTopCVEs: readonly CVEStatistic[] = cveStatistics;
export const mockIOCAnalytics: readonly IOCStatistic[] = iocStatistics;
export const mockWidgets: readonly ReportWidget[] = widgets;
export const mockAttachments: readonly ReportAttachment[] = attachments;
export const mockComments: readonly ReportComment[] = comments;
export const mockShares: readonly ReportShare[] = shares;
export const mockPermissions: readonly ReportPermission[] = permissions;