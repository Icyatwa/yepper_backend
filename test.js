// Website.js
function Website() {
  const { user } = useClerk();
  const ownerId = user?.id;
  const [websiteName, setWebsiteName] = useState('');
  const [websiteLink, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const handleSubmit = async (e) => {
    try {
      const websiteData = {
        ownerId,
        websiteName,
        websiteLink,
        logoUrl,
      };
  
      const response = await axios.post('http://localhost:5000/api/websites', websiteData, {
        headers: {
          'Content-Type': 'application/json', // Correct content type for JSON
        },
      });

    } catch (error) {
    }
  };

  return (
    // codes
  );
}

export default Website;

// Categories.js
function Categories() {
  const { user } = useClerk();
  const ownerId = user?.id;
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(false);
  const [result, setResult] = useState(true);

  const handleOpenForm = () =>{
    setForm(true);
    setResult(false);
  }

  const handleCloseForm = () =>{
    setForm(false);
    setResult(true);
  }

  const [selectedCategories, setSelectedCategories] = useState({
    banner: false,
    popup: false,
    custom: false,
  });

  const [prices, setPrices] = useState({});
  const [customCategory, setCustomCategory] = useState({
    name: '',
    description: '',
    customAttributes: {},
  });

  const handleCategoryChange = (category) => {
    setSelectedCategories(prevState => ({
      ...prevState,
      [category]: !prevState[category]
    }));
  };

  const handlePriceChange = (category, price) => {
    setPrices(prevState => ({
      ...prevState,
      [category]: price
    }));
  };

  const handleCustomCategoryChange = (key, value) => {
    setCustomCategory(prevState => ({
      ...prevState,
      [key]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent form from refreshing the page
  
    if (!websiteId) {
      console.error('Website ID is missing');
      return;
    }
  
    try {
      const categoriesToSubmit = [];
  
      if (selectedCategories.banner) {
        categoriesToSubmit.push({
          ownerId,
          websiteId,  // Associate the ad category with the selected website
          categoryName: 'Banner',
          price: prices.banner,
          description: 'Banner ad category',
          customAttributes: {},
        });
      }
  
      if (selectedCategories.popup) {
        categoriesToSubmit.push({
          ownerId,
          websiteId,  // Associate the ad category with the selected website
          categoryName: 'Popup',
          price: prices.popup,
          description: 'Popup ad category',
          customAttributes: {},
        });
      }
  
      if (selectedCategories.custom) {
        categoriesToSubmit.push({
          ownerId,
          websiteId,  // Associate the ad category with the selected website
          categoryName: customCategory.name,
          price: prices.custom,
          description: customCategory.description,
          customAttributes: customCategory.customAttributes,
        });
      }
  
      // Send the categories data to the backend and store category IDs
      const responses = await Promise.all(categoriesToSubmit.map(async (category) => {
        const response = await axios.post('http://localhost:5000/api/ad-categories', category);
        return { ...response.data, name: category.categoryName };  // Return category data including name
      }));
  
      // Add the returned category IDs to the array and pass them to the next page
      const categoriesWithId = responses.reduce((acc, category) => {
        acc[category.name.toLowerCase()] = { id: category._id, price: category.price };
        return acc;
      }, {});
  
      navigate('/ad-spaces', { 
        state: { 
          selectedCategories: categoriesWithId,  // Now includes category IDs
          prices, 
          customCategory, 
        } 
      });
    } catch (error) {
    }
  };  

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/ad-categories/${websiteId}`);
        
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
        }
        
      } catch (err) {
        
      }
    };

    if (websiteId) {
      fetchCategories();
    }
  }, [websiteId]);

  return (
    <div>

      {result &&(
        // data
      )}

      {form &&(
        // form
      )}
    </div>
  );
}

export default Categories;

// Spaces
function Spaces() {
  const { selectedCategories, prices, customCategory } = location.state; // Passed from Ads.js
  const [spaces, setSpaces] = useState({});

  // Function to submit data to the backend
  const submitSpacesToDatabase = async () => {
    setLoading(true);
    try {
      for (const category in spaces) {
        const spaceData = spaces[category];
    
        // Find the corresponding categoryId for each selected category
        const categoryId = selectedCategories[category] && selectedCategories[category].id; // Make sure you have the category IDs from previous navigation or response
    
        // Validate data before sending
        if (categoryId) {
          // Loop through the possible space types (header, sidebar)
          for (const spaceType of ['header', 'sidebar']) {
            if (spaceData[spaceType]) {
              await axios.post('http://localhost:5000/api/ad-spaces', {
                categoryId, // Add the categoryId here
                spaceType: spaceType.charAt(0).toUpperCase() + spaceType.slice(1), // Capitalize the space type (e.g., 'Header', 'Sidebar')
                price: spaceData.price,
                availability: 1,
                userCount: spaceData.userCount,
                instructions: spaceData.instructions || '', // fallback to empty string
              });
            }
          }
        } else {
          console.warn('Incomplete data for space:', category);
        }
      }
  
      // Navigate to APIs page
      navigate('/apis', {
        state: { selectedCategories, prices, spaces, customCategory },
      });
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

export default Spaces;

// APIs.js
function APIs() {
  const { selectedCategories, spaces, customCategory } = location.state; // Data passed from Categories.js
  const [selectedLanguage, setSelectedLanguage] = useState('HTML'); // Default language is HTML

  const generateApiCode = (space, categoryId, language) => {
    if (language === 'HTML') {
      return `<script src="https://example.com/api/ads?space=${space}&category=${categoryId}"></script>`;
    } else if (language === 'JavaScript') {
      return `<script>\n(function() {\n  var ad = document.createElement('script');\n  ad.src = "https://example.com/api/ads?space=${space}&category=${categoryId}";\n  document.getElementById("${space}-ad").appendChild(ad);\n})();\n</script>`;
    } else if (language === 'PHP') {
      return `<?php echo '<div id="${space}-ad"><script src="https://example.com/api/ads?space=${space}&category=${categoryId}"></script></div>'; ?>`;
    } else if (language === 'Python') {
      return `print('<div id="${space}-ad"><script src="https://example.com/api/ads?space=${space}&category=${categoryId}"></script></div>')`;
    } else {
      return 'Language not supported';
    }
  };

  // Render API code for each selected space in different languages
  const renderApiCodes = (category, spaces, categoryId) => {
    // Only consider actual ad spaces like 'header', 'sidebar' for API generation
    return Object.keys(spaces)
      .filter(spaceType => ['header', 'sidebar'].includes(spaceType)) // Filter to include only the actual space types
      .map((spaceType) => (
        <div key={spaceType}>
          <h4>{spaceType.charAt(0).toUpperCase() + spaceType.slice(1)} Space</h4>
          <pre>{generateApiCode(spaceType, categoryId, selectedLanguage)}</pre>
        </div>
      ));
  };
  

  return (
    // codes
  );
}

export default APIs;









// WebsiteModel.js
const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  websiteName: { type: String, required: true },
  websiteLink: { type: String, required: true, unique: true },
  logoUrl: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

websiteSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Website', websiteSchema);

// AdCategoryModel.js
const mongoose = require('mongoose');

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

module.exports = mongoose.model('AdCategory', adCategorySchema);

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

exports.getAllWebsites = async (req, res) => {
  try {
    const websites = await Website.find();
    res.status(200).json(websites);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch websites', error });
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

exports.getWebsiteById = async (req, res) => {
  const { websiteId } = req.params;

  try {
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }
    res.status(200).json(website);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch website', error });
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

exports.getCategories = async (req, res) => {
  const { ownerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const categories = await AdCategory.find({ ownerId })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await AdCategory.countDocuments({ ownerId });

    res.status(200).json({
      categories,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error });
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

exports.getCategoryById = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await AdCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch category', error });
  }
};

// AdSpaceController.js
const AdSpace = require('../models/AdSpaceModel');

exports.createSpace = async (req, res) => {
  try {
    const { categoryId, spaceType, price, availability, userCount, instructions } = req.body;

    // Check for missing fields
    if (!categoryId || !spaceType || !price || !availability || !userCount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newSpace = new AdSpace({ categoryId, spaceType, price, availability, userCount, instructions });
    const savedSpace = await newSpace.save();
    res.status(201).json(savedSpace);
  } catch (error) {
    console.error('Error saving ad space:', error);  // Log the actual error
    res.status(500).json({ message: 'Failed to create ad space', error });
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

// ApiGeneratorController.js

exports.generateApi = async (req, res) => {
  const { websiteId, categoryId, selectedSpaces, language } = req.body;

  if (!websiteId || !categoryId || !selectedSpaces || !language) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const generateAdScriptForSpace = (spaceType, websiteId, categoryId) => {
    return `<script src="https://example.com/api/ads?space=${spaceType}&website=${websiteId}&category=${categoryId}"></script>`;
  };

  let apiCode = '';

  Object.keys(selectedSpaces).forEach((spaceType) => {
    if (selectedSpaces[spaceType]) {  // Only generate for selected spaces
      if (language === 'HTML') {
        return `<script src="https://example.com/api/ads?space=${space}&website=${websiteId}&category=${categoryId}"></script>`;
      } else if (language === 'JavaScript') {
        return `<script>\n(function() {\n  var ad = document.createElement('script');\n  ad.src = "https://example.com/api/ads?space=${space}&website=${websiteId}&category=${categoryId}";\n  document.getElementById("${space}-ad").appendChild(ad);\n})();\n</script>`;
      } else if (language === 'PHP') {
        apiCode += `<?php echo '<div id="${space}-ad"><script src="https://example.com/api/ads?space=${space}&website=${websiteId}&category=${categoryId}"></script></div>'; ?>\n`;
      } else if (language === 'Python') {
        apiCode += `print('<div id="${spaceType}-ad"><script src="https://example.com/api/ads?space=${space}&website=${websiteId}&category=${categoryId}"></script></div>')\n`;
      } else {
        apiCode += `<div id="${space}-ad">Language not supported</div>\n`;
      }
    }
  });

  res.status(200).json({ apiCode });
};

// WebsiteRoutes.js
const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/WebsiteController');
const Website = require('../models/WebsiteModel');

router.post('/', websiteController.createWebsite);
router.get('/', websiteController.getAllWebsites);
router.get('/:ownerId', websiteController.getWebsitesByOwner);
router.get('/website/:websiteId', websiteController.getWebsiteById);

module.exports = router; 

// AdCategoryRoutes.js
const express = require('express');
const router = express.Router();
const adCategoryController = require('../controllers/AdCategoryController');

router.post('/', adCategoryController.createCategory);
router.get('/', adCategoryController.getCategories);
router.get('/:websiteId', adCategoryController.getCategoriesByWebsite);
router.get('/category/:categoryId', adCategoryController.getCategoryById);

module.exports = router;

// AdSpaceRoutes.js
const express = require('express');
const router = express.Router();
const adSpaceController = require('../controllers/AdSpaceController');

router.post('/', adSpaceController.createSpace);
router.get('/:categoryId', adSpaceController.getSpaces);

module.exports = router;

// ApiGeneratorRoutes.js
const express = require('express');
const router = express.Router();
const apiGeneratorController = require('../controllers/ApiGeneratorController');

router.post('/', apiGeneratorController.generateApi);

module.exports = router;