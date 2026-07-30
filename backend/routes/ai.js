const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// AI routes
router.post('/analyze', aiController.analyze);
router.post('/report', aiController.generateReport);
router.post('/chat', aiController.chat);
router.post('/recommend', aiController.recommend);
router.post('/risk-score', aiController.riskScore);
router.post('/analyze/incident/:id', aiController.analyzeIncident);
router.post('/analyze/alert/:id', aiController.analyzeAlert);
router.post('/report/incident/:id', aiController.generateIncidentReport);

module.exports = router;