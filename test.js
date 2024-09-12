// .env
MONGODB_URI = mongodb+srv://yepper_test:lolop0788@cluster0.s1wt1at.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT = 5000
REACT_APP_CLERK_PUBLISHABLE_KEY = pk_test_aHVnZS1tdWRmaXNoLTQyLmNsZXJrLmFjY291bnRzLmRldiQ
FLW_PUBLIC_KEY = FLWPUBK-112026cd95260f8d5a150e51ce489285-X
FLW_SECRET_KEY = FLWSECK-e45ef8d6e3bdc4db51175e2f7e5f9031-191e840d2c5vt-X
FLW_ENCRYPTION_KEY = e45ef8d6e3bd8c214e1eb5c3

// ImportAdModel.js
const mongoose = require('mongoose');

const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  businessName: { type: String, required: true },
  businessLocation: { type: String },
  adDescription: { type: String },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },
  templateType: { type: String},
  categories: [{ type: String }],
  paymentStatus: { type: String, default: 'pending' },  // New field for payment status
  paymentRef: { type: String },  // New field to store payment reference from Flutterwave
  amount: { type: Number },  // New field for payment amount
  email: { type: String },  // Email is now optional
  phoneNumber: { type: String },  // New field for phone number
}, { timestamps: true });

module.exports = mongoose.model('ImportAd', importAdSchema);

const Flutterwave = require('flutterwave-node-v3');
const ImportAd = require('../models/ImportAdModel');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Initialize Flutterwave
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Multer storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|pdf|mp4/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimeType && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

exports.createImportAd = [upload.single('file'), async (req, res) => {
  try {
    const { userId, businessName, businessLocation, adDescription, templateType, categories } = req.body;

    let imageUrl = '';
    let pdfUrl = '';
    let videoUrl = '';

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(__dirname, '../uploads', fileName);

      if (req.file.mimetype.startsWith('image')) {
        await sharp(req.file.buffer)
          .resize(300, 300)
          .toFile(filePath);
        imageUrl = `/uploads/${fileName}`;
      } else {
        await fs.promises.writeFile(filePath, req.file.buffer);
        if (req.file.mimetype === 'application/pdf') {
          pdfUrl = `/uploads/${fileName}`;
        } else if (req.file.mimetype.startsWith('video')) {
          videoUrl = `/uploads/${fileName}`;
        }
      }
    }

    // Create an ad object but do not save it yet
    req.adData = {
      userId,
      businessName,
      businessLocation,
      adDescription,
      templateType,
      categories,
      imageUrl,
      pdfUrl,
      videoUrl
    };

    // Proceed to initiate payment
    res.status(200).json({ message: 'Ad prepared successfully, ready for payment' });
  } catch (error) {
    console.error('Error preparing ad:', error);
    res.status(500).json({ message: 'Error preparing ad' });
  }
}];

exports.initiatePayment = async (req, res) => {
  try {
    const { userId, businessName, businessLocation, adDescription, templateType, categories, amount, currency, email, phoneNumber } = req.body;

    if (!businessName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const tx_ref = 'LEDOST-' + Date.now(); // Generate a transaction reference

    // Prepare payment payload for Flutterwave
    const paymentPayload = {
      tx_ref: tx_ref,
      amount: amount,
      currency: currency,
      redirect_url: 'http://localhost:5000/api/importAds/callback', // This URL handles payment status
      customer: {
        email: email || 'no-email@example.com',
        phonenumber: phoneNumber,
        name: businessName
      },
      payment_options: 'card,banktransfer', // Payment options available
      customizations: {
        title: 'Ad Payment',
        description: 'Payment for your advertisement placement',
      }
    };

    // Initialize the payment transaction
    const paymentResponse = await flw.Payment.create(paymentPayload);

    if (paymentResponse && paymentResponse.data && paymentResponse.data.link) {
      // Store the ad data temporarily in the request for the callback
      req.body.paymentRef = tx_ref;
      req.body.paymentStatus = 'pending';

      // Send the payment link to the client
      res.status(200).json({ paymentLink: paymentResponse.data.link });
    } else {
      res.status(500).json({ message: 'Payment initiation failed' });
    }
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ message: 'Error initiating payment' });
  }
};

// Payment callback to verify the status
exports.paymentCallback = async (req, res) => {
  try {
    const tx_ref = req.query.tx_ref;
    const transactionId = req.query.transaction_id;

    // Verify the payment status with Flutterwave
    const paymentStatus = await flw.Transaction.verify({ id: transactionId });

    if (paymentStatus.data.status === 'successful') {
      // Save the ad data in the database if payment is successful
      const newAd = new ImportAd({
        ...req.adData, // Use the ad data stored in the request
        paymentStatus: 'successful'
      });

      await newAd.save();

      // Redirect to a success page or send a success response
      res.redirect('/success-page');
    } else {
      // Handle payment failure
      res.redirect('/error-page');
    }
  } catch (error) {
    console.error('Error in payment callback:', error);
    res.redirect('/error-page');
  }
};


Server is running on port 5000
Error initiating payment: TypeError: Cannot read properties of undefined (reading 'initialize')