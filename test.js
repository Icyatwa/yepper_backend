To achieve the functionality of advertising user ads on different websites and fetching data such as the websites they were advertised on and the number of clicks they received, you'll need to follow these steps:

1. Understanding the Process
Here’s an overview of how you can structure this:

User Ad Submission: Users will submit their ads (images, videos, PDFs) through your platform.
Ad Distribution: You will distribute these ads across a network of partner websites.
Tracking & Analytics: You’ll track the performance of these ads, specifically the websites where they were displayed and the number of clicks they received.
Dashboard Integration: This data will be fetched and displayed in the user's dashboard.
2. Set Up Ad Distribution on Partner Websites
A. Partner Websites Integration:
Reach Out to Partner Websites:

You need to collaborate with website owners who are willing to display ads on their sites.
You can set up agreements where these websites will use your ad distribution scripts to display ads.
Create an Ad Distribution Script:

Develop a JavaScript snippet that the partner websites can embed on their pages. This script will be responsible for fetching and displaying the ads.
Example of an ad distribution script:
javascript
Copy code
<script async src="https://yourdomain.com/ads-distribution.js"></script>
The script will dynamically load ads based on the user's targeting criteria and display them on the partner's website.
Ad Delivery via API:

Develop an API that the distribution script will call to retrieve the ads. The API will return ad details such as images, links, and tracking information.
Example API response:
json
Copy code
{
  "adId": "12345",
  "imageUrl": "https://yourdomain.com/ads/12345/image.jpg",
  "link": "https://adownerwebsite.com",
  "trackingUrl": "https://yourdomain.com/track/click/12345"
}
B. Click Tracking:
Set Up Click Tracking:

Each ad should have a unique tracking URL that records a click whenever a user interacts with the ad. This URL will redirect the user to the advertiser's website while logging the click.
Example of a tracking URL setup:
javascript
Copy code
// Redirect with click tracking
window.location.href = https://yourdomain.com/track/click/${adId}?redirect=https://adownerwebsite.com;
Track Clicks in Your Database:

Create a backend route that logs each click. This route will extract the adId from the tracking URL and store the click in your database.
Example:
javascript
Copy code
app.get('/track/click/:adId', (req, res) => {
  const { adId } = req.params;
  const redirectUrl = req.query.redirect;
  
  // Log the click
  db.collection('adClicks').insertOne({ adId, timestamp: new Date() });
  
  // Redirect to the ad owner's website
  res.redirect(redirectUrl);
});
3. Fetching and Displaying Data in the User Dashboard
A. Backend Setup for Fetching Data:
Create an API Endpoint to Fetch Ad Data:

Create a route in your backend that will return the details of ads, including the websites they were advertised on and the number of clicks they received.
Example:
javascript
Copy code
app.get('/api/user-ads/:userId', async (req, res) => {
  const { userId } = req.params;
  const ads = await db.collection('ads').find({ userId }).toArray();
  res.json(ads);
});
Calculate Clicks for Each Ad:

For each ad, query the adClicks collection to count the number of clicks and return this data along with the ad details.
Example:
javascript
Copy code
app.get('/api/user-ads/:userId', async (req, res) => {
  const { userId } = req.params;
  const ads = await db.collection('ads').find({ userId }).toArray();
  
  for (const ad of ads) {
    const clicks = await db.collection('adClicks').countDocuments({ adId: ad._id });
    ad.clicks = clicks;
  }
  
  res.json(ads);
});
B. Frontend Integration (React):
Display Ads and Click Data:
Modify your BasicDashboard component to display the list of ads along with the number of clicks and the websites they were advertised on.
Example:
javascript
Copy code
return (
  <div className="dashboard-container">
    {ads.length > 0 ? (
      ads.slice().reverse().map((ad) => (
        <div key={ad._id} className="ad-container">
          <img src={http://localhost:5000${ad.imageUrl}} alt="Ad Image" />
          <div>
            <label>Business Name: {ad.businessName}</label>
            <label>Location: {ad.businessLocation}</label>
            <label>Description: {ad.adDescription}</label>
            <label>Category: {ad.category}</label>
            <label>Clicks: {ad.clicks}</label>
            <label>Advertised On: {ad.websites.join(', ')}</label>
          </div>
        </div>
      ))
    ) : (
      <div className="no-ads">No ads available</div>
    )}
  </div>
);
4. Testing and Launch
Test the End-to-End Flow:

Ensure that ads are correctly distributed to partner websites.
Verify that clicks are tracked and logged accurately.
Confirm that data is correctly fetched and displayed in the user dashboard.
Optimize and Scale:

Optimize your ad distribution and tracking systems for performance.
As your platform grows, consider scaling your infrastructure to handle more ads, clicks, and data processing.
By following these steps, you'll be able to achieve a system where users can submit ads, have them advertised on partner websites, and track the performance of those ads within their dashboard.


create the full understandable codes


this was my database.js
// config/database.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

module.exports = connectDB;

this was my importAdsModel
const mongoose = require('mongoose');

const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },

  manufacturing: { type: Boolean },
  technology: { type: Boolean },
  agriculture: { type: Boolean },
  retail: { type: Boolean },
  services: { type: Boolean },
  hospitality: { type: Boolean },
  transportationAndLogistics: { type: Boolean },
  realEstate: { type: Boolean },
  
  businessName: { type: String, required: true },
  businessLocation: { type: String, required: true },
  adDescription: { type: String, required: true }
});

module.exports = mongoose.model('ImportAd', importAdSchema);


this was my importAdsController.js
const ImportAd = require('../models/ImportAdModel');
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
    } = req.body;
    
    const categories = ['manufacturing', 'technology', 'agriculture', 'retail', 'services', 'hospitality', 'transportationAndLogistics', 'realEstate'];
    const selectedCategory = categories.find(category => req.body[category]);

    let imageUrl = '';
    let pdfUrl = '';
    let videoUrl = '';

    if (req.file) {
      const fileName = ${Date.now()}-${req.file.originalname};
      const filePath = path.join(__dirname, '../uploads', fileName);

      if (req.file.mimetype.startsWith('image')) {
        await sharp(req.file.buffer)
          .resize(300, 300)
          .toFile(filePath);
        imageUrl = /uploads/${fileName};
      } else {
        await fs.promises.writeFile(filePath, req.file.buffer);
        if (req.file.mimetype === 'application/pdf') {
          pdfUrl = /uploads/${fileName};
        } else if (req.file.mimetype.startsWith('video')) {
          videoUrl = /uploads/${fileName};
        }
      }
    }

    const newImportAd = new ImportAd({
      userId,
      imageUrl,
      pdfUrl,
      videoUrl,
      [selectedCategory]: selectedCategory,
      businessName,
      businessLocation,
      adDescription,
    });

    const savedImportAd = await newImportAd.save();
    res.status(201).json(savedImportAd);
  } catch (error) {
    console.error('MongoDB Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}];

exports.getAllAds = async (req, res) => {
  try {
    const ads = await ImportAd.find();
    res.status(200).json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

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

this was my importAdsRoute.js
const express = require('express');
const router = express.Router();
const importAdController = require('../controllers/ImportAdController');

router.post('/', importAdController.createImportAd);
router.get('/', importAdController.getAllAds);
router.get('/ads/:userId', importAdController.getAdsByUserId);

module.exports = router;

and the server.js

// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const importAdRoutes = require('./routes/ImportAdRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/importAds', importAdRoutes);

const server = http.createServer(app);
const io = socketIo(server); 

module.exports.io = io;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(Server is running on port ${PORT});
    });
  })
  .catch((error) => {
    console.log(error);
  });

so continue with those functionalities you're writing