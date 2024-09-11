// ImportAdController.js
const ImportAd = require('../models/ImportAdModel');
const Website = require('../models/WebsiteModel');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|pdf|mp4/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

exports.createImportAd = [upload.single('file'), async (req, res) => {
  try {
    const {
      userId,
      businessName,
      businessLocation,
      adDescription,
      templateType,
      categories,  // Expect this array directly from the form data
    } = req.body;

    let imageUrl = '';
    let pdfUrl = '';
    let videoUrl = '';

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(__dirname, '../uploads', fileName);

      if (req.file.mimetype.startsWith('image')) {
        await sharp(req.file.buffer)
          .resize(300, 300)
          .toFile(filePath);
        imageUrl = `/uploads/${fileName}`;
      } else {
        await fs.promises.writeFile(filePath, req.file.buffer);
        if (req.file.mimetype === 'application/pdf') {
          pdfUrl = `/uploads/${fileName}`;
        } else if (req.file.mimetype.startsWith('video')) {
          videoUrl = `/uploads/${fileName}`;
        }
      }
    }

    const newImportAd = new ImportAd({
      userId,
      imageUrl,
      pdfUrl,
      videoUrl,
      categories,  // Save the array of categories directly
      businessName,
      businessLocation,
      adDescription,
      templateType,
    });

    const savedImportAd = await newImportAd.save();
    res.status(201).json(savedImportAd);
  } catch (error) {
    console.error('MongoDB Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}];

// exports.createImportAd = [upload.single('file'), async (req, res) => {
//   try {
//     const {
//       userId,
//       businessName,
//       businessLocation,
//       adDescription,
//       templateType,
//       categories,
//       websiteIds  // Expect this to be an array of website IDs
//     } = req.body;

//     let imageUrl = '';
//     let pdfUrl = '';
//     let videoUrl = '';

//     if (req.file) {
//       const fileName = `${Date.now()}-${req.file.originalname}`;
//       const filePath = path.join(__dirname, '../uploads', fileName);

//       if (req.file.mimetype.startsWith('image')) {
//         await sharp(req.file.buffer)
//           .resize(300, 300)
//           .toFile(filePath);
//         imageUrl = `/uploads/${fileName}`;
//       } else {
//         await fs.promises.writeFile(filePath, req.file.buffer);
//         if (req.file.mimetype === 'application/pdf') {
//           pdfUrl = `/uploads/${fileName}`;
//         } else if (req.file.mimetype.startsWith('video')) {
//           videoUrl = `/uploads/${fileName}`;
//         }
//       }
//     }

//     const newImportAd = new ImportAd({
//       userId,
//       imageUrl,
//       pdfUrl,
//       videoUrl,
//       categories,
//       businessName,
//       businessLocation,
//       adDescription,
//       templateType,
//       websites: websiteIds  // Save the website references here
//     });

//     const savedImportAd = await newImportAd.save();
//     res.status(201).json(savedImportAd);
//   } catch (error) {
//     console.error('MongoDB Error:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// }];

exports.getAdById = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await ImportAd.findById(id);

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;  // Get the base URL of the server

    const template = `
      <div class="${ad.templateType}">
        ${ad.imageUrl ? `<img src="${baseUrl}${ad.imageUrl}" alt="Ad Image"/>` : ''}
        ${ad.pdfUrl ? `<a href="${baseUrl}${ad.pdfUrl}" target="_blank">View PDF</a>` : ''}
        ${ad.videoUrl ? `<video controls src="${baseUrl}${ad.videoUrl}"></video>` : ''}
        <p>${ad.adDescription}</p>
      </div>
      <style>
        ${generateTemplateStyles(ad.templateType)}
      </style>
    `;

    const scriptContent = `
      document.write(\`${template}\`);
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(scriptContent);
  } catch (error) {
    console.error('MongoDB Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// exports.getAdById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const ad = await ImportAd.findById(id).populate('websites');

//     if (!ad) {
//       return res.status(404).json({ message: 'Ad not found' });
//     }

//     const baseUrl = `${req.protocol}://${req.get('host')}`;

//     const websitesHtml = ad.websites.map(website => `
//       <div class="website">
//         <img src="${baseUrl}${website.logoUrl}" alt="${website.name} logo" />
//         <a href="${website.link}" target="_blank">${website.name}</a>
//       </div>
//     `).join('');

//     const template = `
//       <div class="${ad.templateType}">
//         ${ad.imageUrl ? `<img src="${baseUrl}${ad.imageUrl}" alt="Ad Image"/>` : ''}
//         ${ad.pdfUrl ? `<a href="${baseUrl}${ad.pdfUrl}" target="_blank">View PDF</a>` : ''}
//         ${ad.videoUrl ? `<video controls src="${baseUrl}${ad.videoUrl}"></video>` : ''}
//         <p>${ad.adDescription}</p>
//         ${websitesHtml}  <!-- Include the websites advertising the ad -->
//       </div>
//       <style>
//         ${generateTemplateStyles(ad.templateType)}
//         .website {
//           margin-top: 15px;
//           display: flex;
//           align-items: center;
//         }
//         .website img {
//           max-height: 30px;
//           margin-right: 10px;
//         }
//         .website a {
//           color: #007BFF;
//           text-decoration: none;
//         }
//       </style>
//     `;

//     const scriptContent = `
//       document.write(\`${template}\`);
//     `;

//     res.setHeader('Content-Type', 'application/javascript');
//     res.send(scriptContent);
//   } catch (error) {
//     console.error('MongoDB Error:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

function generateTemplateStyles(templateType) {
  switch (templateType) {
    case 'banner':
      return `
        .banner {
          height: 150px;
          border: 2px solid #ddd;
          background-color: #f9f9f9;
          width: 100%;
          text-align: center;
          padding: 10px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .banner img {
          max-height: 100px;
          object-fit: contain;
        }
      `;
    case 'pop-up':
      return `
        .pop-up {
          width: 400px;
          height: 300px;
          border: 2px solid #4caf50;
          background-color: #e8f5e9;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
          padding: 20px;
          text-align: center;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .pop-up img {
          max-width: 100%;
          border-radius: 10px;
          margin-bottom: 15px;
        }
        .pop-up p {
          margin: 0;
        }
      `;
    case 'pop-down':
      return `
        .pop-down {
          height: 150px;
          border: 2px solid #f44336;
          background-color: #ffebee;
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          text-align: center;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
          padding: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .pop-down img {
          max-height: 100px;
          object-fit: contain;
          margin-bottom: 10px;
        }
      `;
    case 'sidebar':
      return `
        .sidebar {
          width: 300px;
          height: 600px;
          border: 2px solid #3f51b5;
          background-color: #e8eaf6;
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          padding: 15px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .sidebar img {
          max-width: 100%;
          border-radius: 10px;
          margin-bottom: 15px;
        }
      `;
    case 'fullscreen':
      return `
        .fullscreen {
          width: 100%;
          height: 100vh;
          color: #fff;
          position: fixed;
          top: 0;
          left: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          box-sizing: border-box;
          text-align: center;
          overflow: hidden;
        }
        .fullscreen img {
          max-width: 100%;
          max-height: 80%;
          border-radius: 10px;
          margin-bottom: 15px;
        }
        .fullscreen p {
          margin: 0;
          font-size: 1.5em;
        }
      `;
    default:
      return '';
  }
}

exports.getAllAds = async (req, res) => {
  try {
    const ads = await ImportAd.find();
    res.status(200).json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getAdByIds = async (req, res) => {
  const adId = req.params.id;  // Fixing the parameter name

  try {
      const ad = await ImportAd.findById(adId);
      if (!ad) {
          return res.status(404).json({ message: 'Ad not found' });
      }
      res.status(200).json(ad);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
}


exports.getAdsByUserId = async (req, res) => {
  const userId = req.params.userId;
  try {
    const ads = await ImportAd.find({ userId });
    if (!ads || ads.length === 0) {
      return res.status(404).json({ message: 'No ads found for this user' });
    }
    res.status(200).json(ads); // Send the ads array directly
  } catch (error) {
    console.error('Error fetching ad by user ID:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getAdsByUserIdWithClicks = async (req, res) => {
  const userId = req.params.userId;
  try {
    const ads = await ImportAd.find({ userId });
    for (const ad of ads) {
      const clicks = await AdClick.find({ adId: ad._id }).exec();
      ad.clicks = clicks.length;
      ad.websites = [...new Set(clicks.map(click => click.website))]; // Unique websites
    }
    res.status(200).json(ads);
  } catch (error) {
    console.error('Error fetching ads with clicks:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// // ImportAdController.js
// const ImportAd = require('../models/ImportAdModel');
// const multer = require('multer');
// const sharp = require('sharp');
// const path = require('path');
// const fs = require('fs');
// const axios = require('axios');

// const FLW_SECRET_KEY = 'YOUR_FLUTTERWAVE_SECRET_KEY';

// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const fileTypes = /jpeg|jpg|png|pdf|mp4/;
//     const mimeType = fileTypes.test(file.mimetype);
//     const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

//     if (mimeType && extname) {
//       return cb(null, true);
//     }
//     cb(new Error('Invalid file type'));
//   }
// });

// exports.createImportAd = [upload.single('file'), async (req, res) => {
//   try {
//     const {
//       userId,
//       businessName,
//       businessLocation,
//       adDescription,
//       templateType,
//       categories,  // Expect this array directly from the form data
//       transactionId // Flutterwave transaction ID passed from frontend
//     } = req.body;

//     // Step 1: Verify payment using Flutterwave's API
//     const paymentVerified = await verifyPayment(transactionId);
//     if (!paymentVerified) {
//       return res.status(400).json({ message: 'Payment not successful' });
//     }

//     let imageUrl = '';
//     let pdfUrl = '';
//     let videoUrl = '';

//     if (req.file) {
//       const fileName = `${Date.now()}-${req.file.originalname}`;
//       const filePath = path.join(__dirname, '../uploads', fileName);

//       if (req.file.mimetype.startsWith('image')) {
//         await sharp(req.file.buffer)
//           .resize(300, 300)
//           .toFile(filePath);
//         imageUrl = `/uploads/${fileName}`;
//       } else {
//         await fs.promises.writeFile(filePath, req.file.buffer);
//         if (req.file.mimetype === 'application/pdf') {
//           pdfUrl = `/uploads/${fileName}`;
//         } else if (req.file.mimetype.startsWith('video')) {
//           videoUrl = `/uploads/${fileName}`;
//         }
//       }
//     }

//     // Step 2: If payment is verified, store the ad data in the database
//     const newImportAd = new ImportAd({
//       userId,
//       imageUrl,
//       pdfUrl,
//       videoUrl,
//       categories,  // Save the array of categories directly
//       businessName,
//       businessLocation,
//       adDescription,
//       templateType,
//     });

//     const savedImportAd = await newImportAd.save();

//     // Redirect the user to the dashboard after successful storage
//     res.status(201).json({
//       message: 'Ad successfully uploaded and stored',
//       redirectUrl: '/basic-dash', // Redirect to basic dashboard after success
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// }];

// // Function to verify payment using Flutterwave
// async function verifyPayment(transactionId) {
//   try {
//     const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
//       headers: {
//         Authorization: `Bearer ${FLW_SECRET_KEY}`,
//       },
//     });

//     if (response.data.status === 'success' && response.data.data.status === 'successful') {
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('Error verifying payment:', error);
//     return false;
//   }
// }

// exports.getAdById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const ad = await ImportAd.findById(id);

//     if (!ad) {
//       return res.status(404).json({ message: 'Ad not found' });
//     }

//     const baseUrl = `${req.protocol}://${req.get('host')}`;  // Get the base URL of the server

//     const template = `
//       <div class="${ad.templateType}">
//         ${ad.imageUrl ? `<img src="${baseUrl}${ad.imageUrl}" alt="Ad Image"/>` : ''}
//         ${ad.pdfUrl ? `<a href="${baseUrl}${ad.pdfUrl}" target="_blank">View PDF</a>` : ''}
//         ${ad.videoUrl ? `<video controls src="${baseUrl}${ad.videoUrl}"></video>` : ''}
//         <p>${ad.adDescription}</p>
//       </div>
//       <style>
//         ${generateTemplateStyles(ad.templateType)}
//       </style>
//     `;

//     const scriptContent = `
//       document.write(\`${template}\`);
//     `;

//     res.setHeader('Content-Type', 'application/javascript');
//     res.send(scriptContent);
//   } catch (error) {
//     console.error('MongoDB Error:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// function generateTemplateStyles(templateType) {
//   switch (templateType) {
//     case 'banner':
//       return `
//         .banner {
//           height: 150px;
//           border: 2px solid #ddd;
//           background-color: #f9f9f9;
//           width: 100%;
//           text-align: center;
//           padding: 10px;
//           box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
//           margin-bottom: 20px;
//           display: flex;
//           justify-content: center;
//           align-items: center;
//         }
//         .banner img {
//           max-height: 100px;
//           object-fit: contain;
//         }
//       `;
//     case 'pop-up':
//       return `
//         .pop-up {
//           width: 400px;
//           height: 300px;
//           border: 2px solid #4caf50;
//           background-color: #e8f5e9;
//           position: fixed;
//           top: 50%;
//           left: 50%;
//           transform: translate(-50%, -50%);
//           z-index: 1000;
//           box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
//           padding: 20px;
//           text-align: center;
//           overflow: hidden;
//           display: flex;
//           flex-direction: column;
//           justify-content: center;
//           align-items: center;
//         }
//         .pop-up img {
//           max-width: 100%;
//           border-radius: 10px;
//           margin-bottom: 15px;
//         }
//         .pop-up p {
//           margin: 0;
//         }
//       `;
//     case 'pop-down':
//       return `
//         .pop-down {
//           height: 150px;
//           border: 2px solid #f44336;
//           background-color: #ffebee;
//           position: fixed;
//           bottom: 0;
//           left: 0;
//           width: 100%;
//           text-align: center;
//           box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
//           padding: 10px;
//           display: flex;
//           justify-content: center;
//           align-items: center;
//         }
//         .pop-down img {
//           max-height: 100px;
//           object-fit: contain;
//           margin-bottom: 10px;
//         }
//       `;
//     case 'sidebar':
//       return `
//         .sidebar {
//           width: 300px;
//           height: 600px;
//           border: 2px solid #3f51b5;
//           background-color: #e8eaf6;
//           position: fixed;
//           right: 0;
//           top: 50%;
//           transform: translateY(-50%);
//           padding: 15px;
//           box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
//           display: flex;
//           flex-direction: column;
//           justify-content: center;
//           align-items: center;
//         }
//         .sidebar img {
//           max-width: 100%;
//           border-radius: 10px;
//           margin-bottom: 15px;
//         }
//       `;
//     case 'fullscreen':
//       return `
//         .fullscreen {
//           width: 100%;
//           height: 100vh;
//           color: #fff;
//           position: fixed;
//           top: 0;
//           left: 0;
//           background-color: rgba(0, 0, 0, 0.7);
//           display: flex;
//           justify-content: center;
//           align-items: center;
//           padding: 20px;
//           box-sizing: border-box;
//           text-align: center;
//           overflow: hidden;
//         }
//         .fullscreen img {
//           max-width: 100%;
//           max-height: 80%;
//           border-radius: 10px;
//           margin-bottom: 15px;
//         }
//         .fullscreen p {
//           margin: 0;
//           font-size: 1.5em;
//         }
//       `;
//     default:
//       return '';
//   }
// }

// exports.getAllAds = async (req, res) => {
//   try {
//     const ads = await ImportAd.find();
//     res.status(200).json(ads);
//   } catch (error) {
//     console.error('Error fetching ads:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// exports.getAdByIds = async (req, res) => {
//   const adId = req.params.id;  // Fixing the parameter name

//   try {
//       const ad = await ImportAd.findById(adId);
//       if (!ad) {
//           return res.status(404).json({ message: 'Ad not found' });
//       }
//       res.status(200).json(ad);
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// }


// exports.getAdsByUserId = async (req, res) => {
//   const userId = req.params.userId;
//   try {
//     const ads = await ImportAd.find({ userId });
//     if (!ads || ads.length === 0) {
//       return res.status(404).json({ message: 'No ads found for this user' });
//     }
//     res.status(200).json(ads); // Send the ads array directly
//   } catch (error) {
//     console.error('Error fetching ad by user ID:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// exports.getAdsByUserIdWithClicks = async (req, res) => {
//   const userId = req.params.userId;
//   try {
//     const ads = await ImportAd.find({ userId });
//     for (const ad of ads) {
//       const clicks = await AdClick.find({ adId: ad._id }).exec();
//       ad.clicks = clicks.length;
//       ad.websites = [...new Set(clicks.map(click => click.website))]; // Unique websites
//     }
//     res.status(200).json(ads);
//   } catch (error) {
//     console.error('Error fetching ads with clicks:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };
