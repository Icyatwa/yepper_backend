// PaymentModel.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tx_ref: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending' },
  email: { type: String },
  phoneNumber: { type: String, required: true },
  userId: { type: String, required: true }, // ID of the advertiser who paid
  adId: { type: String, required: true }, // ID of 
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

// AdApprovalController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');
const Payment = require('../models/PaymentModel');
const Flutterwave = require('flutterwave-node-v3');
const axios = require('axios');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

exports.getApprovedAdsAwaitingConfirmation = async (req, res) => {
  const { userId } = req.params;

  try {
    const approvedAds = await ImportAd.find({
      userId,
      approved: true,
      confirmed: false,
    })
      .populate({
        path: 'selectedCategories',
        select: 'price ownerId', // Include ownerId here
      })
      .populate({
        path: 'selectedSpaces',
        select: 'price webOwnerEmail', // Include webOwnerEmail here
      });

    // Calculate total price for each ad and include owner info
    const adsWithTotalPrices = approvedAds.map(ad => {
      const categoryPriceSum = ad.selectedCategories.reduce((sum, category) => sum + (category.price || 0), 0);
      const spacePriceSum = ad.selectedSpaces.reduce((sum, space) => sum + (space.price || 0), 0);
      const totalPrice = categoryPriceSum + spacePriceSum;

      // Include ownerId and webOwnerEmail in the response
      return {
        ...ad.toObject(),
        totalPrice,
        categoryOwnerIds: ad.selectedCategories.map(cat => cat.ownerId),
        spaceOwnerEmails: ad.selectedSpaces.map(space => space.webOwnerEmail),
      };
    });

    res.status(200).json(adsWithTotalPrices);
  } catch (error) {
    console.error('Error fetching approved ads:', error);
    res.status(500).json({ message: 'Failed to fetch approved ads', error });
  }
};

exports.initiateAdPayment = async (req, res) => {
  console.log('Received initiate-payment request:', req.body); // Log request body for debugging

  try {
    const { adId, amount, email, phoneNumber, userId } = req.body;

    // Validate required fields and provide detailed messages
    if (!adId) {
      console.error('Missing adId');
      return res.status(400).json({ message: 'Missing required field: adId' });
    }
    if (!amount) {
      console.error('Missing amount');
      return res.status(400).json({ message: 'Missing required field: amount' });
    }
    if (isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid amount: must be a positive number' });
    }
    if (!email) {
      console.error('Missing email');
      return res.status(400).json({ message: 'Missing required field: email' });
    }
    if (!phoneNumber) {
      console.error('Missing phoneNumber');
      return res.status(400).json({ message: 'Missing required field: phoneNumber' });
    }
    if (!userId) {
      console.error('Missing userId');
      return res.status(400).json({ message: 'Missing required field: userId' });
    }

    const tx_ref = 'ADPAY-' + Date.now();

    // Attempt to save payment record, log any errors
    try {
      const payment = new Payment({
        tx_ref,
        amount,
        currency: 'RWF',
        email,
        phoneNumber,
        userId,
        adId,
        status: 'pending'
      });
      await payment.save();
      console.log('Payment record created successfully:', payment);
    } catch (error) {
      console.error('Error saving payment record:', error);
      return res.status(500).json({ message: 'Error saving payment record', error });
    }

    // Prepare payment payload for external API
    const paymentPayload = {
      tx_ref,
      amount,
      currency: 'USD',
      redirect_url: 'http://localhost:5000/api/accept/callback',
      customer: {
        email: email,
        phonenumber: phoneNumber,
      },
      payment_options: 'card',
      customizations: {
        title: 'Ad Payment',
        description: 'Confirm and pay for your ad display',
      },
    };

    // Initiate payment with Flutterwave
    try {
      const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayload, {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.data && response.data.data.link) {
        console.log('Payment link generated successfully:', response.data.data.link);
        return res.status(200).json({ paymentLink: response.data.data.link });
      } else {
        console.error('Failed to generate payment link:', response.data);
        return res.status(500).json({ message: 'Payment initiation failed', error: response.data });
      }
    } catch (error) {
      console.error('Error with Flutterwave payment initiation:', error.response?.data || error.message);
      return res.status(500).json({ message: 'Error initiating payment with Flutterwave', error: error.response?.data || error.message });
    }
  } catch (error) {
    console.error('Unexpected error in initiateAdPayment:', error);
    res.status(500).json({ message: 'Unexpected error in payment initiation', error });
  }
};

