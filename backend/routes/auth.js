const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);

// Protected routes
router.get('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/update-details', protect, authController.updateDetails);
router.put('/update-password', protect, authController.updatePassword);

module.exports = router;
