const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// Protect all dashboard routes
router.use(protect);

// Root handler — GET /api/dashboard returns overview (frontend calls this)
router.get('/', dashboardController.getDashboardOverview);

// Named sub-routes
router.get('/overview', dashboardController.getDashboardOverview);

// Support both naming conventions the frontend may use
router.get('/attack-timeline', dashboardController.getAttackTimeline);
router.get('/timeline', dashboardController.getAttackTimeline);

router.get('/threat-map', dashboardController.getThreatMap);

router.get('/risk-score-trend', dashboardController.getRiskScoreTrend);
router.get('/risk-trends', dashboardController.getRiskScoreTrend);

router.get('/compliance-status', dashboardController.getComplianceStatus);
router.get('/compliance', dashboardController.getComplianceStatus);

module.exports = router;
