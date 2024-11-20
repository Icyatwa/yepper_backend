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
    
    // // Notify each web owner via email
    //   const emailBody = `
    //     <h2>Your Ad has been approved</h2>
    //     <p>Hello,</p>
    //     <p><strong>Business Name:</strong> ${approvedAd.businessName}</p>
    //     <p><strong>Description:</strong> ${approvedAd.adDescription}</p>
    //   `;
    //   await sendEmailNotification(approvedAd.adOwnerEmail, 'New Ad Request for Your Space', emailBody);

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
    const ad = await ImportAd.findById(adId)
      .populate('selectedWebsites', 'websiteName websiteLink')
      .populate('selectedCategories', 'categoryName price ownerId')
      .populate('selectedSpaces', 'spaceType price webOwnerEmail');

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    res.status(200).json(ad);
  } catch (error) {
    console.error('Error fetching ad details:', error);
    res.status(500).json({ message: 'Failed to fetch ad details', error });
  }
};

exports.confirmAdDisplay = async (req, res) => {
  try {
    const { adId } = req.params;

    // First, find and update the ad's confirmation status
    const confirmedAd = await ImportAd.findByIdAndUpdate(
      adId,
      { confirmed: true },
      { new: true }
    ).populate('selectedSpaces');

    if (!confirmedAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Now that the ad is confirmed, update all selected ad spaces to include this ad
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

    // Notify that the ad is now live
    confirmedAd.selectedSpaces.forEach(space => {
      console.log(`Ad is now live on space ID: ${space._id}`);
    });

    res.status(200).json({ 
      message: 'Ad confirmed and now live on selected spaces',
      ad: confirmedAd
    });

  } catch (error) {
    console.error('Error confirming ad display:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// exports.initiateAdPayment = async (req, res) => {
//   console.log('Received initiate-payment request:', req.body); // Log request body for debugging

//   try {
//     const { adId, amount, email, phoneNumber, userId } = req.body;

//     // Validate required fields and provide detailed messages
//     if (!adId) {
//       console.error('Missing adId');
//       return res.status(400).json({ message: 'Missing required field: adId' });
//     }
//     if (!amount) {
//       console.error('Missing amount');
//       return res.status(400).json({ message: 'Missing required field: amount' });
//     }
//     if (isNaN(amount) || amount <= 0) {
//       console.error('Invalid amount:', amount);
//       return res.status(400).json({ message: 'Invalid amount: must be a positive number' });
//     }
//     if (!email) {
//       console.error('Missing email');
//       return res.status(400).json({ message: 'Missing required field: email' });
//     }
//     if (!phoneNumber) {
//       console.error('Missing phoneNumber');
//       return res.status(400).json({ message: 'Missing required field: phoneNumber' });
//     }
//     if (!userId) {
//       console.error('Missing userId');
//       return res.status(400).json({ message: 'Missing required field: userId' });
//     }

//     const tx_ref = 'CARDPAY-' + Date.now();

//     // Attempt to save payment record, log any errors
//     try {
//       const payment = new Payment({
//         tx_ref,
//         amount,
//         currency: 'RWF',
//         email,
//         phoneNumber,
//         userId,
//         adId,
//         status: 'pending'
//       });
//       await payment.save();
//       console.log('Payment record created successfully:', payment);
//     } catch (error) {
//       console.error('Error saving payment record:', error);
//       return res.status(500).json({ message: 'Error saving payment record', error });
//     }

//     // Prepare payment payload for external API
//     const paymentPayload = {
//       tx_ref,
//       amount,
//       currency: 'RWF',
//       redirect_url: 'http://localhost:5000/api/accept/callback',
//       customer: {
//         email: email,
//         phonenumber: phoneNumber,
//       },
//       payment_options: 'card',
//       customizations: {
//         title: 'Ad Payment',
//         description: 'Confirm and pay for your ad display',
//       },
//     };

//     // Initiate payment with Flutterwave
//     try {
//       const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayload, {
//         headers: {
//           Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.data && response.data.data && response.data.data.link) {
//         console.log('Payment link generated successfully:', response.data.data.link);
//         return res.status(200).json({ paymentLink: response.data.data.link });
//       } else {
//         console.error('Failed to generate payment link:', response.data);
//         return res.status(500).json({ message: 'Payment initiation failed', error: response.data });
//       }
//     } catch (error) {
//       console.error('Error with Flutterwave payment initiation:', error.response?.data || error.message);
//       return res.status(500).json({ message: 'Error initiating payment with Flutterwave', error: error.response?.data || error.message });
//     }
//   } catch (error) {
//     console.error('Unexpected error in initiateAdPayment:', error);
//     res.status(500).json({ message: 'Unexpected error in payment initiation', error });
//   }
// };

// exports.adPaymentCallback = async (req, res) => {
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

//       return res.redirect('http://localhost:3000/ads/confirmed');
//     } else {
//       await Payment.findOneAndUpdate({ tx_ref }, { status: 'failed' });
//       return res.redirect('http://localhost:3000/ads/failed');
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Payment verification failed', error });
//   }
// };

exports.getApprovedAds = async (req, res) => {
  try {
    const approvedAds = await ImportAd.find({ approved: true })
      .populate('selectedSpaces selectedWebsites selectedCategories');

    res.status(200).json(approvedAds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved ads' });
  }
};

exports.getApprovedAdsByUser = async (req, res) => {
  try {
    const { ownerId } = req.params;  // Owner's ID from params

    // Fetch the owner's websites, categories, and ad spaces
    const websites = await Website.find({ ownerId });
    const websiteIds = websites.map(website => website._id);

    const categories = await AdCategory.find({ websiteId: { $in: websiteIds } });
    const categoryIds = categories.map(category => category._id);

    const adSpaces = await AdSpace.find({ categoryId: { $in: categoryIds } });
    const adSpaceIds = adSpaces.map(space => space._id);

    // Fetch approved ads that belong to the owner's ad spaces
    const approvedAds = await ImportAd.find({
      approved: true,
      selectedSpaces: { $in: adSpaceIds }
    }).populate('selectedSpaces selectedCategories selectedWebsites');

    res.status(200).json(approvedAds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved ads' });
  }
};

exports.getUserPendingAds = async (req, res) => {
  try {
    const { userId } = req.params; // Importer's ID from params

    // Fetch pending ads imported by this user
    const pendingAds = await ImportAd.find({
      userId,
      approved: false
    }).populate('selectedSpaces selectedCategories selectedWebsites');

    res.status(200).json(pendingAds);
  } catch (error) {
    console.error('Error fetching user’s pending ads:', error);
    res.status(500).json({ message: 'Error fetching user’s pending ads' });
  }
};