const express = require('express');
const router = express.Router();
const adApprovalController = require('../controllers/AdApprovalController');

router.get('/pending/:ownerId', adApprovalController.getPendingAds);
router.put('/approve/:adId', adApprovalController.approveAd);
router.get('/approved-ads', adApprovalController.getApprovedAds);
router.get('/approved/:ownerId', adApprovalController.getApprovedAdsByUser);


module.exports = router;
