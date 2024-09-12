

// // ImportAdController.js
// const ImportAd = require('../models/ImportAdModel');
// const multer = require('multer');
// const sharp = require('sharp');
// const path = require('path');
// const fs = require('fs');

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
//       categories,
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
//     });

//     const savedImportAd = await newImportAd.save();
//     res.status(201).json({
//       message: 'Ad successfully uploaded and stored',
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// }];

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


const Flutterwave = require('flutterwave-node-v3');
const ImportAd = require('../models/ImportAdModel');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Initialize Flutterwave
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Multer storage
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
    const { userId, businessName, businessLocation, adDescription, templateType, categories } = req.body;

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

    // Create an ad object but do not save it yet
    req.adData = {
      userId,
      businessName,
      businessLocation,
      adDescription,
      templateType,
      categories,
      imageUrl,
      pdfUrl,
      videoUrl
    };

    // Proceed to initiate payment
    res.status(200).json({ message: 'Ad prepared successfully, ready for payment' });
  } catch (error) {
    console.error('Error preparing ad:', error);
    res.status(500).json({ message: 'Error preparing ad' });
  }
}];

exports.initiatePayment = async (req, res) => {
  try {
    const { userId, businessName, businessLocation, adDescription, templateType, categories, amount, currency, email, phoneNumber } = req.body;

    if (!businessName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const tx_ref = 'LEDOST-' + Date.now(); // Generate a transaction reference

    // Prepare payment payload for Flutterwave
    const paymentPayload = {
      tx_ref: tx_ref,
      amount: amount,
      currency: currency,
      redirect_url: 'http://localhost:5000/api/importAds/callback', // This URL handles payment status
      customer: {
        email: email || 'no-email@example.com',
        phonenumber: phoneNumber,
        name: businessName
      },
      payment_options: 'card,banktransfer',
      customizations: {
        title: 'Ad Payment',
        description: 'Payment for your advertisement placement',
      }
    };

    // Make the API request to Flutterwave
    const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayload, {
      headers: {
        'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if the payment link was successfully generated
    if (response.data && response.data.data && response.data.data.link) {
      // Store the ad data temporarily in the request for the callback
      req.body.paymentRef = tx_ref;
      req.body.paymentStatus = 'pending';

      // Send the payment link to the client
      res.status(200).json({ paymentLink: response.data.data.link });
    } else {
      res.status(500).json({ message: 'Payment initiation failed' });
    }
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ message: 'Error initiating payment' });
  }
};

exports.paymentCallback = async (req, res) => {
  try {
    const tx_ref = req.query.tx_ref;
    const transactionId = req.query.transaction_id;

    // Verify the payment status with Flutterwave using the Transaction ID
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: {
        'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
      }
    });

    if (response.data.status === 'success' && response.data.data.status === 'successful') {
      // Save the ad data in the database if payment is successful
      const newAd = new ImportAd({
        ...req.adData, // Use the ad data stored in the request
        paymentStatus: 'successful',
        paymentRef: tx_ref
      });

      await newAd.save();

      // Redirect to a success page or send a success response
      res.redirect('/success-page');
    } else {
      // Handle payment failure
      res.redirect('/error-page');
    }
  } catch (error) {
    console.error('Error in payment callback:', error);
    res.redirect('/error-page');
  }
};

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
