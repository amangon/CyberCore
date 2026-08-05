const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Configure multer for avatar uploads (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);

// Protected routes
// Support both GET and POST for logout (frontend may call either)
router.get('/logout', protect, authController.logout);
router.post('/logout', protect, authController.logout);

// Support both /me and /profile (frontend may call either)
router.get('/me', protect, authController.getMe);
router.get('/profile', protect, authController.getMe);

router.put('/update-details', protect, authController.updateDetails);
router.put('/update-password', protect, authController.updatePassword);

// Avatar upload route
router.put('/avatar', protect, upload.single('avatar'), authController.updateAvatar);

module.exports = router;
