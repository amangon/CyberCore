# SentinelX AI Backend - Complete Documentation

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Tech Stack](#3-tech-stack)
4. [Request Flow](#4-request-flow)
5. [API Documentation](#5-api-documentation)
6. [Authentication Flow](#6-authentication-flow)
7. [Database Models](#7-database-models)
8. [Middleware](#8-middleware)
9. [Services](#9-services)
10. [Environment Variables](#10-environment-variables)
11. [External Integrations](#11-external-integrations)
12. [File Upload Flow](#12-file-upload-flow)
13. [Error Handling](#13-error-handling)
14. [Response Format](#14-response-format)
15. [Architecture Diagram](#15-architecture-diagram)
16. [Folder Dependency Diagram](#16-folder-dependency-diagram)
17. [Frontend Integration Guide](#17-frontend-integration-guide)
18. [Project Workflow](#18-project-workflow)
19. [Best Practices Used](#19-best-practices-used)
20. [Missing Features & Improvements](#20-missing-features--improvements)

---

## 1. Project Overview

### What This Backend Does

**SentinelX AI** is an **enterprise-grade, AI-powered Security Operations Center (SOC) platform** backend. It provides a comprehensive API for managing cybersecurity operations including threat detection, incident response, asset management, vulnerability scanning, and threat intelligence aggregation.

### Main Purpose

To serve as the backend infrastructure for a modern SOC platform that:
- Aggregates security alerts from multiple sources
- Manages security incidents through their lifecycle
- Tracks organizational assets and their vulnerabilities
- Integrates with 13+ external threat intelligence APIs
- Provides AI-powered analysis and recommendations
- Supports real-time collaboration via WebSockets
- Enables multi-tenant organization management

### Features Implemented

- **Authentication & Authorization**: JWT-based auth with refresh tokens, role-based access control (admin, analyst, viewer, operator), account lockout after failed attempts
- **User Management**: CRUD operations, team assignment, status toggle, preferences
- **Organization Management**: Multi-tenant support, subscription plans
- **Team Management**: Create teams, assign leads, manage members
- **Asset Management**: Full asset lifecycle with hardware, software, network interfaces, compliance tracking
- **Alert Management**: 30+ alert types, severity/priority levels, status workflow, IOC tracking, MITRE ATT&CK mapping, AI analysis
- **Incident Management**: Complete incident lifecycle (investigation → containment → eradication → recovery → lessons learned), artifact management with chain of custody, financial impact tracking, data breach notification
- **Case Management**: Link multiple incidents, evidence management with chain of custody, investigator assignment
- **Threat Intelligence**: Global IOCs, vulnerability database (CVE), YARA rules, threat actor tracking
- **Scan Engine**: IP, URL, Domain, Hash, and File scanning against 13+ threat intelligence services
- **AI Analysis**: Mock AI service for threat analysis, report generation, risk scoring, chat/Q&A
- **Real-time Notifications**: Socket.io events for alerts, incidents, case updates
- **Dashboard Analytics**: Overview stats, attack timeline, risk score trends, compliance status
- **API Documentation**: Swagger/OpenAPI 3.0 at `/api-docs`

---

## 2. Folder Structure

```
backend/
├── server.js                    # Entry point - Express app setup, middleware, routes
├── package.json                 # Dependencies and scripts
├── Dockerfile                   # Docker container configuration
├── docker-compose.yml           # Docker Compose (app + MongoDB + Redis)
├── TODO.md                      # Audit and fix progress tracker
│
├── config/
│   ├── db.js                    # MongoDB connection using Mongoose
│   └── swagger.js               # Swagger/OpenAPI configuration
│
├── models/                      # Mongoose schemas (13 files)
│   ├── User.js                  # User accounts, roles, auth methods
│   ├── Organization.js          # Multi-tenant organizations
│   ├── Team.js                  # Teams within organizations
│   ├── Asset.js                 # Hardware/software assets
│   ├── Alert.js                 # Security alerts with IOC tracking
│   ├── Incident.js              # Security incidents with full lifecycle
│   ├── Case.js                  # Investigation cases linking incidents
│   ├── IOC.js                   # Indicators of Compromise (global)
│   ├── Vulnerability.js         # CVE vulnerability database
│   ├── ThreatIntelligence.js    # Threat actors, campaigns, malware
│   ├── YaraRule.js              # YARA detection rules
│   ├── APIKey.js                # API keys for programmatic access
│   └── RefreshToken.js          # Refresh token management
│
├── controllers/                 # Business logic (12 files)
│   ├── authController.js        # Register, login, logout, tokens, password reset
│   ├── userController.js        # User CRUD, status toggle
│   ├── organizationController.js # Organization CRUD, stats
│   ├── teamController.js        # Team CRUD, member management
│   ├── assetController.js       # Asset CRUD, scan, agent management, stats
│   ├── alertController.js       # Alert CRUD, acknowledge/resolve, stats
│   ├── incidentController.js    # Incident CRUD, actions, artifacts, stats
│   ├── caseController.js        # Case CRUD, evidence, investigator management
│   ├── threatController.js      # Threat intel, IOC, Vulnerability, YARA CRUD
│   ├── scanController.js        # Scan orchestration against all external APIs
│   ├── aiController.js          # Mock AI analysis, reports, chat, risk scoring
│   └── dashboardController.js   # Overview, timeline, threat map, trends, compliance
│
├── routes/                      # Express route definitions (12 files)
│   ├── auth.js                  # Auth routes (register, login, logout, etc.)
│   ├── users.js                 # User management routes
│   ├── organizations.js         # Organization routes
│   ├── teams.js                 # Team routes
│   ├── assets.js                # Asset management routes
│   ├── alerts.js                # Alert management routes
│   ├── incidents.js             # Incident management routes
│   ├── cases.js                 # Case management routes
│   ├── threats.js               # Threat intel, IOC, Vulnerability, YARA routes
│   ├── scanRoutes.js            # Scan engine routes (IP, URL, Domain, Hash, File)
│   ├── dashboard.js             # Dashboard analytics routes
│   └── ai.js                    # AI analysis routes
│
├── middleware/                   # Express middleware (7 files)
│   ├── auth.js                  # JWT protection, role authorization
│   ├── async.js                 # Async error wrapper
│   ├── advancedResults.js       # Pagination, filtering, sorting, search
│   ├── errorHandler.js          # Global error handler
│   ├── notFound.js              # 404 handler
│   ├── rateLimiter.js           # In-memory rate limiting
│   ├── sanitize.js              # Request sanitization
│   └── validate.js              # Request validation factory
│
├── middlewares/                  # Additional middleware (2 files)
│   ├── apiErrorHandler.js       # Scan-specific error handler
│   └── notFound.js              # Duplicate 404 handler
│
├── services/                    # External API integrations (13 files)
│   ├── virusTotalService.js     # VirusTotal v3 API
│   ├── abuseIpService.js        # AbuseIPDB API
│   ├── googleSafeBrowsingService.js # Google Safe Browsing API
│   ├── shodanService.js         # Shodan API
│   ├── urlscanService.js        # URLScan.io API
│   ├── otxService.js            # AlienVault OTX API
│   ├── greyNoiseService.js      # GreyNoise API
│   ├── ipinfoService.js         # IPinfo API
│   ├── nvdService.js            # NVD (National Vulnerability Database) API
│   ├── abusechService.js        # Abuse.ch (ThreatFox + MalwareBazaar)
│   ├── pulsediveService.js      # Pulsedive API
│   ├── criminalIpService.js     # Criminal IP API
│   └── cloudinaryService.js     # Cloudinary file upload
│
├── sockets/                     # WebSocket configuration
│   └── index.js                 # Socket.io initialization with JWT auth
│
├── utils/                       # Utility modules
│   ├── errorResponse.js         # Custom error class
│   ├── logger.js                # Winston logger with daily rotation
│   ├── sendEmail.js             # Nodemailer email sender (Gmail OAuth2/SMTP)
│   ├── socketEvents.js          # Socket event emitters (user, org, alerts, incidents)
│   └── validators/              # Joi/validation schemas (empty directories)
│       ├── auth/
│       ├── users/
│       ├── assets/
│       ├── alerts/
│       ├── incidents/
│       ├── cases/
│       └── threats/
│
├── scripts/
│   └── seed.js                  # Database seeding script
│
└── logs/                        # Application logs (auto-generated by Winston)
    ├── application-YYYY-MM-DD.log
    └── .*-audit.json
```

### Connections Between Folders

```
Routes → Middleware (auth, validation, sanitization, rate limiting) → Controllers → Services → External APIs
                                                                          ↓
                                                                     Models (Mongoose)
                                                                          ↓
                                                                      MongoDB
                                                                          
Controllers → Utils (ErrorResponse, Logger, SocketEvents)
Services → Utils (Logger)
Sockets → Utils (SocketEvents)
```

---

## 3. Tech Stack

### Frameworks & Runtime
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | >= 16.0 | JavaScript runtime |
| Express.js | 4.18.x | Web framework |
| MongoDB | 5.x | Database |
| Redis | 7.x | Caching (via Docker) |

### Core Libraries
| Library | Purpose |
|---------|---------|
| mongoose | MongoDB ODM with schema validation |
| jsonwebtoken | JWT generation and verification |
| bcryptjs | Password hashing |
| socket.io | Real-time WebSocket communication |
| axios | HTTP client for external
