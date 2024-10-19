const express = require('express');
const router = express.Router();
const adApprovalController = require('../controllers/AdApprovalController');

router.get('/pending/:ownerId', adApprovalController.getPendingAds);
router.put('/approve/:adId', adApprovalController.approveAd);
router.get('/approved/:userId', adApprovalController.getApprovedAdsByUser);  // Make sure the route matches
router.get('/approved-ads', adApprovalController.getApprovedAds);

module.exports = router;
