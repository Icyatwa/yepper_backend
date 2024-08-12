// routes/AdRoutes.js
const express = require('express');
const router = express.Router();
const adController = require('../controllers/AdController');

router.get('/random', adController.getRandomAd);
router.get('/track/click/:adId', adController.trackClick);

module.exports = router;