const express = require('express');
const router = express.Router();
const threatController = require('../controllers/threatController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const ThreatIntelligence = require('../models/ThreatIntelligence');
const IOC = require('../models/IOC');
const Vulnerability = require('../models/Vulnerability');
const YaraRule = require('../models/YaraRule');

// Protect all routes
router.use(protect);

// Threat Intelligence routes
router.get('/intelligence', advancedResults(ThreatIntelligence), threatController.getThreatIntelligence);
router.get('/intelligence/:id', threatController.getThreatIntelligenceById);
router.post('/intelligence', threatController.createThreatIntelligence);
router.put('/intelligence/:id', threatController.updateThreatIntelligence);
router.delete('/intelligence/:id', threatController.deleteThreatIntelligence);
router.get('/intelligence/stats', threatController.getThreatIntelligenceStats);

// IOC routes
router.get('/iocs', advancedResults(IOC), threatController.getIOCs);
router.get('/iocs/:id', threatController.getIOCById);
router.post('/iocs', threatController.createIOC);
router.put('/iocs/:id', threatController.updateIOC);
router.delete('/iocs/:id', threatController.deleteIOC);
router.get('/iocs/stats', threatController.getIOCStats);

// Vulnerability routes
router.get('/vulnerabilities', advancedResults(Vulnerability), threatController.getVulnerabilities);
router.get('/vulnerabilities/:id', threatController.getVulnerabilityById);
router.post('/vulnerabilities', threatController.createVulnerability);
router.put('/vulnerabilities/:id', threatController.updateVulnerability);
router.delete('/vulnerabilities/:id', threatController.deleteVulnerability);
router.get('/vulnerabilities/severity/:severity', threatController.getVulnerabilitiesBySeverity);
router.get('/vulnerabilities/cve/:cveId', threatController.getVulnerabilityByCVE);
router.get('/vulnerabilities/stats', threatController.getVulnerabilityStats);

// YARA rules routes
router.get('/yara-rules', advancedResults(YaraRule), threatController.getYaraRules);
router.get('/yara-rules/:id', threatController.getYaraRuleById);
router.post('/yara-rules', threatController.createYaraRule);
router.put('/yara-rules/:id', threatController.updateYaraRule);
router.delete('/yara-rules/:id', threatController.deleteYaraRule);
router.get('/yara-rules/severity/:severity', threatController.getYaraRulesBySeverity);
router.get('/yara-rules/stats', threatController.getYaraRuleStats);

module.exports = router;