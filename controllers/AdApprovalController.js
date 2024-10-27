// AdApprovalController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');
const Website = require('../models/WebsiteModel');
const sendEmailNotification = require('./emailService');

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

    res.status(200).json({ 
      message: 'Ad approved successfully. Waiting for advertiser confirmation.',
      ad: approvedAd 
    });

  } catch (error) {
    console.error('Error approving ad:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getApprovedAdsAwaitingConfirmation = async (req, res) => {
  const { userId } = req.params;
  try {
    // Find ads that are approved but not yet confirmed
    const approvedAds = await ImportAd.find({ 
      userId, 
      approved: true, 
      confirmed: false 
    }).populate('selectedSpaces');
    
    res.status(200).json(approvedAds);
  } catch (error) {
    console.error('Error fetching approved ads awaiting confirmation:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

// exports.confirmAdDisplay = async (req, res) => {
//   try {
//     const { adId } = req.params;

//     // First, find and update the ad's confirmation status
//     const confirmedAd = await ImportAd.findByIdAndUpdate(
//       adId,
//       { confirmed: true },
//       { new: true }
//     ).populate('selectedSpaces');

//     if (!confirmedAd) {
//       return res.status(404).json({ message: 'Ad not found' });
//     }

//     // Now that the ad is confirmed, update all selected ad spaces to include this ad
//     const spaceUpdates = confirmedAd.selectedSpaces.map(async (spaceId) => {
//       return AdSpace.findByIdAndUpdate(
//         spaceId,
//         { 
//           $push: { 
//             activeAds: {
//               adId: confirmedAd._id,
//               imageUrl: confirmedAd.imageUrl,
//               pdfUrl: confirmedAd.pdfUrl,
//               videoUrl: confirmedAd.videoUrl,
//               businessName: confirmedAd.businessName,
//               adDescription: confirmedAd.adDescription
//             }
//           }
//         },
//         { new: true }
//       );
//     });

//     await Promise.all(spaceUpdates);

//     // Notify that the ad is now live
//     confirmedAd.selectedSpaces.forEach(space => {
//       console.log(`Ad is now live on space ID: ${space._id}`);
//     });

//     res.status(200).json({ 
//       message: 'Ad confirmed and now live on selected spaces',
//       ad: confirmedAd
//     });

//   } catch (error) {
//     console.error('Error confirming ad display:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// Set up PayPal environment

exports.confirmAdDisplay = async (adId, adSpaceId, price) => {
  try {
    // 1. Create Order
    const createOrderResponse = await fetch('http://localhost:5000/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId, adSpaceId, price })
    });
    const orderData = await createOrderResponse.json();

    if (!orderData.orderID) throw new Error('Order creation failed');

    // 2. Redirect to PayPal for approval
    window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${orderData.orderID}`;

    // 3. Capture Payment after approval
    const captureResponse = await fetch('http://localhost:5000/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderID: orderData.orderID, adId })
    });

    if (captureResponse.ok) {
      alert('Payment successful! Ad is now confirmed and live.');
      setApprovedAds((prevAds) => prevAds.filter((ad) => ad._id !== adId));
    } else {
      throw new Error('Failed to confirm ad');
    }
  } catch (error) {
    setError(error.message);
  }
};

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
