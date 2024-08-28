// ImportAdRoutes.js
const express = require('express');
const router = express.Router();
const importAdController = require('../controllers/ImportAdController');

router.post('/', importAdController.createImportAd);
router.get('/', importAdController.getAllAds);
router.get('/ads/:userId', importAdController.getAdsByUserId);
router.get('/ads/:userId/with-clicks', importAdController.getAdsByUserIdWithClicks);

module.exports = router;

