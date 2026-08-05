const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  scan,
  scanFile,
  scanUrl,
  scanIP,
  scanDomain,
  scanHash,
  getScan,
  getScanHistory,
  getScanReport
} = require('../controllers/scanController');
const { protect } = require('../middleware/auth');
const apiErrorHandler = require('../middlewares/apiErrorHandler');

// Configure multer for file uploads (max 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for malware analysis
    cb(null, true);
  }
});

// Protect all scan routes
router.use(protect);

// File upload middleware helper
const handleFileUpload = (req, res, next) => {
  if (req.file) {
    req.body.file = {
      name: req.file.originalname,
      buffer: req.file.buffer,
      size: req.file.size,
      mimetype: req.file.mimetype
    };
  }
  next();
};

/**
 * @swagger
 * /api/scan:
 *   post:
 *     summary: Scan an indicator (auto-detect type)
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ip, url, domain, hash]
 *               file:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ip, url, domain, hash]
 *     responses:
 *       200:
 *         description: Scan results
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/', upload.single('file'), handleFileUpload, scan);

/**
 * @swagger
 * /api/scan/analyze:
 *   post:
 *     summary: Alias for POST /api/scan — scan any indicator type
 *     description: Same as POST /api/scan. Accepts { value, type } in body.
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value, type]
 *             properties:
 *               value:
 *                 type: string
 *                 description: The indicator to scan (IP, URL, domain, or hash)
 *               type:
 *                 type: string
 *                 enum: [ip, url, domain, hash]
 *     responses:
 *       200:
 *         description: Scan results
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/analyze', upload.single('file'), handleFileUpload, scan);

/**
 * @swagger
 * /api/scan/file:
 *   post:
 *     summary: Scan a file for malware
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to scan for malware
 *     responses:
 *       200:
 *         description: File scan results
 *       400:
 *         description: No file provided
 *       401:
 *         description: Not authorized
 */
router.post('/file', upload.single('file'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please provide a file to scan' });
  }
  req.body.file = {
    name: req.file.originalname,
    buffer: req.file.buffer,
    size: req.file.size,
    mimetype: req.file.mimetype
  };
  req.body.type = 'file';
  next();
}, scan);

/**
 * @swagger
 * /api/scan/url:
 *   post:
 *     summary: Scan a URL for threats
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL to scan
 *     responses:
 *       200:
 *         description: URL scan results
 *       400:
 *         description: No URL provided
 *       401:
 *         description: Not authorized
 */
router.post('/url', (req, res, next) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'Please provide a URL to scan' });
  }
  req.body.value = url;
  req.body.type = 'url';
  next();
}, scan);

/**
 * @swagger
 * /api/scan/ip:
 *   post:
 *     summary: Scan an IP address for threats
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ip:
 *                 type: string
 *                 description: IP address to scan
 *     responses:
 *       200:
 *         description: IP scan results
 *       400:
 *         description: No IP provided
 *       401:
 *         description: Not authorized
 */
router.post('/ip', (req, res, next) => {
  const { ip } = req.body;
  if (!ip) {
    return res.status(400).json({ success: false, error: 'Please provide an IP address to scan' });
  }
  req.body.value = ip;
  req.body.type = 'ip';
  next();
}, scan);

/**
 * @swagger
 * /api/scan/domain:
 *   post:
 *     summary: Scan a domain for threats
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               domain:
 *                 type: string
 *                 description: Domain to scan
 *     responses:
 *       200:
 *         description: Domain scan results
 *       400:
 *         description: No domain provided
 *       401:
 *         description: Not authorized
 */
router.post('/domain', (req, res, next) => {
  const { domain } = req.body;
  if (!domain) {
    return res.status(400).json({ success: false, error: 'Please provide a domain to scan' });
  }
  req.body.value = domain;
  req.body.type = 'domain';
  next();
}, scan);

/**
 * @swagger
 * /api/scan/hash:
 *   post:
 *     summary: Scan a file hash for threats
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hash:
 *                 type: string
 *                 description: File hash (MD5/SHA1/SHA256) to scan
 *     responses:
 *       200:
 *         description: Hash scan results
 *       400:
 *         description: No hash provided
 *       401:
 *         description: Not authorized
 */
router.post('/hash', (req, res, next) => {
  const { hash } = req.body;
  if (!hash) {
    return res.status(400).json({ success: false, error: 'Please provide a hash to scan' });
  }
  req.body.value = hash;
  req.body.type = 'hash';
  next();
}, scan);

/**
 * @swagger
 * /api/scan/history:
 *   get:
 *     summary: Get scan history (persisted to MongoDB)
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Scan history list
 */
router.get('/history', getScanHistory);

/**
 * @swagger
 * /api/scan/{id}:
 *   get:
 *     summary: Get scan details by ID
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scan details
 *       404:
 *         description: Scan not found
 */
router.get('/:id', getScan);

// Apply API error handler
router.use(apiErrorHandler);

module.exports = router;

