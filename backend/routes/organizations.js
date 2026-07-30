const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Organization = require('../models/Organization');

// Protect all routes
router.use(protect);

// Organization management routes
router.get('/', advancedResults(Organization), organizationController.getOrganizations);
router.get('/:id', organizationController.getOrganization);
router.post('/', authorize('admin'), organizationController.createOrganization);
router.put('/:id', authorize('admin'), organizationController.updateOrganization);
router.delete('/:id', authorize('admin'), organizationController.deleteOrganization);
router.get('/:id/stats', organizationController.getOrganizationStats);
router.get('/:id/users', organizationController.getOrganizationUsers);
router.get('/:id/teams', organizationController.getOrganizationTeams);

module.exports = router;