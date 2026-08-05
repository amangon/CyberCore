const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { protect } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Alert = require('../models/Alert');

// Protect all routes
router.use(protect);

// Static sub-paths MUST come before /:id
router.get('/stats', alertController.getAlertStats);
router.get('/organization/:orgId', alertController.getAlertsByOrganization);
router.get('/user/:userId', alertController.getAlertsByUser);
router.get('/team/:teamId', alertController.getAlertsByTeam);

// Collection routes
router.get('/', advancedResults(Alert), alertController.getAlerts);
router.post('/', alertController.createAlert);

// Dynamic /:id routes
router.get('/:id', alertController.getAlert);
router.put('/:id', alertController.updateAlert);
router.delete('/:id', alertController.deleteAlert);
router.patch('/:id/acknowledge', alertController.acknowledgeAlert);
router.patch('/:id/resolve', alertController.resolveAlert);
router.patch('/:id/false-positive', alertController.falsePositiveAlert);
router.patch('/:id/suppress', alertController.suppressAlert);

module.exports = router;
