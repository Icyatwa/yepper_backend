// ImportAdRoutes.js
const express = require('express');
const router = express.Router();
const ImportAdController = require('../controllers/ImportAdController');

router.post('/', ImportAdController.createImportAd);
router.get('/', ImportAdController.getAllAds);

module.exports = router;