exports.adPaymentCallback = async (req, res) => {
  try {
    const { tx_ref, transaction_id } = req.query;

    const transactionVerification = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
      }
    });

    const { status } = transactionVerification.data.data;

    if (status === 'successful') {
      const payment = await Payment.findOneAndUpdate(
        { tx_ref },
        { status: 'successful' },
        { new: true }
      );

      if (payment) {
        await ImportAd.findByIdAndUpdate(payment.adId, { confirmed: true });
      }

      return res.redirect('http://localhost:3000/ads/confirmed');
    } else {
      await Payment.findOneAndUpdate({ tx_ref }, { status: 'failed' });
      return res.redirect('http://localhost:3000/ads/failed');
    }
  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed', error });
  }
};

// ApprovedAdsForAdvertiser.js
const ApprovedAdsForAdvertiser = () => {
  const { user } = useClerk();
  const userId = user?.id;
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [approvedAds, setApprovedAds] = useState([]);
  const [error, setError] = useState(null); // State to store error messages
  const [loading, setLoading] = useState(false); // State to indicate loading
  const [selectedAd, setSelectedAd] = useState(null); // State to track the selected ad for payment

  const handleAdSelect = (ad) => {
    setSelectedAd(ad); // Set the selected ad for payment
  };

  useEffect(() => {
    const fetchApprovedAdsAwaitingConfirmation = async () => {
      try {
        if (!userId) {
          console.log("User ID not found, aborting fetch.");
          setLoading(false);
          return;
        }
    
        console.log("Fetching ads for user ID:", userId);
        const response = await fetch(`http://localhost:5000/api/accept/approved-awaiting-confirmation/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch approved ads');
        }
    
        const ads = await response.json();
        console.log('Fetched ads:', ads); // Log the fetched ads
        setApprovedAds(ads);
      } catch (error) {
        console.error('Error fetching approved ads:', error);
        setError('Failed to load ads');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApprovedAdsAwaitingConfirmation();
  }, [userId]);

   const initiatePayment = async () => {
    setLoading(true);
    setError(null); // Reset error message before a new attempt

    try {
      const response = await axios.post('http://localhost:5000/api/accept/initiate-payment', {
        adId: selectedAd._id,
        amount: selectedAd.totalPrice,
        email,
        phoneNumber,
        userId
      });

      if (response.data.paymentLink) {
        console.log('Redirecting to payment link:', response.data.paymentLink);
        window.location.href = response.data.paymentLink;
      } else {
        setError('Payment link generation failed. Please try again.');
      }
    } catch (error) {
      if (error.response) {
        // Backend returned a specific error message
        console.error('Error response:', error.response.data);

        if (error.response.status === 400) {
          setError(`Bad Request: ${error.response.data.message}`);
        } else if (error.response.status === 500) {
          setError(`Server Error: ${error.response.data.message || 'An error occurred on the server.'}`);
        } else {
          setError('Unexpected error: Please try again later.');
        }
      } else if (error.request) {
        // No response was received from the backend
        console.error('No response received:', error.request);
        setError('Network error: Unable to reach the server. Check your connection.');
      } else {
        // Any other errors (possibly in the frontend code itself)
        console.error('Error:', error.message);
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

};

Server is running on port 5000
Received initiate-payment request: {
  adId: '672b78b70023cbb50d962207',
  amount: 100,
  email: 'icyatwandoba@gmail.com',
  phoneNumber: '+250792051768',
  userId: 'user_2blQmsNZIYh1oxDnbHEjLdhr1iT'
}
Payment record created successfully: {
  tx_ref: 'ADPAY-1730902680173',
  amount: 100,
  currency: 'RWF',
  status: 'pending',
  email: 'icyatwandoba@gmail.com',
  phoneNumber: '+250792051768',
  userId: 'user_2blQmsNZIYh1oxDnbHEjLdhr1iT',
  adId: '672b78b70023cbb50d962207',
  _id: new ObjectId('672b7a985c51a5ef4925402a'),
  createdAt: 2024-11-06T14:18:00.194Z,
  updatedAt: 2024-11-06T14:18:00.194Z,
  __v: 0
}
Error with Flutterwave payment initiation: { status: 'error', message: 'Invalid authorization key', data: null }

fix it
























// PictureModel.js
const pictureSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  ownerId: { type: String, required: true },
}, { timestamps: true });

// PaymentModel.js
const paymentSchema = new mongoose.Schema({
  tx_ref: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending' },
  email: { type: String, required: false },
  phoneNumber: { type: String, required: true },
  userId: { type: String, required: true }, // ID of the user who paid
  pictureId: { type: String, required: true }, // ID of the picture being paid for
}, { timestamps: true });

// controllers/PictureController.js
const Picture = require('../models/PictureModel');
const Payment = require('../models/PaymentModel');

exports.uploadPicture = async (req, res) => {
  try {
    const { url, price, ownerId } = req.body;

    if (!url || !price || !ownerId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Save picture and retrieve its ID directly from MongoDB
    const picture = new Picture({ url, price, ownerId });
    await picture.save();

    res.status(201).json({ message: 'Picture uploaded successfully', pictureId: picture._id, picture });
  }
};
exports.getAllPictures = async (req, res) => {
  // codes
};

// Paymentcontroller.js
const Picture = require('../models/PictureModel');
const Payment = require('../models/PaymentModel');
const Flutterwave = require('flutterwave-node-v3');
const axios = require('axios');

exports.initiateCardPayment = async (req, res) => {
  try {
    const { amount, currency, email, phoneNumber, userId, pictureId } = req.body;

    if (!amount || !currency || !phoneNumber || !userId || !pictureId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const tx_ref = 'CARDPAY-' + Date.now();

    // Step 1: Save the pending payment in the database
    const payment = new Payment({
      tx_ref,
      amount,
      currency,
      email,
      phoneNumber,
      userId,
      pictureId,
      status: 'pending'
    });
    await payment.save();

    // Step 2: Initiate the payment with Flutterwave
    const paymentPayload = {
      tx_ref,
      amount,
      currency,
      redirect_url: 'http://localhost:5000/api/payment/callback',
      customer: {
        email: email || 'no-email@example.com',
        phonenumber: phoneNumber,
      },
      payment_options: 'card',
      customizations: {
        title: 'Card Payment',
        description: 'Pay with your bank card',
      },
    };

    const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayload, {
      headers: {
        Authorization: Bearer ${process.env.FLW_SECRET_KEY},
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.data && response.data.data.link) {
      res.status(200).json({ paymentLink: response.data.data.link });
    } else {
      res.status(500).json({ message: 'Payment initiation failed', error: response.data });
    }
  }
};

exports.paymentCallback = async (req, res) => {
  try {
    const { tx_ref, transaction_id } = req.query;

    const transactionVerification = await axios.get(https://api.flutterwave.com/v3/transactions/${transaction_id}/verify, {
      headers: {
        Authorization: Bearer ${process.env.FLW_SECRET_KEY}
      }
    });

    const { status, customer, amount, currency } = transactionVerification.data.data;

    if (status === 'successful') {
      // Find and update the payment status to 'successful'
      const payment = await Payment.findOneAndUpdate(
        { tx_ref },
        { status: 'successful' },
        { new: true }
      );

      if (payment) {
        // Add user to the list of paid users for the picture
        await Picture.findByIdAndUpdate(payment.pictureId, {
          $addToSet: { paidUsers: payment.userId }
        });
      }

      return res.redirect('http://localhost:3000/list');
    } else {
      // Update the payment record as failed
      await Payment.findOneAndUpdate({ tx_ref }, { status: 'failed' });
      return res.redirect('http://localhost:3000/failed');
    }
  }
};

// components/PhotoList.js
const PhotoList = () => {
  useEffect(() => {
    const fetchPictures = async () => {
      // codes
    };
    fetchPictures();
  }, []);

  const handleViewClick = (picture) => {
    const hasPaid = picture.paidUsers.includes(userId);
    if (hasPaid) {
      setSelectedPicture(picture);
    } else {
      setSelectedPicture(picture);
      setShowPaymentForm(true);
    }
  };

  const handlePayment = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/payment/initiate-card-payment', {
        amount: selectedPicture.price,
        currency: 'RWF',
        email,
        phoneNumber,
        userId,
        pictureId: selectedPicture._id
      });
  
      if (response.data.paymentLink) {
        window.location.href = response.data.paymentLink;
      }
    }
  };  

};

you see this demo system above, a creator will import a pic and viewers to view his pic they'll have to pay him(and it's working perfectly), so i want you to grab some of its features and paste them in this project below:

// AdCategoryModel.js
const adCategorySchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true },
  categoryName: { type: String, required: true, minlength: 3 },
  description: { type: String, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },
  customAttributes: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now }
});

// Virtual for AdSpaces that belong to this category

// AdSpaceModel.js
const mongoose = require('mongoose');

const adSpaceSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory', required: true },
  spaceType: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  availability: { type: String, required: true },
  userCount: { type: Number, default: 0 },
  instructions: { type: String },
  selectedAds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImportAd' }],
  webOwnerEmail: { type: String, required: true },
});

// AdApprovalController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');

exports.getApprovedAdsAwaitingConfirmation = async (req, res) => {
  const { userId } = req.params;

  try {
    const approvedAds = await ImportAd.find({
      userId,
      approved: true,
      confirmed: false,
    })
      .populate({
        path: 'selectedCategories',
        select: 'price ownerId', // Include ownerId here
      })
      .populate({
        path: 'selectedSpaces',
        select: 'price webOwnerEmail', // Include webOwnerEmail here
      });

    // Calculate total price for each ad and include owner info
    const adsWithTotalPrices = approvedAds.map(ad => {
      const categoryPriceSum = ad.selectedCategories.reduce((sum, category) => sum + (category.price || 0), 0);
      const spacePriceSum = ad.selectedSpaces.reduce((sum, space) => sum + (space.price || 0), 0);
      const totalPrice = categoryPriceSum + spacePriceSum;

      // Include ownerId and webOwnerEmail in the response
      return {
        ...ad.toObject(),
        totalPrice,
        categoryOwnerIds: ad.selectedCategories.map(cat => cat.ownerId),
        spaceOwnerEmails: ad.selectedSpaces.map(space => space.webOwnerEmail),
      };
    });

    res.status(200).json(adsWithTotalPrices);
  }
};

exports.confirmAdDisplay = async (req, res) => { //confirming the ad by the ad owner
  try {
    const { adId } = req.params;

    const confirmedAd = await ImportAd.findByIdAndUpdate(
      adId,
      { confirmed: true },
      { new: true }
    ).populate('selectedSpaces');

    const spaceUpdates = confirmedAd.selectedSpaces.map(async (spaceId) => {
      return AdSpace.findByIdAndUpdate(
        spaceId,
        { 
          $push: { 
            activeAds: {
              adId: confirmedAd._id,
              imageUrl: confirmedAd.imageUrl,
              pdfUrl: confirmedAd.pdfUrl,
              videoUrl: confirmedAd.videoUrl,
              businessName: confirmedAd.businessName,
              adDescription: confirmedAd.adDescription
            }
          }
        },
        { new: true }
      );
    });
    await Promise.all(spaceUpdates);
    res.status(200).json();
  }
};

// ApprovedAdsForAdvertiser.js
import { useClerk } from '@clerk/clerk-react';
const ApprovedAdsForAdvertiser = () => {
  const { user } = useClerk();
  const userId = user?.id; // Fetch user ID from Clerk
  useEffect(() => {
    const fetchApprovedAdsAwaitingConfirmation = async () => {
      // codes
  }, [userId]);

  const confirmAdDisplay = async (adId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/accept/confirm/${adId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setApprovedAds((prevAds) => prevAds.filter((ad) => ad._id !== adId));
      }
    }
  };
  return (
    <div>
      {approvedAds.length > 0 ? (
        approvedAds.map((ad) => (
          <div key={ad._id}>
            <p><strong>Category Owner IDs:</strong> {ad.categoryOwnerIds.join(', ')}</p>
            <p><strong>Space Owner Emails:</strong> {ad.spaceOwnerEmails.join(', ')}</p>
            <p><strong>Total Price:</strong> ${ad.totalPrice}</p>
            <button onClick={() => confirmAdDisplay(ad._id)}>Confirm Ad Display</button>
          </div>
        ))
      )
    </div>
  );
};

In this system, a website owner creates an ad space, generating an API for it. Advertisers then select this space, submit their ad, and await the owner's approval. Once approved, the advertiser must confirm and pay for the ad and by paying the price is that total. Only after a successful payment will the ad go live via the space's API, with funds transferred to the space owner. NB: update both backend and frontend














// AdCategoryModel.js
const mongoose = require('mongoose');

const adCategorySchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true },
  categoryName: { type: String, required: true, minlength: 3 },
  description: { type: String, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },
  customAttributes: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now }
});

// Virtual for AdSpaces that belong to this category
adCategorySchema.virtual('adSpaces', {
  ref: 'AdSpace',
  localField: '_id',
  foreignField: 'categoryId',
});

adCategorySchema.index({ ownerId: 1 }); // Adding an index for frequent queries

module.exports = mongoose.model('AdCategory', adCategorySchema);


// AdSpaceModel.js
const mongoose = require('mongoose');

const adSpaceSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory', required: true },
  spaceType: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  availability: { type: String, required: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  userCount: { type: Number, default: 0 },
  instructions: { type: String },
  apiCodes: {
    HTML: { type: String },
    JavaScript: { type: String },
    PHP: { type: String },
    Python: { type: String },
  },
  selectedAds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImportAd' }],
  createdAt: { type: Date, default: Date.now },
  webOwnerEmail: { type: String, required: true },
});

adSpaceSchema.virtual('remainingUserCount').get(function () {
  return this.userCount - this.selectedAds.length;
});

adSpaceSchema.pre('validate', function (next) {
  if (
    (this.availability === 'Reserved for future date' || this.availability === 'Pick a date') &&
    (!this.startDate || !this.endDate)
  ) {
    return next(new Error('Start date and end date must be provided for reserved or future availability.'));
  }
  next();
});

adSpaceSchema.index({ categoryId: 1 }); // Index for faster lookups

adSpaceSchema.virtual('remainingUserCount').get(function() {
  return this.userCount - this.selectedAds.length;
});

adSpaceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('AdSpace', adSpaceSchema);

// ImportAdModel.js
const mongoose = require('mongoose');
const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  adOwnerEmail: { type: String, required: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },
  businessName: { type: String, required: true },
  businessLocation: { type: String, required: true },
  adDescription: { type: String, required: true },
  selectedWebsites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Website' }],
  selectedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory' }],
  selectedSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdSpace' }],
  approved: { type: Boolean, default: false },
  confirmed: { type: Boolean, default: false },
});

module.exports = mongoose.model('ImportAd', importAdSchema);

// AdApprovalController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');
const Website = require('../models/WebsiteModel');

exports.getApprovedAdsAwaitingConfirmation = async (req, res) => {
  const { userId } = req.params;

  try {
    const approvedAds = await ImportAd.find({
      userId,
      approved: true,
      confirmed: false,
    })
      .populate('selectedCategories')
      .populate('selectedSpaces');

    // Calculate total price for each ad
    const adsWithTotalPrices = approvedAds.map(ad => {
      const categoryPriceSum = ad.selectedCategories.reduce((sum, category) => sum + (category.price || 0), 0);
      const spacePriceSum = ad.selectedSpaces.reduce((sum, space) => sum + (space.price || 0), 0);
      const totalPrice = categoryPriceSum + spacePriceSum;

      return { ...ad.toObject(), totalPrice };
    });

    res.status(200).json(adsWithTotalPrices);
  } catch (error) {
    console.error('Error fetching approved ads:', error);
    res.status(500).json({ message: 'Failed to fetch approved ads', error });
  }
};

import React, { useEffect, useState } from 'react';
import { useClerk } from '@clerk/clerk-react';
import axios from 'axios'

const ApprovedAdsForAdvertiser = () => {
  const { user } = useClerk();
  const userId = user?.id;
  const [approvedAds, setApprovedAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApprovedAdsAwaitingConfirmation = async () => {
      try {
        if (!userId) {
          console.log("User ID not found, aborting fetch.");
          setLoading(false);
          return;
        }
    
        console.log("Fetching ads for user ID:", userId);
        const response = await fetch(`http://localhost:5000/api/accept/approved-awaiting-confirmation/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch approved ads');
        }
    
        const ads = await response.json();
        console.log('Fetched ads:', ads); // Log the fetched ads
        setApprovedAds(ads);
      } catch (error) {
        console.error('Error fetching approved ads:', error);
        setError('Failed to load ads');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApprovedAdsAwaitingConfirmation();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {approvedAds.length > 0 ? (
        approvedAds.map((ad) => (
          <div key={ad._id}>
            <p><strong>Total Price:</strong> ${ad.totalPrice}</p>
          </div>
        ))
      ) : (
        <p>No ads awaiting confirmation</p>
      )}
    </div>
  );
};

export default ApprovedAdsForAdvertiser;
