const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Asset = require('../models/Asset');

// Protect all routes
router.use(protect);

// Asset management routes
router.get('/', advancedResults(Asset), assetController.getAssets);
router.get('/:id', assetController.getAsset);
router.post('/', assetController.createAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);
router.patch('/:id/status', assetController.updateAssetStatus);
router.patch('/:id/risk-level', assetController.updateAssetRiskLevel);
router.patch('/:id/criticality', assetController.updateAssetCriticality);
router.post('/:id/scan', assetController.scanAsset);
router.post('/:id/agent/install', assetController.installAgent);
router.post('/:id/agent/uninstall', assetController.uninstallAgent);
router.post('/:id/agent/checkin', assetController.updateAgentCheckin);
router.get('/organization/:orgId', assetController.getAssetsByOrganization);
router.get('/user/:userId', assetController.getAssetsByUser);
router.get('/team/:teamId', assetController.getAssetsByTeam);
router.get('/stats/:orgId?', assetController.getAssetStats);

module.exports = router;