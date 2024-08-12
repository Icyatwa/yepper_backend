// controllers/AdController.js

const ImportAd = require('../models/ImportAdModel');
const AdClick = require('../models/AdClickModel');

exports.getRandomAd = async (req, res) => {
  try {
    const ad = await ImportAd.aggregate([{ $sample: { size: 1 } }]);
    if (ad.length > 0) {
      const selectedAd = ad[0];
      const trackingUrl = `http://localhost:5000/api/track/click/${selectedAd._id}?website=${req.headers.host}`;
      res.status(200).json({
        imageUrl: `http://localhost:5000${selectedAd.imageUrl}`,
        trackingUrl: trackingUrl,
      });
    } else {
      res.status(404).json({ message: 'No ads available' });
    }
  } catch (error) {
    console.error('Error fetching random ad:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.trackClick = async (req, res) => {
  try {
    const { adId } = req.params;
    const { website } = req.query;

    await AdClick.create({ adId, website });

    const ad = await ImportAd.findById(adId);
    if (ad) {
      res.redirect(ad.businessLocation);
    } else {
      res.status(404).json({ message: 'Ad not found' });
    }
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
