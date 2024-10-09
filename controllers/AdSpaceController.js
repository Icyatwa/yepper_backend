// // AdSpaceController.js
// const AdSpace = require('../models/AdSpaceModel');
// const AdCategory = require('../models/AdCategoryModel');
// const ImportAd = require('../models/ImportAdModel');

// const generateApiCodesForAllLanguages = (spaceId, websiteId, categoryId, startDate = null, endDate = null) => {
//   const apiUrl = `http://localhost:5000/api/ads/display?space=${spaceId}&website=${websiteId}&category=${categoryId}`;

//   const dateCheckScript = startDate && endDate
//     ? `
//       const now = new Date();
//       const start = new Date("${startDate}");
//       const end = new Date("${endDate}");
//       if (now >= start && now <= end) {
//         var ad = document.createElement('script');
//         ad.src = "${apiUrl}";
//         document.getElementById("${spaceId}-ad").appendChild(ad);
//       }
//     `
//     : `
//       var ad = document.createElement('script');
//       ad.src = "${apiUrl}";
//       document.getElementById("${spaceId}-ad").appendChild(ad);
//     `;

//   const apiCodes = {
//     HTML: `<script src="${apiUrl}"></script>`,
//     JavaScript: `<script>
//                   (function() {
//                     ${dateCheckScript}
//                   })();
//                 </script>`,
//     PHP: `<?php echo '<div id="${spaceId}-ad"><script src="${apiUrl}"></script></div>'; ?>`,
//     Python: `print('<div id="${spaceId}-ad"><script src="${apiUrl}"></script></div>')`,
//   };

//   return apiCodes;
// };

// exports.createSpace = async (req, res) => {
//   try {
//     const { categoryId, spaceType, price, availability, userCount, instructions, startDate, endDate } = req.body;

//     if (!categoryId || !spaceType || !price || !availability || !userCount) {
//       return res.status(400).json({ message: 'All required fields must be provided' });
//     }

//     // Retrieve website ID from the category
//     const category = await AdCategory.findById(categoryId).populate('websiteId');
//     if (!category) {
//       return res.status(404).json({ message: 'Category not found' });
//     }
//     const websiteId = category.websiteId._id;

//     // Create new AdSpace
//     const newSpace = new AdSpace({
//       categoryId,
//       spaceType,
//       price,
//       availability,
//       userCount,
//       instructions,
//       startDate,
//       endDate
//     });
//     const savedSpace = await newSpace.save();

//     // Generate API codes
//     const apiCodes = generateApiCodesForAllLanguages(savedSpace._id, websiteId, categoryId, startDate, endDate);
//     savedSpace.apiCodes = apiCodes;
//     await savedSpace.save();

//     res.status(201).json(savedSpace);
//   } catch (error) {
//     console.error('Error saving ad space:', error);
//     res.status(500).json({ message: 'Failed to create ad space', error });
//   }
// };

// exports.getAllSpaces = async (req, res) => {
//   try {
//     const spaces = await AdSpace.find()
//       .populate({
//         path: 'categoryId', 
//         populate: {
//           path: 'websiteId'  // Populate the websiteId inside the category
//         }
//       });  
//     res.status(200).json(spaces);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch all ad spaces', error });
//   }
// };

// exports.getSpaces = async (req, res) => {
//   try {
//     const spaces = await AdSpace.find({ categoryId: req.params.categoryId });
//     res.status(200).json(spaces);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch ad spaces', error });
//   }
// };

// exports.getAdContent = async (req, res) => {
//   try {
//     const { space, category } = req.query;

//     if (!space || !category) {
//       return res.status(400).send('Invalid space or category');
//     }

//     // Find all AdSpaces matching the spaceType and categoryId
//     const adSpaces = await AdSpace.find({ spaceType: space, categoryId: category });

//     if (!adSpaces || adSpaces.length === 0) {
//       return res.status(404).send('No ad spaces found');
//     }

//     // Find all ads that are linked to any of the ad spaces
//     const ads = await ImportAd.find({ selectedSpaces: { $in: adSpaces.map(space => space._id) } });

//     if (!ads || ads.length === 0) {
//       return res.status(404).send('No ads found for the selected space');
//     }

//     // Create ad elements for each ad
//     const adElements = ads.map(ad => {
//       let adContent = '';

//       if (ad.imageUrl) {
//         adContent += `<img src="${ad.imageUrl}" alt="${ad.businessName}" style="width:100%;height:auto;" />`;
//       }

//       if (ad.videoUrl) {
//         adContent += `<video controls style="width:100%;height:auto;"><source src="${ad.videoUrl}" type="video/mp4" /></video>`;
//       }

//       if (ad.pdfUrl) {
//         adContent += `<a href="${ad.pdfUrl}" target="_blank">${ad.businessName} Ad PDF</a>`;
//       }

//       return `<div class="ad" style="display:none;">${adContent}</div>`;
//     }).join('');

