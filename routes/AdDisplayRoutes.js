// AdDisplayRoutes.js
const express = require('express');
const router = express.Router();
const adDisplayController = require('../controllers/AdDisplayController');

router.get('/display', adDisplayController.displayAd);

module.exports = router;
