// ImportAdModel.js
const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  adOwnerEmail: { type: String, required: true },
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
  advertiserAgreed: { type: Boolean, default: false },
});

// AdSpaceController.js
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');

const generateApiCodesForAllLanguages = (spaceId, websiteId, categoryId, startDate = null, endDate = null) => {
  const apiUrl = `https://yepper-backend.onrender.com/api/ads/display?space=${spaceId}&website=${websiteId}&category=${categoryId}`;

  const dateCheckScript = startDate && endDate
    ? `const now = new Date();
       const start = new Date("${startDate}");
       const end = new Date("${endDate}");
       if (now >= start && now <= end) {
         loadAd();
       }`
    : 'loadAd();'; // Default if no start and end date

  const rotationScript = `
    const rotateAds = (ads) => {
      let currentIndex = 0;
      ads[currentIndex].style.display = 'block';
      
      setInterval(() => {
        ads[currentIndex].style.display = 'none';
        currentIndex = (currentIndex + 1) % ads.length;
        ads[currentIndex].style.display = 'block';
      }, 5000); // Rotate every 5 seconds
    };

    const loadAd = () => {
      const adContainer = document.getElementById("${spaceId}-ad");
      fetch("${apiUrl}")
        .then(response => response.text())
        .then(adsHtml => {
          adContainer.innerHTML = adsHtml;
          const ads = adContainer.querySelectorAll('.ad');
          if (ads.length > 0) {
            rotateAds(ads); // Start rotating ads
          }
        })
        .catch(error => {
          console.error('Error loading ads:', error);
          adContainer.innerHTML = '<p>Error loading ads</p>';
        });
    };

    ${dateCheckScript}
  `;

  const apiCodes = {
    HTML: `
      <div id="${spaceId}-ad"></div>
      <script>
        ${rotationScript}
      </script>`,
      
    JavaScript: `
      <div id="${spaceId}-ad"></div>
      <script>
        (function() {
          ${rotationScript}
        })();
      </script>`,
      
    PHP: `
      <div id="${spaceId}-ad"></div>
      <script>
        <?php echo "${rotationScript}"; ?>
      </script>`,

    Python: `
      print('''
      <div id="${spaceId}-ad"></div>
      <script>
        ${rotationScript}
      </script>
      ''')`,
  };

  return apiCodes;
};

exports.createSpace = async (req, res) => {
  try {
    const { categoryId, spaceType, price, availability, userCount, instructions, startDate, endDate, webOwnerEmail, cardInfo } = req.body;

    if (!categoryId || !spaceType || !price || !availability || !userCount || !cardInfo) {
      return res.status(400).json({ message: 'All required fields must be provided, including card information' });
    }

    // Validate card information here if necessary

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
      webOwnerEmail,
      cardInfo,  // Adding cardInfo in AdSpace creation
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

// ImportAdController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const sendEmailNotification = require('./emailService');

exports.createImportAd = [upload.single('file'), async (req, res) => {
  try {
    const {
      userId,
      adOwnerEmail,
      businessName,
      businessLocation,
      adDescription,
      selectedWebsites,
      selectedCategories,
      selectedSpaces,
      approved,
      advertiserAgreed,
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
      adOwnerEmail,
      imageUrl,
      pdfUrl,
      videoUrl,
      businessName,
      businessLocation,
      adDescription,
      selectedWebsites: websitesArray,
      selectedCategories: categoriesArray,
      selectedSpaces: spacesArray,
      approved: false,
      advertiserAgreed: false,
    });

    const savedRequestAd = await newRequestAd.save();

    // Get the ad spaces that the ad owner selected
    const adSpaces = await AdSpace.find({ _id: { $in: spacesArray } });

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

// AdApprovalController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');
const Website = require('../models/WebsiteModel');
const sendEmailNotification = require('./emailService');

exports.getPendingAds = async (req, res) => {
  // codes
};

exports.approveAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const approvedAd = await ImportAd.findByIdAndUpdate(adId, { approved: true }, { new: true }).populate('userId');

    if (!approvedAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    res.status(200).json({ message: 'Ad approved and notification sent to ad owner' });

  } catch (error) {
    console.error('Error approving ad:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ImportAdController.js
exports.getApprovedAdsForAdvertiser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching approved ads for user:", userId);  // Add this log

    const approvedAds = await ImportAd.find({
      userId,
      approved: true,
      advertiserAgreed: false
    }).populate('selectedSpaces selectedCategories selectedWebsites');

    console.log("Approved Ads:", approvedAds);  // Add this log to see what the query returns

    res.status(200).json(approvedAds);
  } catch (error) {
    console.error('Error fetching approved ads for advertiser:', error);
    res.status(500).json({ message: 'Error fetching approved ads for advertiser' });
  }
};

// ApprovedAdsForAdvertiser.js
import { useClerk } from '@clerk/clerk-react';

const ApprovedAdsForAdvertiser = () => {
    const [ads, setAds] = useState([]);
    const { user } = useClerk();
    const userId = user?.id;

    useEffect(() => {
      if (userId) {
          console.log("Fetching approved ads for user:", userId);  // Add this log
          fetch(`http://localhost:5000/api/importAds/approved/${userId}`)
          .then(response => response.json())
          .then(data => {
              console.log("Approved ads:", data);  // Log the response
              setAds(data);
          })
          .catch(error => console.error('Error fetching approved ads for advertiser:', error));
      }
    }, [userId]);

    return (
      // codes
    );
};

i have approved the ads and it sent an email, but the system is not fetching approved ad


















here's my paypal sandbox data.

App name: yepper_test_mode
Client ID: AXZcz7NtwyfhJEm-UIAtfydBJBiPdGXbp-sY4-7sBrFKE4ufXNNISRy6ZHAQ784RI3Wj0_KKdbOqTXxB
Secret key 1: EJ6yXRjabTPvD3F2IMsF2OPuiuEl9v_l3UZ9NoY5_EPL2aQw5SK4xnKZHjVlo58OikF4D7FICrFcjJhp
Sandbox URL: https://sandbox.paypal.com
Sandbox Region: US
Email: sb-31bqz33423978@business.example.com
Password: d28rN#Dj

NB: before the web owner sends his space data he should first insert his card information so that he can receive his money(because this is a sandbox there should be a message in console that he received money). as you can see the system will send an email to the web owner that there's a pending ad, so by approving it, before it appears to his generated API it will first send an email to the ad owner to first pay and after paying 15% of it will react me(in console i shall see that message), 85% will reach the web owner(in console i shall see that message too)