//     res.send(`
//       <div id="ad-container">${adElements}</div>
//       <script>
//         let ads = document.querySelectorAll('#ad-container .ad');
//         let currentIndex = 0;
//         if (ads.length > 0) {
//           ads[currentIndex].style.display = 'block';
//         }
//         setInterval(() => {
//           ads[currentIndex].style.display = 'none';
//           currentIndex = (currentIndex + 1) % ads.length;
//           ads[currentIndex].style.display = 'block';
//         }, 5000);
//       </script>
//     `);
//   } catch (error) {
//     console.error('Error fetching ad content:', error);
//     res.status(500).send('Internal Server Error');
//   }
// };


// AdSpaceController.js
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');
const ImportAd = require('../models/ImportAdModel');

const generateApiCodesForAllLanguages = (spaceId, websiteId, categoryId, startDate = null, endDate = null) => {
  const apiUrl = `http://localhost:5000/api/ads/display?space=${spaceId}&website=${websiteId}&category=${categoryId}`;

  const dateCheckScript = startDate && endDate
    ? `
      const now = new Date();
      const start = new Date("${startDate}");
      const end = new Date("${endDate}");
      if (now >= start && now <= end) {
        var ad = document.createElement('script');
        ad.src = "${apiUrl}";
        document.getElementById("${spaceId}-ad").appendChild(ad);
      }
    `
    : `
      var ad = document.createElement('script');
      ad.src = "${apiUrl}";
      document.getElementById("${spaceId}-ad").appendChild(ad);
    `;

  const apiCodes = {
    HTML: `<script src="${apiUrl}"></script>`,
    JavaScript: `<script>
                  (function() {
                    ${dateCheckScript}
                  })();
                </script>`,
    PHP: `<?php echo '<div id="${spaceId}-ad"><script src="${apiUrl}"></script></div>'; ?>`,
    Python: `print('<div id="${spaceId}-ad"><script src="${apiUrl}"></script></div>')`,
  };

  return apiCodes;
};

exports.createSpace = async (req, res) => {
  try {
    const { categoryId, spaceType, price, availability, userCount, instructions, startDate, endDate, webOwnerEmail } = req.body;

    if (!categoryId || !spaceType || !price || !availability || !userCount) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Retrieve website ID from the category
    const category = await AdCategory.findById(categoryId).populate('websiteId');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const websiteId = category.websiteId._id;

    // Create new AdSpace
    const newSpace = new AdSpace({
      categoryId,
      spaceType,
      price,
      availability,
      userCount,
      instructions,
      startDate,
      endDate,
      webOwnerEmail
    });
    const savedSpace = await newSpace.save();

    // Generate API codes
    const apiCodes = generateApiCodesForAllLanguages(savedSpace._id, websiteId, categoryId, startDate, endDate);
    savedSpace.apiCodes = apiCodes;
    await savedSpace.save();

    res.status(201).json(savedSpace);
  } catch (error) {
    console.error('Error saving ad space:', error);
    res.status(500).json({ message: 'Failed to create ad space', error });
  }
};

exports.getAllSpaces = async (req, res) => {
  try {
    const spaces = await AdSpace.find()
      .populate({
        path: 'categoryId', 
        populate: {
          path: 'websiteId'  // Populate the websiteId inside the category
        }
      });  
    res.status(200).json(spaces);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all ad spaces', error });
  }
};

exports.getSpaces = async (req, res) => {
  try {
    const spaces = await AdSpace.find({ categoryId: req.params.categoryId });
    res.status(200).json(spaces);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ad spaces', error });
  }
};

exports.getAdContent = async (req, res) => {
  try {
    const { space, category } = req.query;

    if (!space || !category) {
      return res.status(400).send('Invalid space or category');
    }

    // Find all AdSpaces matching the spaceType and categoryId
    const adSpaces = await AdSpace.find({ spaceType: space, categoryId: category });

    if (!adSpaces || adSpaces.length === 0) {
      return res.status(404).send('No ad spaces found');
    }

    // Find all ads that are linked to any of the ad spaces
    const ads = await ImportAd.find({ selectedSpaces: { $in: adSpaces.map(space => space._id) } });

    if (!ads || ads.length === 0) {
      return res.status(404).send('No ads found for the selected space');
    }

    // Create ad elements for each ad
    const adElements = ads.map(ad => {
      let adContent = '';

      if (ad.imageUrl) {
        adContent += `<img src="${ad.imageUrl}" alt="${ad.businessName}" style="width:100%;height:auto;" />`;
      }

      if (ad.videoUrl) {
        adContent += `<video controls style="width:100%;height:auto;"><source src="${ad.videoUrl}" type="video/mp4" /></video>`;
      }

      if (ad.pdfUrl) {
        adContent += `<a href="${ad.pdfUrl}" target="_blank">${ad.businessName} Ad PDF</a>`;
      }

      return `<div class="ad" style="display:none;">${adContent}</div>`;
    }).join('');

    res.send(`
      <div id="ad-container">${adElements}</div>
      <script>
        let ads = document.querySelectorAll('#ad-container .ad');
        let currentIndex = 0;
        if (ads.length > 0) {
          ads[currentIndex].style.display = 'block';
        }
        setInterval(() => {
          ads[currentIndex].style.display = 'none';
          currentIndex = (currentIndex + 1) % ads.length;
          ads[currentIndex].style.display = 'block';
        }, 5000);
      </script>
    `);
  } catch (error) {
    console.error('Error fetching ad content:', error);
    res.status(500).send('Internal Server Error');
  }
};
