// AdDisplayController.js
const AdSpace = require('../models/AdSpaceModel');
const ImportAd = require('../models/ImportAdModel');

// exports.displayAd = async (req, res) => {
//   try {
//     const { space, website, category } = req.query;

//     // Find the ad space and populate selectedAds
//     const adSpace = await AdSpace.findById(space).populate('selectedAds');

//     if (!adSpace || adSpace.selectedAds.length === 0) {
//       return res.status(404).send('No ads available for this space');
//     }

//     const selectedAd = adSpace.selectedAds[0]; // Display the first ad for simplicity

//     // Return the ad as HTML
//     res.status(200).send(`
//       <div class="ad">
//         <h3>${selectedAd.businessName}</h3>
//         <p>${selectedAd.adDescription}</p>
//         ${selectedAd.imageUrl ? `<img src="${selectedAd.imageUrl}" alt="Ad Image">` : ''}
//         ${selectedAd.pdfUrl ? `<a href="${selectedAd.pdfUrl}" target="_blank">Download PDF</a>` : ''}
//         ${selectedAd.videoUrl ? `<video src="${selectedAd.videoUrl}" controls></video>` : ''}
//       </div>
//     `);
//   } catch (error) {
//     console.error('Error displaying ad:', error);
//     res.status(500).send('Failed to load ad');
//   }
// };


exports.displayAd = async (req, res) => {
  try {
    const { space, website, category } = req.query;

    // Find the ad space and populate selectedAds
    const adSpace = await AdSpace.findById(space).populate('selectedAds');

    if (!adSpace || adSpace.selectedAds.length === 0) {
      return res.status(404).send('No ads available for this space');
    }

    const selectedAd = adSpace.selectedAds[0]; // Display the first ad for simplicity

    // Construct full image URL if it exists
    const imageUrl = selectedAd.imageUrl ? `http://localhost:5000${selectedAd.imageUrl}` : '';

    // Return the ad as HTML
    res.status(200).send(`
      <div class="ad">
        <h3>${selectedAd.businessName}</h3>
        <p>${selectedAd.adDescription}</p>
        ${imageUrl ? `<img src="${imageUrl}" alt="Ad Image">` : ''}
        ${selectedAd.pdfUrl ? `<a href="${selectedAd.pdfUrl}" target="_blank">Download PDF</a>` : ''}
        ${selectedAd.videoUrl ? `<video src="${selectedAd.videoUrl}" controls></video>` : ''}
      </div>
    `);
  } catch (error) {
    console.error('Error displaying ad:', error);
    res.status(500).send('Failed to load ad');
  }
};
