// // AdApprovalController.js
// const ImportAd = require('../models/ImportAdModel');
// const AdSpace = require('../models/AdSpaceModel');
// const AdCategory = require('../models/AdCategoryModel');
// const Website = require('../models/WebsiteModel');

// exports.getPendingAds = async (req, res) => {
//   try {
//     const { ownerId } = req.params;  // Owner's ID from params

//     // Fetch the owner's websites, categories, and ad spaces
//     const websites = await Website.find({ ownerId });
//     const websiteIds = websites.map(website => website._id);

//     const categories = await AdCategory.find({ websiteId: { $in: websiteIds } });
//     const categoryIds = categories.map(category => category._id);

//     const adSpaces = await AdSpace.find({ categoryId: { $in: categoryIds } });
//     const adSpaceIds = adSpaces.map(space => space._id);

//     // Fetch pending ads that belong to the owner's ad spaces
//     const pendingAds = await ImportAd.find({
//       approved: false,
//       selectedSpaces: { $in: adSpaceIds }
//     }).populate('selectedSpaces selectedCategories selectedWebsites');

//     res.status(200).json(pendingAds);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching pending ads' });
//   }
// };

// exports.approveAd = async (req, res) => {
//   try {
//     const { adId } = req.params;
//     const updatedAd = await ImportAd.findByIdAndUpdate(adId, { approved: true }, { new: true });

//     if (!updatedAd) {
//       return res.status(404).json({ message: 'Ad not found' });
//     }

//     res.status(200).json({ message: 'Ad approved successfully', ad: updatedAd });
//   } catch (error) {
//     res.status(500).json({ message: 'Error approving ad' });
//   }
// };

// exports.getApprovedAds = async (req, res) => {
//   try {
//     const approvedAds = await ImportAd.find({ approved: true })
//       .populate('selectedSpaces selectedWebsites selectedCategories');

//     res.status(200).json(approvedAds);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching approved ads' });
//   }
// };

// exports.getApprovedAdsByUser = async (req, res) => {
//   try {
//     const { ownerId } = req.params;  // Owner's ID from params

//     // Fetch the owner's websites, categories, and ad spaces
//     const websites = await Website.find({ ownerId });
//     const websiteIds = websites.map(website => website._id);

//     const categories = await AdCategory.find({ websiteId: { $in: websiteIds } });
//     const categoryIds = categories.map(category => category._id);

//     const adSpaces = await AdSpace.find({ categoryId: { $in: categoryIds } });
//     const adSpaceIds = adSpaces.map(space => space._id);

//     // Fetch approved ads that belong to the owner's ad spaces
//     const approvedAds = await ImportAd.find({
//       approved: true,
//       selectedSpaces: { $in: adSpaceIds }
//     }).populate('selectedSpaces selectedCategories selectedWebsites');

//     res.status(200).json(approvedAds);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching approved ads' });
//   }
// };


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

    const approvedAd = await ImportAd.findByIdAndUpdate(
      adId,
      { approved: true },
      { new: true }
    ).populate('userId');

    if (!approvedAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Notify the ad owner (you might replace this with an actual email service or notification)
    console.log(`Notification: Ad for ${approvedAd.businessName} has been approved. Awaiting confirmation from the ad owner.`);

    res.status(200).json({ message: 'Ad approved and notification sent to ad owner' });

  } catch (error) {
    console.error('Error approving ad:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getApprovedAdsAwaitingConfirmation = async (req, res) => {
  const { userId } = req.params;
  try {
    const allAds = await ImportAd.find({});
    allAds.forEach(ad => console.log(`Ad ID: ${ad._id}, User ID: ${ad.userId}, Approved: ${ad.approved}, Confirmed: ${ad.confirmed}`));
    
    const approvedAds = await ImportAd.find({ userId, approved: true, confirmed: false });
    console.log('Filtered Ads awaiting confirmation:', approvedAds); // Log the ads found
    
    res.status(200).json(approvedAds);
  } catch (error) {
    console.error('Error fetching approved ads awaiting confirmation:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.confirmAdDisplay = async (req, res) => {
  try {
    const { adId } = req.params;

    const confirmedAd = await ImportAd.findByIdAndUpdate(
      adId,
      { confirmed: true },
      { new: true }
    );

    if (!confirmedAd) {
      return res.status(404).json({ message: 'Ad not found or already confirmed' });
    }

    // Update the ad to be pushed to the selected ad spaces' APIs
    const adSpaces = await AdSpace.find({ _id: { $in: confirmedAd.selectedSpaces } });

    adSpaces.forEach(space => {
      console.log(`Notification: Ad is now live on the API endpoint for space ID: ${space._id}`);
      // Optionally, push to the actual API code or endpoint here if needed
    });

    res.status(200).json({ message: 'Ad confirmed and now live on selected spaces' });
  } catch (error) {
    console.error('Error confirming ad display:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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
