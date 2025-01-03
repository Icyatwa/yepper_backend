// AdDisplayController.js
const AdSpace = require('../models/AdSpaceModel');
const ImportAd = require('../models/ImportAdModel');

// exports.displayAd = async (req, res) => {
//   try {
//     const { space, website, category } = req.query;
//     const adSpace = await AdSpace.findById(space).populate({
//       path: 'selectedAds',
//       match: { approved: true, confirmed: true }, // Only retrieve ads that are both approved and confirmed
//     });

//     if (!adSpace || adSpace.selectedAds.length === 0) {
//       return res.status(404).send('No ads available for this space');
//     }

//     const currentDate = new Date();
//     const { startDate, endDate, availability } = adSpace;
//     if (
//       (availability === 'Reserved for future date' || availability === 'Pick a date') &&
//       (currentDate < new Date(startDate) || currentDate > new Date(endDate))
//     ) {
//       return res.status(403).send('Ad is not available during this time period.');
//     }

//     const userCount = adSpace.userCount;
//     const adsToShow = adSpace.selectedAds.slice(0, userCount);
//     const adsHtml = adsToShow
//       .map((selectedAd) => {
//         const imageUrl = selectedAd.imageUrl ? `http://localhost:5000${selectedAd.imageUrl}` : '';
//         return `
//           <div class="ad">
//             ${imageUrl ? `<img src="${imageUrl}" alt="Ad Image">` : ''}
//             ${selectedAd.pdfUrl ? `<a href="${selectedAd.pdfUrl}" target="_blank">Download PDF</a>` : ''}
//             ${selectedAd.videoUrl ? `<video src="${selectedAd.videoUrl}" controls></video>` : ''}
//           </div>
//         `;
//       })
//       .join('');

//     res.status(200).send(adsHtml);
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// };

exports.displayAd = async (req, res) => {
  try {
    const { space, website, category } = req.query;
    const adSpace = await AdSpace.findById(space).populate({
      path: 'selectedAds',
      match: { approved: true, confirmed: true }, // Only retrieve ads that are both approved and confirmed
    });

    const currentDate = new Date();
    const { startDate, endDate, availability } = adSpace;
    if (
      (availability === 'Reserved for future date' || availability === 'Pick a date') &&
      (currentDate < new Date(startDate) || currentDate > new Date(endDate))
    ) {
      return res.status(403).send('Ad is not available during this time period.');
    }

    const userCount = adSpace.userCount;
    const adsToShow = adSpace.selectedAds.slice(0, userCount);

    // const adsHtml = adsToShow
    //   .map((selectedAd) => {
    //     const imageUrl = selectedAd.imageUrl ? `http://localhost:5000${selectedAd.imageUrl}` : '';
    //     const targetUrl = selectedAd.businessLink.startsWith('http') ? selectedAd.businessLink : `https://${selectedAd.businessLink}`;
    //     return `
    //       <a href="${targetUrl}" target="_blank" class="ad">
    //         ${imageUrl ? `<img src="${imageUrl}" alt="Ad Image">` : ''}
    //         ${selectedAd.pdfUrl ? `<a href="${selectedAd.pdfUrl}" target="_blank">Download PDF</a>` : ''}
    //         ${selectedAd.videoUrl ? `<video src="${selectedAd.videoUrl}" controls></video>` : ''}
    //       </a>
    //     `;
    //   })
    // .join('');

    const adsHtml = adsToShow
      .map((selectedAd) => {
        const imageUrl = selectedAd.imageUrl ? `https://yepper-backend.onrender.com${selectedAd.imageUrl}` : '';
        const targetUrl = selectedAd.businessLink.startsWith('http') ? selectedAd.businessLink : `https://${selectedAd.businessLink}`;
        return `
          <a href="${targetUrl}" target="_blank" class="ad" data-ad-id="${selectedAd._id}">
            ${imageUrl ? `<img src="${imageUrl}" alt="Ad Image">` : ''}
            ${selectedAd.pdfUrl ? `<a href="${selectedAd.pdfUrl}" target="_blank">Download PDF</a>` : ''}
            ${selectedAd.videoUrl ? `<video src="${selectedAd.videoUrl}" controls></video>` : ''}
          </a>
        `;
      })
      .join('');

    res.status(200).send(adsHtml);
  } catch (error) {
    console.error('Error displaying ads:', error);
    res.status(500).send('Error displaying ads');
  }
};

exports.incrementView = async (req, res) => {
  try {
    const { adId } = req.body;  // Capture ad ID from request
    await ImportAd.findByIdAndUpdate(adId, { $inc: { views: 1 } });
    res.status(200).send('View recorded');
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).send('Failed to record view');
  }
};

// Increment click count when an ad is clicked
exports.incrementClick = async (req, res) => {
  try {
    const { adId } = req.body;  // Capture ad ID from request
    await ImportAd.findByIdAndUpdate(adId, { $inc: { clicks: 1 } });
    res.status(200).send('Click recorded');
  } catch (error) {
    console.error('Error recording click:', error);
    res.status(500).send('Failed to record click');
  }
};