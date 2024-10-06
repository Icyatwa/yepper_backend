// AdDisplayController.js
const AdSpace = require('../models/AdSpaceModel');
const ImportAd = require('../models/ImportAdModel');

exports.displayAd = async (req, res) => {
  try {
    const { space, website, category } = req.query;

    // Find the ad space and populate selectedAds
    const adSpace = await AdSpace.findById(space).populate('selectedAds');

    if (!adSpace || adSpace.selectedAds.length === 0) {
      return res.status(404).send('No ads available for this space');
    }

    const userCount = adSpace.userCount; // Get the userCount to determine how many ads to show
    const adsToShow = adSpace.selectedAds.slice(0, userCount); // Limit the ads based on userCount

    // Construct the HTML for all selected ads
    const adsHtml = adsToShow.map(selectedAd => {
      const imageUrl = selectedAd.imageUrl ? `http://localhost:5000${selectedAd.imageUrl}` : '';
      return `
        <div class="ad">
          <h3>${selectedAd.businessName}</h3>
          <p>${selectedAd.adDescription}</p>
          ${imageUrl ? `<img src="${imageUrl}" alt="Ad Image">` : ''}
          ${selectedAd.pdfUrl ? `<a href="${selectedAd.pdfUrl}" target="_blank">Download PDF</a>` : ''}
          ${selectedAd.videoUrl ? `<video src="${selectedAd.videoUrl}" controls></video>` : ''}
        </div>
      `;
    }).join(''); // Join ads to form a complete HTML string

    // Return the ads HTML
    res.status(200).send(adsHtml);
  } catch (error) {
    console.error('Error displaying ad:', error);
    res.status(500).send('Failed to load ad');
  }
};
