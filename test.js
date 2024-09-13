const Flutterwave = require('flutterwave-node-v3');
const ImportAd = require('../models/ImportAdModel');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Initialize Flutterwave
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Initiate payment
exports.initiatePayment = async (req, res) => {
  try {
    const { userId, businessName, businessLocation, adDescription, templateType, categories, amount, currency, email, phoneNumber } = req.body;

    const tx_ref = 'LEDOST-' + Date.now(); // Generate a unique transaction reference

    // Prepare the payment payload
    const paymentPayload = {
      tx_ref: tx_ref,
      amount: amount,
      currency: currency,
      redirect_url: 'http://localhost:5000/api/importAds/callback', // Callback URL for payment status
      customer: {
        email: email || 'no-email@example.com',
        phonenumber: phoneNumber,
      },
      payment_options: 'card,banktransfer',
      customizations: {
        title: 'Ad Payment',
        description: 'Payment for your advertisement',
      },
    };

    // Call Flutterwave payment API
    const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayload, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.data && response.data.data.link) {
      // Store the payment reference in the session or database
      req.session.paymentRef = tx_ref;

      // Redirect the user to the payment page
      res.status(200).json({ paymentLink: response.data.data.link });

      // Verify the payment once the user completes it
      const verifyResponse = await axios.get(`https://api.flutterwave.com/v3/transactions/${tx_ref}/verify`, {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      });

      // Check if the payment was successful
      if (verifyResponse.data.status === 'success' && verifyResponse.data.data.status === 'successful') {
        // Save ad data to the database
        const newAd = new ImportAd({
          userId,
          businessName,
          businessLocation,
          adDescription,
          templateType,
          categories,
          paymentStatus: 'successful',
          paymentRef: tx_ref,
        });

        // Save to MongoDB
        await newAd.save();

        // Log success message to the console
        console.log('Ad data saved to the database successfully.');
      } else {
        // Log error if payment verification failed
        console.error('Payment verification failed:', verifyResponse.data);
        res.status(400).json({ message: 'Payment verification failed' });
      }
    } else {
      // Log error if payment initiation failed
      console.error('Payment initiation failed:', response.data);
      res.status(500).json({ message: 'Payment initiation failed' });
    }
  } catch (error) {
    console.error('Error during payment initiation:', error);
    res.status(500).json({ message: 'Error during payment initiation' });
  }
};

// AdPreview.js
const AdPreview = () => {

  const handlePublish = async () => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/importAds/initiate', {
        userId,
        businessName,
        businessLocation,
        adDescription,
        templateType,
        categories: selectedCategories,
        amount,
        currency,
        email,
        phoneNumber,
      });
  
      if (response.data.paymentLink) {
        window.location.href = response.data.paymentLink;
      } else {
        setError('Payment initiation failed');
      }
    } catch (error) {
      console.error('Error during payment initiation:', error);
      setError('An error occurred while initiating payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    
  );
};

export default AdPreview;

Server is running on port 5000
Error during payment initiation: AxiosError: Request failed with status code 400

the payment is working but i want that instead of using createImportAd and paymentCallback to send the ad's data to database those functionalities
of sending the ad's data to database should be added inside initiatePayment below after paying process was done it should send the data to database and send a message in
console that it worked and the data it sent to database and if it failed it should also send that message to console so that we can know why