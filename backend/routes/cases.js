const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Case = require('../models/Case');

// Protect all routes
router.use(protect);

// Case management routes
router.get('/', advancedResults(Case), caseController.getCases);
router.get('/:id', caseController.getCase);
router.post('/', caseController.createCase);
router.put('/:id', caseController.updateCase);
router.delete('/:id', caseController.deleteCase);
router.patch('/:id/status', caseController.updateCaseStatus);
router.post('/:id/lead-investigator', caseController.assignLeadInvestigator);
router.post('/:id/investigators', caseController.addInvestigator);
router.delete('/:id/investigators', caseController.removeInvestigator);
router.post('/:id/incidents', caseController.addIncidentToCase);
router.delete('/:id/incidents', caseController.removeIncidentFromCase);
router.post('/:id/evidence', caseController.addEvidence);
router.delete('/:id/evidence', caseController.removeEvidence);
router.get('/organization/:orgId', caseController.getCasesByOrganization);
router.get('/user/:userId', caseController.getCasesByUser);
router.get('/team/:teamId', caseController.getCasesByTeam);
router.get('/stats/:orgId?', caseController.getCaseStats);

module.exports = router;