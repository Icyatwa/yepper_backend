// AdSpaceController.js
const AdSpace = require('../models/AdSpaceModel');
const AdCategory = require('../models/AdCategoryModel');

// exports.createSpace = async (req, res) => {
//   try {
//     const { categoryId, spaceType, price, availability, userCount, instructions } = req.body;

//     // Check for missing fields
//     if (!categoryId || !spaceType || !price || !availability || !userCount) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     const newSpace = new AdSpace({ categoryId, spaceType, price, availability, userCount, instructions });
//     const savedSpace = await newSpace.save();
//     res.status(201).json(savedSpace);
//   } catch (error) {
//     console.error('Error saving ad space:', error);  // Log the actual error
//     res.status(500).json({ message: 'Failed to create ad space', error });
//   }
// };

// AdSpaceController.js

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
    const spaces = await AdSpace.find().populate('categoryId'); // Fetch all spaces and populate category details
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