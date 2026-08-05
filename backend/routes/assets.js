const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Asset = require('../models/Asset');

// Protect all routes
router.use(protect);

// Static sub-paths MUST come before /:id
router.get('/stats', assetController.getAssetStats);
router.get('/organization/:orgId', assetController.getAssetsByOrganization);
router.get('/user/:userId', assetController.getAssetsByUser);
router.get('/team/:teamId', assetController.getAssetsByTeam);

// Collection routes
router.get('/', advancedResults(Asset), assetController.getAssets);
router.post('/', assetController.createAsset);

// Dynamic /:id routes
router.get('/:id', assetController.getAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);
router.patch('/:id/status', assetController.updateAssetStatus);
router.patch('/:id/risk-level', assetController.updateAssetRiskLevel);
router.patch('/:id/criticality', assetController.updateAssetCriticality);
router.post('/:id/scan', assetController.scanAsset);
router.post('/:id/agent/install', assetController.installAgent);
router.post('/:id/agent/uninstall', assetController.uninstallAgent);
router.post('/:id/agent/checkin', assetController.updateAgentCheckin);

module.exports = router;
