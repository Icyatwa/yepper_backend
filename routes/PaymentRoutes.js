const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');

router.post('/initiate', paymentController.initiatePayment);
router.get('/callback', paymentController.paymentCallback);

module.exports = router;
