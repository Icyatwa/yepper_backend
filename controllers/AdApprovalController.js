// AdApprovalController.js
const ImportAd = require('../models/ImportAdModel');

// Route to get pending ads
exports.getPendingAds = async (req, res) => {
  try {
    const pendingAds = await ImportAd.find({ approved: false }).populate('selectedSpaces');
    res.status(200).json(pendingAds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending ads' });
  }
};

// Route to approve an ad
exports.approveAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const updatedAd = await ImportAd.findByIdAndUpdate(adId, { approved: true }, { new: true });

    if (!updatedAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    res.status(200).json({ message: 'Ad approved successfully', ad: updatedAd });
  } catch (error) {
    res.status(500).json({ message: 'Error approving ad' });
  }
};

exports.getApprovedAds = async (req, res) => {
  try {
    const approvedAds = await ImportAd.find({ approved: true })
      .populate('selectedSpaces')
      .populate('selectedWebsites')
      .populate('selectedCategories');

    res.status(200).json(approvedAds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved ads' });
  }
};
