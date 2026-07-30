const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Dashboard routes
router.get('/overview', dashboardController.getDashboardOverview);
router.get('/attack-timeline', dashboardController.getAttackTimeline);
router.get('/threat-map', dashboardController.getThreatMap);
router.get('/risk-score-trend', dashboardController.getRiskScoreTrend);
router.get('/compliance-status', dashboardController.getComplianceStatus);

module.exports = router;