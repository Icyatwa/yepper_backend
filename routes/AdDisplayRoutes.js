// AdDisplayRoutes.js
const express = require('express');
const router = express.Router();
const adDisplayController = require('../controllers/AdDisplayController');

// Route to display ads based on space, website, and category
router.get('/display', adDisplayController.displayAd);

module.exports = router;
