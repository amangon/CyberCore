const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Incident = require('../models/Incident');

// Protect all routes
router.use(protect);

// Incident management routes
router.get('/', advancedResults(Incident), incidentController.getIncidents);
router.get('/:id', incidentController.getIncident);
router.post('/', incidentController.createIncident);
router.put('/:id', incidentController.updateIncident);
router.delete('/:id', incidentController.deleteIncident);
router.patch('/:id/status', incidentController.updateIncidentStatus);
router.post('/:id/assign', incidentController.assignIncident);
router.post('/:id/assign-team', incidentController.assignIncidentToTeam);
router.post('/:id/containment', incidentController.addContainmentAction);
router.post('/:id/eradication', incidentController.addEradicationAction);
router.post('/:id/recovery', incidentController.addRecoveryAction);
router.post('/:id/artifact', incidentController.addArtifact);
router.get('/organization/:orgId', incidentController.getIncidentsByOrganization);
router.get('/user/:userId', incidentController.getIncidentsByUser);
router.get('/team/:teamId', incidentController.getIncidentsByTeam);
router.get('/stats/:orgId?', incidentController.getIncidentStats);

module.exports = router;