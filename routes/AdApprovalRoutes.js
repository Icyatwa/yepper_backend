// AdApprovalRoutes.js
const express = require('express');
const router = express.Router();
const adApprovalController = require('../controllers/AdApprovalController');

router.get('/pending', adApprovalController.getPendingAds);
router.put('/approve/:adId', adApprovalController.approveAd);
router.put('/approve/:adId', adApprovalController.approveAd);
router.get('/approved-ads', adApprovalController.getApprovedAds);

module.exports = router;