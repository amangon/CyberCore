const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const User = require('../models/User');

// Protect all routes
router.use(protect);

// Static sub-paths MUST come before /:id to avoid Express matching them as an id
router.get('/organization/:orgId', userController.getUsersByOrganization);
router.get('/team/:teamId', userController.getUsersByTeam);

// Collection routes
router.get('/', advancedResults(User), userController.getUsers);
router.post('/', authorize('admin'), userController.createUser);

// Dynamic /:id routes
router.get('/:id', userController.getUser);
router.put('/:id', authorize('admin'), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);
router.put('/:id/toggle-status', authorize('admin'), userController.toggleUserStatus);

module.exports = router;
