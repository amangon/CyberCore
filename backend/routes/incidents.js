const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { protect } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Incident = require('../models/Incident');

// Protect all routes
router.use(protect);

// Static sub-paths MUST come before /:id
router.get('/stats', incidentController.getIncidentStats);
router.get('/organization/:orgId', incidentController.getIncidentsByOrganization);
router.get('/user/:userId', incidentController.getIncidentsByUser);
router.get('/team/:teamId', incidentController.getIncidentsByTeam);

// Collection routes
router.get('/', advancedResults(Incident), incidentController.getIncidents);
router.post('/', incidentController.createIncident);

// Dynamic /:id routes
router.get('/:id', incidentController.getIncident);
router.put('/:id', incidentController.updateIncident);
router.delete('/:id', incidentController.deleteIncident);
router.patch('/:id/status', incidentController.updateIncidentStatus);
router.post('/:id/assign', incidentController.assignIncident);
router.post('/:id/assign-team', incidentController.assignIncidentToTeam);
router.post('/:id/containment', incidentController.addContainmentAction);
router.post('/:id/eradication', incidentController.addEradicationAction);
router.post('/:id/recovery', incidentController.addRecoveryAction);
router.post('/:id/artifact', incidentController.addArtifact);

module.exports = router;
