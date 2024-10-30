// WebsiteController.js
exports.createWebsite = async (req, res) => {
  try {
    const { ownerId, websiteName, websiteLink, logoUrl } = req.body;

    // Check if website URL is already in use
    const existingWebsite = await Website.findOne({ websiteLink }).lean();
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
  }
};

// AdCategoryController.js
exports.createCategory = async (req, res) => {
  try {
    const { ownerId, websiteId, categoryName, description, price, customAttributes } = req.body;

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
  }
};

// AdSpaceController.js
exports.createSpace = async (req, res) => {
  try {
    const { categoryId, spaceType, price, availability, userCount, instructions, startDate, endDate, webOwnerEmail, cardInfo } = req.body;
    const category = await AdCategory.findById(categoryId).populate('websiteId');
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
  }
};

// ImportAdController.js
exports.createImportAd = [upload.single('file'), async (req, res) => {
  try {
    const {
      userId,
      selectedWebsites,
      selectedCategories,
      selectedSpaces,
    } = req.body;

    // Parse JSON strings
    const websitesArray = JSON.parse(selectedWebsites);
    const categoriesArray = JSON.parse(selectedCategories);
    const spacesArray = JSON.parse(selectedSpaces);

    // Create ImportAd entry
    const newRequestAd = new ImportAd({
      userId,
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

    res.status(201).json(savedRequestAd);
  }
}];

// PaymentController.js
const createOrder = async (price, webOwnerEmail) => {
  const fetch = (await import('node-fetch')).default;
  
  const totalAmount = price;
  const platformFee = parseFloat((price * 0.05).toFixed(2));
  const payeeAmount = (totalAmount - platformFee).toFixed(2);

  const order = await fetch(`${process.env.PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: totalAmount },
        payee: { email_address: webOwnerEmail },
        payment_instruction: {
          platform_fees: [{ amount: { currency_code: 'USD', value: platformFee } }]
        }
      }]
    })
  });

  const data = await order.json();
  return data;
};

const capturePayment = async (orderId) => {
  const fetch = (await import('node-fetch')).default;

  const capture = await fetch(`${process.env.PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`
    }
  });

  const data = await capture.json();
  return data;
};

// Exporting functions remains the same
exports.processPayment = async (req, res) => {
  const { adId, adSpaceId, price, webOwnerEmail } = req.body;

  try {
    const order = await createOrder(price, webOwnerEmail);

    if (order.status === 'CREATED') {
      res.status(201).json({ orderID: order.id });
    } else {
      res.status(500).json({ message: 'Order creation failed' });
    }
  }
};

exports.confirmPayment = async (req, res) => {
  const { orderID, adId } = req.body;

  try {
    const capture = await capturePayment(orderID);

    if (capture.status === 'COMPLETED') {
      await ImportAd.findByIdAndUpdate(adId, { confirmed: true });
      res.status(200).json({ message: 'Payment successful and ad confirmed' });
    } else {
      res.status(400).json({ message: 'Payment failed' });
    }
  }
};

// AdApprovalController.js
exports.confirmAdDisplay = async (adId, adSpaceId, price) => {
  try {
    // 1. Create Order
    const createOrderResponse = await fetch('http://localhost:5000/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId, adSpaceId, price })
    });
    const orderData = await createOrderResponse.json();

    if (!orderData.orderID) throw new Error('Order creation failed');

    // 2. Redirect to PayPal for approval
    window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${orderData.orderID}`;

    // 3. Capture Payment after approval
    const captureResponse = await fetch('http://localhost:5000/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderID: orderData.orderID, adId })
    });

    if (captureResponse.ok) {
      alert('Payment successful! Ad is now confirmed and live.');
      setApprovedAds((prevAds) => prevAds.filter((ad) => ad._id !== adId));
    } else {
      throw new Error('Failed to confirm ad');
    }
  }
};

// PayPalButton.js
const PayPalButton = ({ ad, onPaymentSuccess }) => {
  const { _id: adId, selectedSpaces, price } = ad;
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    // Function to load PayPal SDK script
    const loadPayPalScript = () => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=ARhUfILu_ITBqjUd1vV86jPRIRiBV3m0sU4zErkRVlLY6hQ8NHtKuJGWZEmrvJLXl17BhVnI6YyIK1es&currency=USD`;
      script.async = true;
      script.onload = () => setSdkReady(true);
      document.body.appendChild(script);
    };

    // Load the script if it's not already available
    if (!window.paypal) {
      loadPayPalScript();
    } else {
      setSdkReady(true);
    }
  }, []);

  useEffect(() => {
    if (sdkReady) {
      window.paypal.Buttons({
        createOrder: async (data, actions) => {
          const response = await fetch('http://localhost:5000/api/payment/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adId, adSpaceId: selectedSpaces[0], price })
          });
          const orderData = await response.json();

          if (orderData.orderID) {
            return orderData.orderID;
          } else {
            throw new Error('Order creation failed');
          }
        },
        onApprove: async (data, actions) => {
          const captureResponse = await fetch('http://localhost:5000/api/payment/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: data.orderID, adId })
          });
          
          if (captureResponse.ok) {
            onPaymentSuccess();
          } else {
            alert('Payment failed, please try again.');
          }
        },
        onError: (err) => {
          console.error('PayPal Checkout onError:', err);
          alert('An error occurred during the payment process. Please try again.');
        }
      }).render('#paypal-button-container');
    }
  }, [sdkReady, adId, selectedSpaces, price, onPaymentSuccess]);

  if (!sdkReady) return <div>Loading PayPal...</div>;

  return <div id="paypal-button-container"></div>;
};

// ApprovedAdsForAdvertiser.js
import PayPalButton from './PayPalButton'

const ApprovedAdsForAdvertiser = () => {
  const { user } = useClerk();
  const userId = user?.id;
  const [approvedAds, setApprovedAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);

    // fetch of data

  const handleConfirmClick = (ad) => {
    setSelectedAd(ad);
  };

  const confirmAdDisplay = async (adId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/accept/confirm/${adId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
  };

  const handlePaymentSuccess = () => {
    if (selectedAd) {
      confirmAdDisplay(selectedAd._id);
    }
  };

};

as the categories and spaces are created by a web owner, the system must calculate the price of category and its spaces price and the ad owner(the one who imports the ad and confirms it to be displayed) will have to pay that money(the sum of category price and it's spaces prices) every minute(like a month subscription). add those changes now


























create a payment system with paypal using MERN stack with mongodb cloud, user1 will insert his card's information, the price he wants and he will add if they should pay him per minute or per 2 minutes(these will act as a weekly/monthly or yearly subscription, but take it as a testing) and user2 will have to pay him, please be professional on this. don't use "@paypal/checkout-server-sdk" because: npm warn deprecated @paypal/checkout-server-sdk@1.0.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info. i'm using clerk in frontend:
import { useUser } from '@clerk/clerk-react'  
function Page() { 
  const { user } = useUser();)