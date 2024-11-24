// ImportAdModel.js
const mongoose = require('mongoose');
const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  adOwnerEmail: { type: String, required: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },
  businessName: { type: String, required: true },
  businessLink: { type: String, required: true },
  businessLocation: { type: String, required: true },
  adDescription: { type: String, required: true },
  selectedWebsites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Website' }],
  selectedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory' }],
  selectedSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdSpace' }],
  approved: { type: Boolean, default: false },
  confirmed: { type: Boolean, default: false },
  clicks: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
});

module.exports = mongoose.model('ImportAd', importAdSchema);

// ImportAdController.js
// ImportAdController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const path = require('path');
const fs = require('fs');
const sendEmailNotification = require('./emailService');

const { Storage } = require('@google-cloud/storage');
// const path = require('path');

const storage = new Storage({
  keyFilename: path.join(__dirname, '../forward-map-413614-7690654344af.json'), // Replace with the path to your JSON key
});

const bucketName = 'yepper_bucket'; // Replace with your bucket name
const bucket = storage.bucket(bucketName);

exports.createImportAd = [async (req, res) => {
  try {
    const {
      userId,
      adOwnerEmail,
      businessName,
      businessLink,
      businessLocation,
      adDescription,
      selectedWebsites,
      selectedCategories,
      selectedSpaces,
    } = req.body;

    // Parse JSON strings
    const websitesArray = JSON.parse(selectedWebsites);
    const categoriesArray = JSON.parse(selectedCategories);
    const spacesArray = JSON.parse(selectedSpaces);

    let imageUrl = '';
    let pdfUrl = '';
    let videoUrl = '';

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const blob = bucket.file(fileName);
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype,
      });
    
      blobStream.on('error', (err) => {
        console.error('File upload error:', err);
        throw err;
      });
    
      blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
        if (req.file.mimetype.startsWith('image')) {
          imageUrl = publicUrl;
        } else if (req.file.mimetype === 'application/pdf') {
          pdfUrl = publicUrl;
        } else if (req.file.mimetype.startsWith('video')) {
          videoUrl = publicUrl;
        }
      });
    
      blobStream.end(req.file.buffer);
    }    

    // Create ImportAd entry
    const newRequestAd = new ImportAd({
      userId,
      adOwnerEmail,
      imageUrl,
      pdfUrl,
      videoUrl,
      businessName,
      businessLink,
      businessLocation,
      adDescription,
      selectedWebsites: websitesArray,
      selectedCategories: categoriesArray,
      selectedSpaces: spacesArray,
      approved: false,
      confirmed: false
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

// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const importAdRoutes = require('./routes/ImportAdRoutes');
const adApprovalRoutes = require('./routes/AdApprovalRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/importAds', importAdRoutes);
app.use('/api/accept', adApprovalRoutes);

const server = http.createServer(app);
const io = socketIo(server);

module.exports.io = io;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

// AdApprovalController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');

exports.getApprovedAdsAwaitingConfirmation = async (req, res) => {
  const { userId } = req.params;

  try {
    const approvedAds = await ImportAd.find({
      userId,
      approved: true
    })
      .populate({
        path: 'selectedCategories',
        select: 'price ownerId',
      })
      .populate({
        path: 'selectedSpaces',
        select: 'price webOwnerEmail',
      })
      .populate('selectedWebsites', 'websiteName websiteLink logoUrl')

    const adsWithDetails = approvedAds.map(ad => {
      const categoryPriceSum = ad.selectedCategories.reduce((sum, category) => sum + (category.price || 0), 0);
      const spacePriceSum = ad.selectedSpaces.reduce((sum, space) => sum + (space.price || 0), 0);
      const totalPrice = categoryPriceSum + spacePriceSum;

      return {
        ...ad.toObject(),
        totalPrice,
        isConfirmed: ad.confirmed,
        categoryOwnerIds: ad.selectedCategories.map(cat => cat.ownerId),
        spaceOwnerEmails: ad.selectedSpaces.map(space => space.webOwnerEmail),
        clicks: ad.clicks,  // Include clicks
        views: ad.views     // Include views
      };
    });

    res.status(200).json(adsWithDetails);
  } catch (error) {
    console.error('Error fetching approved ads:', error);
    res.status(500).json({ message: 'Failed to fetch approved ads', error });
  }
};

// Content.js
const Content = () => {
  const { user } = useClerk();
  const userId = user?.id;
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await axios.get(`https://yepper-backend.onrender.com/api/accept/approved-awaiting-confirmation/${userId}`);
        if (response.status !== 200) {
          throw new Error('Failed to fetch ads');
        }
        const data = response.data;
        if (Array.isArray(data)) {
          setAds(data);
        } else {
          console.error('Received data is not an array:', data);
        }
        setLoading(false);
      } catch (error) {
        setError(error.response ? 'Error fetching ads' : 'No internet connection');
        setLoading(false);
      }
    };
    if (userId) fetchAds();
  }, [userId]);

  if (loading) {
    return <div className="main-content loading-spinner">Loading...</div>;
  }

  if (error) {
    return (
      <div className="main-content error-container">
        <div>{error}</div>
      </div>
    );
  }

  const formatNumber = (number) => {
    if (number >= 1000 && number < 1000000) {
        return (number / 1000).toFixed(1) + 'K'; // e.g., 1.2K
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M'; // e.g., 1.2M
    }
    return number; // Return the number as is if less than 1000
  };

  return (
    <>
      <div className="main-content">
        <div className="ads-gallery">
          {ads.length > 0 ? (
            ads.slice().reverse().map((ad) => (
              <Link key={ad._id} to={`/approved-detail/${ad._id}`} className={`ad-link ${ad.isConfirmed ? 'confirmed' : 'awaiting-confirmation'}`}>
                <div className='impressions'>
                  <p><strong>Views:</strong> {formatNumber(ad.views)}</p>
                  <p><strong>Clicks:</strong> {formatNumber(ad.clicks)}</p>
                </div>
                {ad.videoUrl ? (
                  <video
                    autoPlay
                    loop
                    muted
                    className="ad-background-video"
                  >
                    <source src={`https://yepper-backend.onrender.com${ad.videoUrl}`} type="video/mp4" />
                  </video>
                ) : (
                  ad.imageUrl && (
                    <img
                      src={`https://yepper-backend.onrender.com${ad.imageUrl}`}
                      alt="Ad Visual"
                      className="ad-background-image"
                    />
                  )
                )}
                <div className="overlay">
                  <h1 className="ad-title">{ad.businessName}</h1>
                  <div className="arrow-icon">
                    <img src={arrowBlue} alt="Arrow Icon" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="no-ads">No ads available</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Content;

i'm uplaoding a pic or a video but and it works, but when i refresh the page or i leave it and come back i found that the pic is gone, i mean it only comes back when i'm running it on the local server but the hosted one, it doesn't work. the tools i used are: mongodb cloud, render for backend, vercel for frontend