// WebsiteRoutes.js
const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/WebsiteController');
const Website = require('../models/WebsiteModel');

router.post('/', websiteController.createWebsite);
router.get('/', websiteController.getAllWebsites);
router.get('/:ownerId', websiteController.getWebsitesByOwner);
router.get('/website/:websiteId', websiteController.getWebsiteById);

module.exports = router; 