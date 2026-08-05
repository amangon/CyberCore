const express = require('express');
const router = express.Router();

const threatController = require('../controllers/threatController');
const { protect } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

const ThreatIntelligence = require('../models/ThreatIntelligence');
const IOC = require('../models/IOC');
const Vulnerability = require('../models/Vulnerability');
const YaraRule = require('../models/YaraRule');

// ======================================================
// PUBLIC ROUTES (No Login Required)
// ======================================================

// GET /api/threats?limit=100
// Returns the aggregated summary payload (feed, stats, malware, cves,
// trend, aptGroups, iocs) so the Threat Intelligence Center frontend
// renders real data without requiring login.
router.get('/', async (req, res) => {
  try {
    await threatController.getThreatIntelligenceSummary(req, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================================================
// PUBLIC READ-ONLY AGGREGATED SUMMARY
// GET /api/threats/summary
//
// Returns ONLY the aggregated dashboard data required by the
// Threat Intelligence Center frontend. No sensitive internal
// intelligence, API metadata, or administrative information is
// exposed. All values derive from persisted backend data.
// ======================================================
router.get('/summary', threatController.getThreatIntelligenceSummary);

// ======================================================
// ALL ROUTES BELOW REQUIRE LOGIN
// ======================================================
router.use(protect);

// ================= Threat Intelligence =================
// IMPORTANT: Static routes (/stats, /severity/:x) MUST come BEFORE /:id
// Otherwise Express matches "stats" as the :id parameter value.

router.get('/intelligence/stats', threatController.getThreatIntelligenceStats);

router.get(
  '/intelligence',
  advancedResults(ThreatIntelligence),
  threatController.getThreatIntelligence
);

router.post('/intelligence', threatController.createThreatIntelligence);

// Specific lookup by /:id comes AFTER all static sub-paths
router.get('/intelligence/:id', threatController.getThreatIntelligenceById);
router.put('/intelligence/:id', threatController.updateThreatIntelligence);
router.delete('/intelligence/:id', threatController.deleteThreatIntelligence);

// ================= IOC =================
// Static routes first
router.get('/iocs/stats', threatController.getIOCStats);

router.get('/iocs', advancedResults(IOC), threatController.getIOCs);
router.post('/iocs', threatController.createIOC);

// Dynamic /:id routes after statics
router.get('/iocs/:id', threatController.getIOCById);
router.put('/iocs/:id', threatController.updateIOC);
router.delete('/iocs/:id', threatController.deleteIOC);

// ================= Vulnerabilities =================
// Static routes first
router.get('/vulnerabilities/stats', threatController.getVulnerabilityStats);
router.get('/vulnerabilities/severity/:severity', threatController.getVulnerabilitiesBySeverity);
router.get('/vulnerabilities/cve/:cveId', threatController.getVulnerabilityByCVE);

router.get('/vulnerabilities', advancedResults(Vulnerability), threatController.getVulnerabilities);
router.post('/vulnerabilities', threatController.createVulnerability);

// Dynamic /:id routes after statics
router.get('/vulnerabilities/:id', threatController.getVulnerabilityById);
router.put('/vulnerabilities/:id', threatController.updateVulnerability);
router.delete('/vulnerabilities/:id', threatController.deleteVulnerability);

// ================= YARA Rules =================
// Static routes first
router.get('/yara-rules/stats', threatController.getYaraRuleStats);
router.get('/yara-rules/severity/:severity', threatController.getYaraRulesBySeverity);

router.get('/yara-rules', advancedResults(YaraRule), threatController.getYaraRules);
router.post('/yara-rules', threatController.createYaraRule);

// Dynamic /:id routes after statics
router.get('/yara-rules/:id', threatController.getYaraRuleById);
router.put('/yara-rules/:id', threatController.updateYaraRule);
router.delete('/yara-rules/:id', threatController.deleteYaraRule);

module.exports = router;
