// WebsiteModel.js
const websiteSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  websiteName: { type: String, required: true },
  websiteLink: { type: String, required: true, unique: true },
  logoUrl: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

websiteSchema.index({ ownerId: 1 });

// AdCategoryModel.js
const adCategorySchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  categoryName: { type: String, required: true, minlength: 3 },
  description: { type: String, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },
  customAttributes: { type: Map, of: String }, // Allows flexibility for custom attributes
  createdAt: { type: Date, default: Date.now }
});

// Virtual for AdSpaces that belong to this category
adCategorySchema.virtual('adSpaces', {
  ref: 'AdSpace',
  localField: '_id',
  foreignField: 'categoryId',
});

adCategorySchema.index({ ownerId: 1 }); // Adding an index for frequent queries

// AdSpaceModel.js
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
  createdAt: { type: Date, default: Date.now }
});

adSpaceSchema.index({ categoryId: 1 }); // Index for faster lookups


// WebsiteController.js
const Website = require('../models/WebsiteModel');

exports.createWebsite = async (req, res) => {
  try {
    const { ownerId, websiteName, websiteLink, logoUrl } = req.body;

    if (!ownerId || !websiteName || !websiteLink) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if website URL is already in use
    const existingWebsite = await Website.findOne({ websiteLink });
    if (existingWebsite) {
      return res.status(409).json({ message: 'Website URL already exists' });
    }

    const newWebsite = new Website({
      ownerId,
      websiteName,
      websiteLink,
      logoUrl
    });

    const savedWebsite = await newWebsite.save();
    res.status(201).json(savedWebsite);
  } catch (error) {
    console.error('Error creating website:', error); // Log detailed error
    res.status(500).json({ message: 'Failed to create website', error });
  }
};

exports.getWebsitesByOwner = async (req, res) => {
  const { ownerId } = req.params;

  try {
    const websites = await Website.find({ ownerId });
    res.status(200).json(websites);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch websites', error });
  }
};

// AdCategoryController.js
const AdCategory = require('../models/AdCategoryModel');

exports.createCategory = async (req, res) => {
  try {
    const { ownerId, websiteId, categoryName, description, price, customAttributes } = req.body;

    if (!websiteId) {
      return res.status(400).json({ message: 'Website ID is required' });
    }

    const newCategory = new AdCategory({
      ownerId,
      websiteId,  // Associate the category with the website
      categoryName,
      description,
      price,
      customAttributes: customAttributes || {}
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category', error });
  }
};

exports.getCategoriesByWebsite = async (req, res) => {
  const { websiteId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const categories = await AdCategory.find({ websiteId })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await AdCategory.countDocuments({ websiteId });

    res.status(200).json({
      categories,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error });
  }
};

// AdSpaceController.js
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');

const generateApiCodesForAllLanguages = (spaceType, websiteId, categoryId) => {
  const apiCodes = {
    HTML: `<script src="https://example.com/api/ads?space=${spaceType}&website=${websiteId}&category=${categoryId}"></script>`,
    JavaScript: `<script>
(function() {
  var ad = document.createElement('script');
  ad.src = "https://example.com/api/ads?space=${spaceType}&website=${websiteId}&category=${categoryId}";
  document.getElementById("${spaceType}-ad").appendChild(ad);
})();
</script>`,
    PHP: `<?php echo '<div id="${spaceType}-ad"><script src="https://example.com/api/ads?space=${spaceType}&website=${websiteId}&category=${categoryId}"></script></div>'; ?>`,
    Python: `print('<div id="${spaceType}-ad"><script src="https://example.com/api/ads?space=${spaceType}&website=${websiteId}&category=${categoryId}"></script></div>')`
  };

  return apiCodes;
};

exports.createSpace = async (req, res) => {
  try {
    const { categoryId, spaceType, price, availability, userCount, instructions } = req.body;

    if (!categoryId || !spaceType || !price || !availability || !userCount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Retrieve website ID from the category
    const category = await AdCategory.findById(categoryId).populate('websiteId');
    const websiteId = category.websiteId._id;

    // Generate API codes for all languages
    const apiCodes = generateApiCodesForAllLanguages(spaceType, websiteId, categoryId);

    const newSpace = new AdSpace({ 
      categoryId, 
      spaceType, 
      price, 
      availability, 
      userCount, 
      instructions,
      apiCodes // Save all API codes in the database as an object
    });

    const savedSpace = await newSpace.save();
    res.status(201).json(savedSpace);
  } catch (error) {
    console.error('Error saving ad space:', error);
    res.status(500).json({ message: 'Failed to create ad space', error });
  }
};

exports.getAllSpaces = async (req, res) => {
  try {
    const spaces = await AdSpace.find().populate('categoryId');  // Fetch all spaces and populate category data if needed
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

// Spaces
function Spaces() {
  const { selectedCategories, prices, customCategory } = location.state; // Passed from Ads.js
  const [spaces, setSpaces] = useState({});

  // Handle space selection for each category
  const handleSpaceChange = (category, space, value) => {
    setSpaces((prevState) => ({
      ...prevState,
      [category]: {
        ...prevState[category],
        [space]: value,
      },
    }));
  };

  // Function to submit data to the backend
  const submitSpacesToDatabase = async () => {
    setLoading(true);
    try {
      for (const category in spaces) {
        const spaceData = spaces[category];
        const categoryId = selectedCategories[category]?.id;

        if (categoryId) {
          for (const spaceType of ['header', 'sidebar']) {
            if (spaceData[spaceType]) {
              await axios.post('http://localhost:5000/api/ad-spaces', {
                categoryId,
                spaceType: spaceType.charAt(0).toUpperCase() + spaceType.slice(1),
                price: spaceData.price,
                availability: 1,
                userCount: spaceData.userCount,
                instructions: spaceData.instructions || ''
              });
            }
          }
          navigate('/apis', {
            state: { selectedCategories, prices, spaces, customCategory },
          });
        }
      }
    } catch (error) {
      console.error('Error submitting spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render space checkboxes for each category
  const renderSpacesForCategory = (category) => (
    // codes
  );

  return (
    // codes
  );
}

// Preview.js
function Preview() {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/ad-spaces'); // Fetch all spaces with their APIs
        setSpaces(response.data);
      } catch (error) {
        console.error('Error fetching spaces:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  return (
    <div>
      {spaces.map((space) => (
        <div key={space._id} className="space-preview">
          <h3>Category: {space.categoryId.categoryName}</h3>
          <h4>Website: {space.categoryId.websiteId.websiteName}</h4>
          <p>Space Type: {space.spaceType}</p>
          <p>Price: {space.price}</p>
          <p>Availability: {space.availability}</p>
          <pre>{space.apiCodes.HTML}</pre>
          <pre>{space.apiCodes.JavaScript}</pre>
          <pre>{space.apiCodes.PHP}</pre>
          <pre>{space.apiCodes.Python}</pre>
        </div>
      ))}
    </div>
  );
}