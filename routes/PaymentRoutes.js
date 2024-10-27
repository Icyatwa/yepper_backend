// // PaymentRoutes.js
// const express = require('express');
// const router = express.Router();
// const paymentController = require('../controllers/PaymentController');

// router.post('/initiate', paymentController.initiatePayment);
// router.post('/initiate-card-payment', paymentController.initiateCardPayment);
// router.get('/callback', paymentController.paymentCallback);

// module.exports = router;

const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');

router.post('/create', PaymentController.processPayment);
router.post('/confirm', PaymentController.confirmPayment);

module.exports = router;