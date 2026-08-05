const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { protect } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Case = require('../models/Case');

// Protect all routes
router.use(protect);

// Static sub-paths MUST come before /:id
router.get('/stats', caseController.getCaseStats);
router.get('/organization/:orgId', caseController.getCasesByOrganization);
router.get('/user/:userId', caseController.getCasesByUser);
router.get('/team/:teamId', caseController.getCasesByTeam);

// Collection routes
router.get('/', advancedResults(Case), caseController.getCases);
router.post('/', caseController.createCase);

// Dynamic /:id routes
router.get('/:id', caseController.getCase);
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

module.exports = router;
