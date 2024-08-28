
const ImportAd = require('../models/ImportAdModel');

exports.getAdEmbed = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await ImportAd.findById(adId);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Generate the ad code snippet based on the template
    let adCode = '';
    switch (ad.templateType) {
      case 'banner':
        adCode = `<a href="${ad.businessLocation}" target="_blank"><img src="${ad.imageUrl}" alt="Ad" style="width:100%; height:auto;"/></a>`;
        break;
      case 'popup':
        adCode = `<div style="position:fixed; top:10%; left:10%;"><a href="${ad.businessLocation}" target="_blank"><img src="${ad.imageUrl}" alt="Ad" style="width:300px; height:300px;"/></a></div>`;
        break;
      case 'popdown':
        adCode = `<div style="position:fixed; bottom:10px; width:100%; text-align:center;"><a href="${ad.businessLocation}" target="_blank"><img src="${ad.imageUrl}" alt="Ad" style="width:728px; height:90px;"/></a></div>`;
        break;
      case 'sidebar':
        adCode = `<div style="position:fixed; right:0; top:10%;"><a href="${ad.businessLocation}" target="_blank"><img src="${ad.imageUrl}" alt="Ad" style="width:300px; height:600px;"/></a></div>`;
        break;
      default:
        adCode = `<a href="${ad.businessLocation}" target="_blank"><img src="${ad.imageUrl}" alt="Ad" style="width:100%; height:auto;"/></a>`;
        break;
    }

    res.status(200).json({ adCode });
  } catch (error) {
    console.error('Error generating embed code:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
