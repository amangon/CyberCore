const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  archiveReport,
  getReportStats,
} = require('../controllers/reportController');

// Protect all routes
router.use(protect);

// ================= Report Routes =================
router.get('/stats', getReportStats);
router.get('/', getReports);
router.post('/', createReport);
router.get('/:id', getReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);
router.put('/:id/archive', archiveReport);

module.exports = router;
