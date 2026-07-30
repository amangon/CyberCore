const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Alert = require('../models/Alert');

// Protect all routes
router.use(protect);

// Alert management routes
router.get('/', advancedResults(Alert), alertController.getAlerts);
router.get('/:id', alertController.getAlert);
router.post('/', alertController.createAlert);
router.put('/:id', alertController.updateAlert);
router.delete('/:id', alertController.deleteAlert);
router.patch('/:id/acknowledge', alertController.acknowledgeAlert);
router.patch('/:id/resolve', alertController.resolveAlert);
router.patch('/:id/false-positive', alertController.falsePositiveAlert);
router.patch('/:id/suppress', alertController.suppressAlert);
router.get('/organization/:orgId', alertController.getAlertsByOrganization);
router.get('/user/:userId', alertController.getAlertsByUser);
router.get('/team/:teamId', alertController.getAlertsByTeam);
router.get('/stats/:orgId?', alertController.getAlertStats);

module.exports = router;