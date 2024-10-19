// AdSpaceController.js
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');
const ImportAd = require('../models/ImportAdModel');

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

// ImportAdModel.js
const mongoose = require('mongoose');
const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },
  businessName: { type: String, required: true },
  businessLocation: { type: String, required: true },
  adDescription: { type: String, required: true },
  selectedWebsites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Website' }],
  selectedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory' }],
  selectedSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdSpace' }],
  approved: { type: Boolean, default: false },
});

// ImportAdController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');

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

    // Get the ad spaces that the ad owner selected
    const adSpaces = await AdSpace.find({ _id: { $in: spacesArray } });

    // Push this ad to the selected spaces
    await AdSpace.updateMany(
      { _id: { $in: spacesArray } }, 
      { $push: { selectedAds: savedRequestAd._id } }
    );

    // Notify each web owner via email
    for (const space of adSpaces) {
      const emailBody = `
        <h2>New Ad Request for Your Ad Space</h2>
        <p>Hello,</p>
        <p>An advertiser has selected your ad space. Please review and approve the ad.</p>
        <p><strong>Business Name:</strong> ${businessName}</p>
        <p><strong>Description:</strong> ${adDescription}</p>
      `;
      await sendEmailNotification(space.webOwnerEmail, 'New Ad Request for Your Space', emailBody);
    }

    res.status(201).json(savedRequestAd);
  } catch (error) {
    console.error('Error importing ad:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}];

// AdApprovalController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');
const Website = require('../models/WebsiteModel');

exports.getPendingAds = async (req, res) => {
  try {
    const { ownerId } = req.params;  // Owner's ID from params

    // Fetch the owner's websites, categories, and ad spaces
    const websites = await Website.find({ ownerId });
    const websiteIds = websites.map(website => website._id);

    const categories = await AdCategory.find({ websiteId: { $in: websiteIds } });
    const categoryIds = categories.map(category => category._id);

    const adSpaces = await AdSpace.find({ categoryId: { $in: categoryIds } });
    const adSpaceIds = adSpaces.map(space => space._id);

    // Fetch pending ads that belong to the owner's ad spaces
    const pendingAds = await ImportAd.find({
      approved: false,
      selectedSpaces: { $in: adSpaceIds }
    }).populate('selectedSpaces selectedCategories selectedWebsites');

    res.status(200).json(pendingAds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending ads' });
  }
};

exports.approveAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const updatedAd = await ImportAd.findByIdAndUpdate(adId, { approved: true }, { new: true });

    if (!updatedAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    res.status(200).json({ message: 'Ad approved successfully', ad: updatedAd });
  } catch (error) {
    res.status(500).json({ message: 'Error approving ad' });
  }
};

exports.getApprovedAdsByUser = async (req, res) => {
  try {
    const { userId } = req.params;  // Assuming userId is passed in the request params
    const approvedAds = await ImportAd.find({ approved: true, approvedBy: userId })
      .populate('selectedSpaces selectedWebsites selectedCategories');

    if (!approvedAds || approvedAds.length === 0) {
      return res.status(404).json({ message: 'No approved ads found for this user' });
    }

    res.status(200).json(approvedAds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved ads' });
  }
};

// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');
const importAdRoutes = require('./routes/ImportAdRoutes');
const requestAdRoutes = require('./routes/RequestAdRoutes');
const websiteRoutes = require('./routes/WebsiteRoutes');
const adCategoryRoutes = require('./routes/AdCategoryRoutes');
const adSpaceRoutes = require('./routes/AdSpaceRoutes');
const adApprovalRoutes = require('./routes/AdApprovalRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/importAds', importAdRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/ad-categories', adCategoryRoutes);
app.use('/api/ad-spaces', adSpaceRoutes);
app.use('/api/accept', adApprovalRoutes);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

// PendingAds.js
function PendingAds() {
  const [pendingAds, setPendingAds] = useState([]);
  const { user } = useUser();  // Fetch the logged-in user's information

  useEffect(() => {
    const fetchPendingAds = async () => {
      if (user) {
        const ownerId = user.id;  // Use the Clerk user ID or email if that's your identifier
        
        try {
          // Fetch pending ads for the logged-in web owner using the owner ID in the route
          const response = await axios.get(`http://localhost:5000/api/accept/pending/${ownerId}`);
          setPendingAds(response.data);
        } catch (error) {
          console.error('Error fetching pending ads:', error);
        }
      }
    };

    fetchPendingAds();
  }, [user]);  // Ensure the effect runs when the user object is available

  // Handle approval of an ad
  const handleApprove = async (adId) => {
    await axios.put(`http://localhost:5000/api/accept/approve/${adId}`);
    setPendingAds(pendingAds.filter((ad) => ad._id !== adId)); // Remove approved ad from list
  };
}

export default PendingAds;

// Approved ad
import { useUser } from "@clerk/clerk-react";

const Content = () => {
  const [approvedAds, setApprovedAds] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    // Fetch approved ads by the user
    const fetchApprovedAds = async () => {
      if (user) {
        const userId = user.id;

        try {
          const response = await axios.get(`http://localhost:5000/api/accept/approved/${userId}`);
          setApprovedAds(response.data);
        } catch (error) {
          console.error('Error fetching approved ads:', error);
        }
      }
    };

    fetchApprovedAds();
  }, [user]);

};

i'm trying to fetch the ads i approved but i'm getting an error and it's not fixing
     
GET http://localhost:5000/api/accept/approved/user_2blQmsNZIYh1oxDnbHEjLdhr1iT 404 (Not Found)

fix it