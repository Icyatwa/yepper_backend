// AdSpaceModel.js
const mongoose = require('mongoose');

const adSpaceSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory', required: true },
  spaceType: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  availability: { type: Boolean, default: true },
  userCount: { type: Number, default: 0 },
  instructions: { type: String },
  apiCodes: {
    HTML: { type: String },
    JavaScript: { type: String },
    PHP: { type: String },
    Python: { type: String },
  },
  selectedAds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImportAd' }],  // Added selectedAds reference
  createdAt: { type: Date, default: Date.now }
});

// ImportAdModel.js
const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },
  businessName: { type: String, required: true },
  businessLocation: { type: String, required: true },
  adDescription: { type: String, required: true },
  selectedWebsites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Website' }],
  selectedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory' }],
  selectedSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdSpace' }]
});

// AdSpaceController.js
const generateApiCodesForAllLanguages = (spaceId, websiteId, categoryId) => {
  const apiUrl = `http://localhost:5000/api/ads/display?space=${spaceId}&website=${websiteId}&category=${categoryId}`;
  
  const apiCodes = {
    HTML: `<script src="${apiUrl}"></script>`,
    JavaScript: `<script>
                  (function() {
                    var ad = document.createElement('script');
                    ad.src = "${apiUrl}";
                    document.getElementById("${spaceId}-ad").appendChild(ad);
                  })();
                </script>`,
    PHP: `<?php echo '<div id="${spaceId}-ad"><script src="${apiUrl}"></script></div>'; ?>`,
    Python: `print('<div id="${spaceId}-ad"><script src="${apiUrl}"></script></div>')`
  };

  return apiCodes;
};

exports.createSpace = async (req, res) => {
  try {
    const { categoryId, spaceType, price, availability, userCount, instructions } = req.body;

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
      instructions
    });
    const savedSpace = await newSpace.save();

    // Generate API codes
    const apiCodes = generateApiCodesForAllLanguages(savedSpace._id, websiteId, categoryId);
    savedSpace.apiCodes = apiCodes;
    await savedSpace.save();

    res.status(201).json(savedSpace);
  } catch (error) {
    console.error('Error saving ad space:', error);
    res.status(500).json({ message: 'Failed to create ad space', error });
  }
};

// ImportAdController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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
      selectedWebsites,
      selectedCategories,
      selectedSpaces
    } = req.body;

    // Parse JSON strings
    const websitesArray = JSON.parse(selectedWebsites);
    const categoriesArray = JSON.parse(selectedCategories);
    const spacesArray = JSON.parse(selectedSpaces);

    let imageUrl = '';
    let pdfUrl = '';
    let videoUrl = '';

    // Process uploaded file
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(__dirname, '../uploads', fileName);

      if (req.file.mimetype.startsWith('image')) {
        await sharp(req.file.buffer).resize(300, 300).toFile(filePath);
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

    // Create ImportAd entry
    const newRequestAd = new ImportAd({
      userId,
      imageUrl,
      pdfUrl,
      videoUrl,
      businessName,
      businessLocation,
      adDescription,
      selectedWebsites: websitesArray,
      selectedCategories: categoriesArray,
      selectedSpaces: spacesArray
    });

    const savedRequestAd = await newRequestAd.save();
    
    // Push this ad to the selected spaces
    await AdSpace.updateMany(
      { _id: { $in: spacesArray } }, 
      { $push: { selectedAds: savedRequestAd._id } }
    );

    res.status(201).json(savedRequestAd);
  } catch (error) {
    console.error('Error importing ad:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}];

// AdDisplayController.js
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

// page for testing
<html lang="en">
<body>
  <h1>Ad Display Test</h1>
  <div id="banner-ad"></div>
  <div id="ad-container"></div>
  <script>
    const fetchAds = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/ads/display?space=670021c7f37a56a35eec74ec&website=670021aaf37a56a35eec74e0&category=670021b2f37a56a35eec74e8');
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
  
        const adsHtml = await response.text(); // Get the HTML content
        document.getElementById('ad-container').innerHTML = adsHtml;
  
        // Initialize ad rotation only if ads were successfully loaded
        const ads = document.querySelectorAll('#ad-container .ad');
        if (ads.length === 0) {
          console.error('No ads found in the ad container');
          document.getElementById('ad-container').innerHTML = '<p>No ads to display</p>';
        } else {
          console.log(`Loaded ${ads.length} ads`);
          rotateAds(); // Start rotating ads
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
        document.getElementById('ad-container').innerHTML = `<p>Error fetching ads: ${error.message}</p>`;
      }
    };
  
    const rotateAds = () => {
      const ads = document.querySelectorAll('#ad-container .ad');
      let currentIndex = 0;
      
      if (ads.length > 0) {
        ads.forEach((ad, index) => ad.style.display = index === 0 ? 'block' : 'none'); // Show first ad
  
        setInterval(() => {
          ads[currentIndex].style.display = 'none'; // Hide current ad
          currentIndex = (currentIndex + 1) % ads.length; // Move to the next ad
          ads[currentIndex].style.display = 'block'; // Show the next ad
        }, 5000); // Rotate every 5 seconds
      }
    };
  
    // Load ads on page load
    fetchAds();
  </script>
</body>
</html>

the number of ads that appears in the api must depend on a user count number that was set, and if it's more than one the ads must appear one after another smoothly each 5 seconds