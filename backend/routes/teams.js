const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Team = require('../models/Team');

// Protect all routes
router.use(protect);

// Team management routes
router.get('/', advancedResults(Team), teamController.getTeams);
router.get('/:id', teamController.getTeam);
router.post('/', authorize('admin'), teamController.createTeam);
router.put('/:id', authorize('admin'), teamController.updateTeam);
router.delete('/:id', authorize('admin'), teamController.deleteTeam);
router.post('/:id/members', authorize('admin'), teamController.addTeamMember);
router.delete('/:id/members', authorize('admin'), teamController.removeTeamMember);
router.get('/:id/members', teamController.getTeamMembers);
router.get('/organization/:orgId', teamController.getTeamsByOrganization);
router.get('/user/:userId', teamController.getTeamsByUser);

module.exports = router;