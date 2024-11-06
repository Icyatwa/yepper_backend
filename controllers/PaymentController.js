// // // Paymentcontroller.js
// // const Flutterwave = require('flutterwave-node-v3');
// // const axios = require('axios');

// // // Initialize Flutterwave
// // const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// // exports.initiatePayment = async (req, res) => {
// //   try {
// //     const { amount, currency, email, phoneNumber } = req.body;

// //     if (!amount || !currency || !phoneNumber) {
// //       return res.status(400).json({ message: 'Missing required fields' });
// //     }

// //     // Split logic: 15% to the first phone number, 85% to the second
// //     const firstPhoneNumber = '+250795990884';
// //     const secondPhoneNumber = '+250791376235';

// //     const firstAmount = (amount * 0.15).toFixed(2);  // 15% to first number
// //     const secondAmount = (amount * 0.85).toFixed(2); // 85% to second number

// //     const tx_ref = 'TESTPAY-' + Date.now();
    
// //     const paymentPayloadFirst = {
// //       tx_ref: tx_ref + '-1', // Add a suffix to differentiate each transaction
// //       amount: firstAmount,
// //       currency: currency,
// //       redirect_url: 'http://localhost:5000/api/payment/callback',
// //       customer: {
// //         email: email || 'no-email@example.com',
// //         phonenumber: firstPhoneNumber,
// //       },
// //       payment_options: 'card,banktransfer',
// //       customizations: {
// //         title: 'Payment to First Recipient',
// //         description: '15% of the total payment',
// //       },
// //     };

// //     const paymentPayloadSecond = {
// //       tx_ref: tx_ref + '-2',
// //       amount: secondAmount,
// //       currency: currency,
// //       redirect_url: 'http://localhost:5000/api/payment/callback',
// //       customer: {
// //         email: email || 'no-email@example.com',
// //         phonenumber: secondPhoneNumber,
// //       },
// //       payment_options: 'card,banktransfer',
// //       customizations: {
// //         title: 'Payment to Second Recipient',
// //         description: '85% of the total payment',
// //       },
// //     };

// //     // Initiate first payment
// //     const responseFirst = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayloadFirst, {
// //       headers: {
// //         Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
// //         'Content-Type': 'application/json',
// //       },
// //     });

// //     // Initiate second payment
// //     const responseSecond = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayloadSecond, {
// //       headers: {
// //         Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
// //         'Content-Type': 'application/json',
// //       },
// //     });

// //     if (responseFirst.data && responseFirst.data.data.link && responseSecond.data && responseSecond.data.data.link) {
// //       res.status(200).json({
// //         paymentLinks: {
// //           firstPaymentLink: responseFirst.data.data.link,
// //           secondPaymentLink: responseSecond.data.data.link,
// //         }
// //       });
// //     } else {
// //       console.error('Payment initiation failed:', responseFirst.data, responseSecond.data);
// //       res.status(500).json({ message: 'Payment initiation failed', error: responseFirst.data, secondError: responseSecond.data });
// //     }

// //   } catch (error) {
// //     console.error('Error during payment initiation:', error);
// //     res.status(500).json({ message: 'Error during payment initiation' });
// //   }
// // };

// // exports.initiateCardPayment = async (req, res) => {
// //   try {
// //     const { amount, currency, email, phoneNumber } = req.body;

// //     if (!amount || !currency || !phoneNumber) {
// //       return res.status(400).json({ message: 'Missing required fields' });
// //     }

// //     const tx_ref = 'CARDPAY-' + Date.now();
// //     const paymentPayload = {
// //       tx_ref: tx_ref,
// //       amount: amount,
// //       currency: currency,
// //       redirect_url: 'http://localhost:5000/api/payment/callback',
// //       customer: {
// //         email: email || 'no-email@example.com',
// //         phonenumber: phoneNumber,
// //       },
// //       payment_options: 'card',
// //       customizations: {
// //         title: 'Card Payment',
// //         description: 'Pay with your bank card',
// //       },
// //     };

// //     const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayload, {
// //       headers: {
// //         Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
// //         'Content-Type': 'application/json',
// //       },
// //     });

// //     if (response.data && response.data.data && response.data.data.link) {
// //       res.status(200).json({ paymentLink: response.data.data.link });
// //     } else {
// //       res.status(500).json({ message: 'Payment initiation failed', error: response.data });
// //     }
// //   } catch (error) {
// //     res.status(500).json({ message: 'Error during payment initiation' });
// //   }
// // };

// // exports.paymentCallback = async (req, res) => {
// //   try {
// //     const { tx_ref, transaction_id } = req.query;

// //     // Verify the transaction status from Flutterwave
// //     const transactionVerification = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
// //       headers: {
// //         Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
// //       }
// //     });

// //     const { status } = transactionVerification.data.data;

// //     if (status === 'successful') {
// //       console.log(`Payment for ${tx_ref} was successful`);
// //       return res.redirect('http://localhost:3000/success');
// //     } else {
// //       console.error('Payment failed or incomplete:', status);
// //       return res.redirect('http://localhost:3000/failed');
// //     }
// //   } catch (error) {
// //     console.error('Error processing payment callback:', error);
// //     res.status(500).json({ message: 'Error processing payment callback' });
// //   }
// // };


// // controllers/PaymentController.js
// const Payment = require('../models/PaymentModel');
// const ImportAd = require('../models/ImportAdModel');
// const Flutterwave = require('flutterwave-node-v3');
// const axios = require('axios');

// const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// exports.initiatePayment = async (req, res) => {
//   try {
//     const { amount, currency, email, userId, adId } = req.body;
//     const tx_ref = 'ADPAY-' + Date.now();

//     const payment = new Payment({
//       tx_ref,
//       amount,
//       currency,
//       email,
//       userId,
//       adId,
//       status: 'pending'
//     });
//     await payment.save();

//     const paymentPayload = {
//       tx_ref,
//       amount,
//       currency,
//       redirect_url: 'http://localhost:5000/api/payment/callback',
//       customer: {
//         email: email || 'no-email@example.com',
//       },
//       customizations: {
//         title: 'Ad Payment',
//         description: 'Pay for Ad Confirmation',
//       },
//     };

//     const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayload, {
//       headers: {
//         Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (response.data && response.data.data && response.data.data.link) {
//       res.status(200).json({ paymentLink: response.data.data.link });
//     } else {
//       res.status(500).json({ message: 'Payment initiation failed', error: response.data });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Error initiating payment', error });
//   }
// };

// exports.paymentCallback = async (req, res) => {
//   try {
//     const { tx_ref, transaction_id } = req.query;

//     const transactionVerification = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
//       headers: {
//         Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
//       }
//     });

//     const { status } = transactionVerification.data.data;

//     if (status === 'successful') {
//       const payment = await Payment.findOneAndUpdate(
//         { tx_ref },
//         { status: 'successful' },
//         { new: true }
//       );

//       if (payment) {
//         await ImportAd.findByIdAndUpdate(payment.adId, { confirmed: true });
//       }
//       return res.redirect('http://localhost:3000/ads/success');
//     } else {
//       await Payment.findOneAndUpdate({ tx_ref }, { status: 'failed' });
//       return res.redirect('http://localhost:3000/ads/failed');
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Error in payment callback', error });
//   }
// };
