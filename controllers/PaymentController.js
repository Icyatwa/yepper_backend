// Paymentcontroller.js
const Flutterwave = require('flutterwave-node-v3');
const axios = require('axios');

// Initialize Flutterwave
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

exports.initiatePayment = async (req, res) => {
  try {
    const { amount, currency, email, phoneNumber } = req.body;

    if (!amount || !currency || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const tx_ref = 'TESTPAY-' + Date.now();
    const paymentPayload = {
      tx_ref: tx_ref,
      amount: amount,
      currency: currency,
      redirect_url: 'https://yepper-backend.onrender.com/api/payment/callback',
      customer: {
        email: email || 'no-email@example.com',
        phonenumber: phoneNumber,
      },
      payment_options: 'card,banktransfer',
      customizations: {
        title: 'Payment Demo',
        description: 'Test payment using Flutterwave',
      },
    };

    // Call Flutterwave payment initiation
    const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayload, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.data && response.data.data.link) {
      res.status(200).json({ paymentLink: response.data.data.link });
    } else {
      console.error('Payment initiation failed:', response.data);
      res.status(500).json({ message: 'Payment initiation failed', error: response.data });
    }
  } catch (error) {
    console.error('Error during payment initiation:', error);
    res.status(500).json({ message: 'Error during payment initiation' });
  }
};

exports.paymentCallback = async (req, res) => {
  try {
    const { tx_ref, transaction_id } = req.query;

    // Verify the transaction status from Flutterwave
    const transactionVerification = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
      }
    });

    const { status } = transactionVerification.data.data;

    if (status === 'successful') {
      console.log(`Payment for ${tx_ref} was successful`);
      return res.redirect('http://localhost:3000/payment-success');
    } else {
      console.error('Payment failed or incomplete:', status);
      return res.redirect('http://localhost:3000/payment-failed');
    }
  } catch (error) {
    console.error('Error processing payment callback:', error);
    res.status(500).json({ message: 'Error processing payment callback' });
  }
};
