const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getApiKeys,
  generateApiKey,
  revokeApiKey,
  deleteApiKey,
  regenerateApiKey,
  getOrganizationSettings,
} = require('../controllers/settingsController');

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

// Protect all routes
router.use(protect);

// ================= Profile Routes =================
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/avatar', upload.single('avatar'), uploadAvatar);

// ================= API Key Routes =================
router.get('/api-keys', getApiKeys);
router.post('/api-keys', generateApiKey);
router.put('/api-keys/:id/revoke', revokeApiKey);
router.post('/api-keys/:id/regenerate', regenerateApiKey);
router.delete('/api-keys/:id', deleteApiKey);

// ================= Organization Routes =================
router.get('/organization', getOrganizationSettings);

module.exports = router;
