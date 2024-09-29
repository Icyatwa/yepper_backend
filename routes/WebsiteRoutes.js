// WebsiteRoutes.js
const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/WebsiteController');

router.post('/', websiteController.createWebsite);
router.get('/:ownerId', websiteController.getWebsitesByOwner);

module.exports = router;