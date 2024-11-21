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
  selectedAds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImportAd', default: [] }],
  createdAt: { type: Date, default: Date.now },
  webOwnerEmail: { type: String, required: true },
});

// Update virtual property to handle undefined `selectedAds` array
adSpaceSchema.virtual('remainingUserCount').get(function () {
  return this.userCount - (this.selectedAds ? this.selectedAds.length : 0);
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
  businessLink: { type: String, required: true },
  businessLocation: { type: String, required: true },
  adDescription: { type: String, required: true },
  selectedWebsites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Website' }],
  selectedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory' }],
  selectedSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdSpace' }],
  approved: { type: Boolean, default: false },
  confirmed: { type: Boolean, default: false },
  clicks: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
});

module.exports = mongoose.model('ImportAd', importAdSchema);

// AdApprovalController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');
const Website = require('../models/WebsiteModel');
const sendEmailNotification = require('./emailService');
const Payment = require('../models/PaymentModel');
const Flutterwave = require('flutterwave-node-v3');
const axios = require('axios');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

exports.getPendingAds = async (req, res) => {
  try {
    const { ownerId } = req.params;  // Owner's ID from params

    // Fetch the owner's websites, categories, and ad spaces
    const websites = await Website.find({ ownerId });
    const websiteIds = websites.map(website => website._id);

    const categories = await AdCategory.find({ websiteId: { $in: websiteIds } });
    const categoryIds = categories.map(category => category._id);

    const adSpaces = await AdSpace.find({ categoryId: { $in: categoryIds } });
    const adSpaceIds = adSpaces.map(space => space._id);

    // Fetch pending ads that belong to the owner's ad spaces
    const pendingAds = await ImportAd.find({
      approved: false,
      selectedSpaces: { $in: adSpaceIds }
    }).populate('selectedSpaces selectedCategories selectedWebsites');

    res.status(200).json(pendingAds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending ads' });
  }
};

exports.getPendingAdById = async (req, res) => {
  try {
    const { adId } = req.params;
    console.log('Fetching ad with ID:', adId); // Debugging log

    const ad = await ImportAd.findById(adId)
      .populate('selectedSpaces selectedCategories selectedWebsites');

    if (!ad) {
      console.log('Ad not found for ID:', adId); // Log when ad is missing
      return res.status(404).json({ message: 'Ad not found' });
    }

    res.status(200).json(ad);
  } catch (error) {
    console.error('Error fetching ad:', error); // Catch any unexpected errors
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.approveAd = async (req, res) => {
  try {
    const { adId } = req.params;

    // Only update the approved status, don't push to API yet
    const approvedAd = await ImportAd.findByIdAndUpdate(
      adId,
      { approved: true },
      { new: true }
    ).populate('userId');

    if (!approvedAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Notify the ad owner about approval (implement your notification system here)
    console.log(`Notification: Ad for ${approvedAd.businessName} has been approved. Awaiting confirmation from the ad owner.`);
    
    // Notify each web owner via email
      const emailBody = `
        <h2>Your Ad has been approved</h2>
        <p>Hello,</p>
        <p><strong>Business Name:</strong> ${approvedAd.businessName}</p>
        <p><strong>Description:</strong> ${approvedAd.adDescription}</p>
      `;
      await sendEmailNotification(approvedAd.adOwnerEmail, 'New Ad Request for Your Space', emailBody);

    res.status(200).json({
      message: 'Ad approved successfully. Waiting for advertiser confirmation.',
      ad: approvedAd
    });

  } catch (error) {
    console.error('Error approving ad:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// exports.getApprovedAdsAwaitingConfirmation = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const approvedAds = await ImportAd.find({
//       userId,
//       approved: true,
//       confirmed: false,
//     })
//       .populate({
//         path: 'selectedCategories',
//         select: 'price ownerId', // Include ownerId here
//       })
//       .populate({
//         path: 'selectedSpaces',
//         select: 'price webOwnerEmail', // Include webOwnerEmail here
//       });

//     // Calculate total price for each ad and include owner info
//     const adsWithTotalPrices = approvedAds.map(ad => {
//       const categoryPriceSum = ad.selectedCategories.reduce((sum, category) => sum + (category.price || 0), 0);
//       const spacePriceSum = ad.selectedSpaces.reduce((sum, space) => sum + (space.price || 0), 0);
//       const totalPrice = categoryPriceSum + spacePriceSum;

//       // Include ownerId and webOwnerEmail in the response
//       return {
//         ...ad.toObject(),
//         totalPrice,
//         categoryOwnerIds: ad.selectedCategories.map(cat => cat.ownerId),
//         spaceOwnerEmails: ad.selectedSpaces.map(space => space.webOwnerEmail),
//       };
//     });

//     res.status(200).json(adsWithTotalPrices);
//   } catch (error) {
//     console.error('Error fetching approved ads:', error);
//     res.status(500).json({ message: 'Failed to fetch approved ads', error });
//   }
// };

// exports.getAdDetails = async (req, res) => {
//   const { adId } = req.params;

//   try {
//     const ad = await ImportAd.findById(adId)
//       .populate('selectedCategories', 'price ownerId')
//       .populate('selectedSpaces', 'price webOwnerEmail');

//     if (!ad) {
//       return res.status(404).json({ message: 'Ad not found' });
//     }

//     res.status(200).json(ad);
//   } catch (error) {
//     console.error('Error fetching ad details:', error);
//     res.status(500).json({ message: 'Failed to fetch ad details', error });
//   }
// };

exports.getApprovedAdsAwaitingConfirmation = async (req, res) => {
  const { userId } = req.params;

  try {
    const approvedAds = await ImportAd.find({
      userId,
      approved: true
    })
      .populate({
        path: 'selectedCategories',
        select: 'price ownerId',
      })
      .populate({
        path: 'selectedSpaces',
        select: 'price webOwnerEmail',
      })
      .populate('selectedWebsites', 'websiteName websiteLink logoUrl')

    const adsWithDetails = approvedAds.map(ad => {
      const categoryPriceSum = ad.selectedCategories.reduce((sum, category) => sum + (category.price || 0), 0);
      const spacePriceSum = ad.selectedSpaces.reduce((sum, space) => sum + (space.price || 0), 0);
      const totalPrice = categoryPriceSum + spacePriceSum;

      return {
        ...ad.toObject(),
        totalPrice,
        isConfirmed: ad.confirmed,
        categoryOwnerIds: ad.selectedCategories.map(cat => cat.ownerId),
        spaceOwnerEmails: ad.selectedSpaces.map(space => space.webOwnerEmail),
        clicks: ad.clicks,  // Include clicks
        views: ad.views     // Include views
      };
    });

    res.status(200).json(adsWithDetails);
  } catch (error) {
    console.error('Error fetching approved ads:', error);
    res.status(500).json({ message: 'Failed to fetch approved ads', error });
  }
};

exports.getAdDetails = async (req, res) => {
  const { adId } = req.params;

  try {
    const approvedAds = await ImportAd.findById(adId)
    .populate('selectedWebsites', 'websiteName websiteLink')
    .populate('selectedCategories', 'categoryName price ownerId')
    .populate('selectedSpaces', 'spaceType price webOwnerEmail');

    const adsWithDetails = approvedAds.map(ad => {
        const categoryPriceSum = ad.selectedCategories.reduce((sum, category) => sum + (category.price || 0), 0);
        const spacePriceSum = ad.selectedSpaces.reduce((sum, space) => sum + (space.price || 0), 0);
        const totalPrice = categoryPriceSum + spacePriceSum;
  
        return {
          ...ad.toObject(),
          totalPrice,
          isConfirmed: ad.confirmed,
          categoryOwnerIds: ad.selectedCategories.map(cat => cat.ownerId),
          spaceOwnerEmails: ad.selectedSpaces.map(space => space.webOwnerEmail),
          clicks: ad.clicks,  // Include clicks
          views: ad.views     // Include views
        };
    });

    if (!approvedAds) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    res.status(200).json(adsWithDetails);
  } catch (error) {
    console.error('Error fetching ad details:', error);
    res.status(500).json({ message: 'Failed to fetch ad details', error });
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

    const tx_ref = 'CARDPAY-' + Date.now();

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
      currency: 'RWF',
      redirect_url: 'https://yepper-backend.onrender.com/api/accept/callback',
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

      return res.redirect('https://yepper.vercel.app/dashboard');
    } else {
      await Payment.findOneAndUpdate({ tx_ref }, { status: 'failed' });
      return res.redirect('https://yepper.vercel.app');
    }
  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed', error });
  }
};