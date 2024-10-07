// AdApprovalRoutes.js
const express = require('express');
const router = express.Router();
const adApprovalController = require('../controllers/AdApprovalController');

router.get('/pending', adApprovalController.getPendingAds);
router.put('/approve/:adId', adApprovalController.approveAd);

module.exports = router;