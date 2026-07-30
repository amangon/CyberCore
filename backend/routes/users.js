const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const User = require('../models/User');

// Protect all routes
router.use(protect);

// User management routes
router.get('/', advancedResults(User), userController.getUsers);
router.get('/:id', userController.getUser);
router.post('/', authorize('admin'), userController.createUser);
router.put('/:id', authorize('admin'), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);
router.put('/:id/toggle-status', authorize('admin'), userController.toggleUserStatus);
router.get('/organization/:orgId', userController.getUsersByOrganization);
router.get('/team/:teamId', userController.getUsersByTeam);

module.exports = router;
