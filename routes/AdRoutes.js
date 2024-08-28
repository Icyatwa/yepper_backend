// AdRoutes.js
const express = require('express');
const router = express.Router();
const adEmbedController = require('../controllers/AdEmbedController');

router.get('/embed/:adId', adEmbedController.getAdEmbed); // New route for embed code

module.exports = router;
