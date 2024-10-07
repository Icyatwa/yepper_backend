// WebsiteModel.js
const websiteSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  websiteName: { type: String, required: true },
  websiteLink: { type: String, required: true, unique: true },
  logoUrl: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

// AdCategoryModel.js
const adCategorySchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true },
  categoryName: { type: String, required: true, minlength: 3 },
  description: { type: String, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },
  customAttributes: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now }
});
adCategorySchema.virtual('adSpaces', {
  ref: 'AdSpace',
  localField: '_id',
  foreignField: 'categoryId',
});

// AdCategoryController.js
exports.createCategory = async (req, res) => {
  try {
    const { ownerId, websiteId, categoryName, description, price, customAttributes } = req.body;
    if (!websiteId) {
      return res.status(400).json({ message: 'Website ID is required' });
    }
    const newCategory = new AdCategory({
      ownerId,
      websiteId,
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

// AdSpaceModel.js
const adSpaceSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory', required: true },
  spaceType: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  availability: { type: String, required: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  userCount: { type: Number, default: 0 },
  instructions: { type: String },
  apiCodes: {
    HTML: { type: String },
    JavaScript: { type: String },
    PHP: { type: String },
    Python: { type: String },
  },
  selectedAds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImportAd' }],
  createdAt: { type: Date, default: Date.now },
});
adSpaceSchema.virtual('remainingUserCount').get(function () {
  return this.userCount - this.selectedAds.length;
});
adSpaceSchema.pre('validate', function (next) {
  if (
    (this.availability === 'Reserved for future date' || this.availability === 'Pick a date') &&
    (!this.startDate || !this.endDate)
  ) {
    return next(new Error('Start date and end date must be provided for reserved or future availability.'));
  }
  next();
});
adSpaceSchema.index({ categoryId: 1 });
adSpaceSchema.virtual('remainingUserCount').get(function() {
  return this.userCount - this.selectedAds.length;
});
adSpaceSchema.set('toJSON', { virtuals: true });

// AdSpaceController.js
const generateApiCodesForAllLanguages = (spaceId, websiteId, categoryId, startDate = null, endDate = null) => {
  const apiUrl = `http://localhost:5000/api/ads/display?space=${spaceId}&website=${websiteId}&category=${categoryId}`;

  const dateCheckScript = startDate && endDate
    ? `
      const now = new Date();
      const start = new Date("${startDate}");
      const end = new Date("${endDate}");
      if (now >= start && now <= end) {
        var ad = document.createElement('script');
        ad.src = "${apiUrl}";
        document.getElementById("${spaceId}-ad").appendChild(ad);
      }
    `
    : `
      var ad = document.createElement('script');
      ad.src = "${apiUrl}";
      document.getElementById("${spaceId}-ad").appendChild(ad);
    `;

  const apiCodes = {
    HTML: `<script src="${apiUrl}"></script>`,
    JavaScript: `<script>
                  (function() {
                    ${dateCheckScript}
                  })();
                </script>`,
    PHP: `<?php echo '<div id="${spaceId}-ad"><script src="${apiUrl}"></script></div>'; ?>`,
    Python: `print('<div id="${spaceId}-ad"><script src="${apiUrl}"></script></div>')`,
  };
  return apiCodes;
};

exports.createSpace = async (req, res) => {
  try {
    const { categoryId, spaceType, price, availability, userCount, instructions, startDate, endDate } = req.body;
    const category = await AdCategory.findById(categoryId).populate('websiteId');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const websiteId = category.websiteId._id;
    const newSpace = new AdSpace({
      categoryId,
      spaceType,
      price,
      availability,
      userCount,
      instructions,
      startDate,
      endDate
    });
    const savedSpace = await newSpace.save();
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
const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  selectedWebsites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Website' }],
  selectedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory' }],
  selectedSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdSpace' }]
});

// ImportAdController.js
exports.createImportAd = [upload.single('file'), async (req, res) => {
  try {
    const {
      userId,
      selectedWebsites,
      selectedCategories,
      selectedSpaces
    } = req.body;

    const websitesArray = JSON.parse(selectedWebsites);
    const categoriesArray = JSON.parse(selectedCategories);
    const spacesArray = JSON.parse(selectedSpaces);

    const newRequestAd = new ImportAd({
      userId,
      selectedWebsites: websitesArray,
      selectedCategories: categoriesArray,
      selectedSpaces: spacesArray
    });
    const savedRequestAd = await newRequestAd.save();
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
    const adSpace = await AdSpace.findById(space).populate('selectedAds');
    if (!adSpace || adSpace.selectedAds.length === 0) {
      return res.status(404).send('No ads available for this space');
    }
    const currentDate = new Date();
    const { startDate, endDate, availability } = adSpace;
    if (
      (availability === 'Reserved for future date' || availability === 'Pick a date') &&
      (currentDate < new Date(startDate) || currentDate > new Date(endDate))
    ) {
      return res.status(403).send('Ad is not available during this time period.');
    }
    const userCount = adSpace.userCount;
    const adsToShow = adSpace.selectedAds.slice(0, userCount);
    const adsHtml = adsToShow
      .map((selectedAd) => {
        const imageUrl = selectedAd.imageUrl ? `http://localhost:5000${selectedAd.imageUrl}` : '';
        return `
          <div class="ad">
            <h3>${selectedAd.businessName}</h3>
            <p>${selectedAd.adDescription}</p>
            ${imageUrl ? `<img src="${imageUrl}" alt="Ad Image">` : ''}
            ${selectedAd.pdfUrl ? `<a href="${selectedAd.pdfUrl}" target="_blank">Download PDF</a>` : ''}
            ${selectedAd.videoUrl ? `<video src="${selectedAd.videoUrl}" controls></video>` : ''}
          </div>
        `;
      })
      .join('');

    res.status(200).send(adsHtml);
  } catch (error) {
    console.error('Error displaying ad:', error);
    res.status(500).send('Failed to load ad');
  }
};

// dashboard-layout.js
import { useAuth } from "@clerk/clerk-react"
export default function DashboardLayout() {
  const { userId, isLoaded } = useAuth()
  const navigate = useNavigate()
  React.useEffect(() => {
    if (!userId) {
      navigate("/sign-in")
    }
  }, [])
  if (!isLoaded) return "Loading..."
  return (
    <Outlet />
  )
}

// root-layout.js
import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
    >
      <SignedIn>
        <UserButton afterSignOutUrl='/sign-in' />
      </SignedIn>
      <SignedOut>
        <Link to="/sign-in">Sign In</Link>
      </SignedOut>
      <main>
        <Outlet />
      </main>
    </ClerkProvider>
  );
}

// sign-in.js
import { SignIn } from "@clerk/clerk-react";
export default function SignInPage() {
  return (
    <SignIn />
  );
}

// sign-up.js
import { SignUp } from "@clerk/clerk-react";
export default function SignUpPage() {
  return (
    <SignUp />
  );
}

// ImportAd.js
function ImportAd() {
  // logic codes...

  const handlePublish = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('selectedWebsites', JSON.stringify(selectedWebsites));
      formData.append('selectedCategories', JSON.stringify(selectedCategories));
      formData.append('selectedSpaces', JSON.stringify(selectedSpaces));
      await axios.post('http://localhost:5000/api/importAds', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  };

  // return codes...
  }
}

before the ad owner sends the ad's data to the web owner it should first