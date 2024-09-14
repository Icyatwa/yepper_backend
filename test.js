// importAdSchema.js
const mongoose = require('mongoose');

const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  businessName: { type: String, required: true },
  businessLocation: { type: String },
  adDescription: { type: String },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },
  templateType: { type: String},
  categories: [{ type: String }],
  paymentStatus: { type: String, default: 'pending' },  // New field for payment status
  paymentRef: { type: String },  // New field to store payment reference from Flutterwave
  amount: { type: Number },  // New field for payment amount
  email: { type: String },  // Email is now optional
  phoneNumber: { type: String },  // New field for phone number
}, { timestamps: true });

module.exports = mongoose.model('ImportAd', importAdSchema);

// ImportAdController.js
const Flutterwave = require('flutterwave-node-v3');
const ImportAd = require('../models/ImportAdModel');
const TemporaryAdData = require('../models/TemporaryAdData');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Initialize Flutterwave
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

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

// Payment initiation
exports.initiatePayment = async (req, res) => {
  try {
    const { userId, businessName, businessLocation, adDescription, templateType, categories, amount, currency, email, phoneNumber } = req.body;
    
    // Handling file upload from req.file if present
    let imageUrl = '';
    let pdfUrl = '';
    let videoUrl = '';

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(__dirname, './uploads', fileName);

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

    const tx_ref = 'LEDOST-' + Date.now();
    const paymentPayload = {
      tx_ref: tx_ref,
      amount: amount,
      currency: currency,
      redirect_url: 'http://localhost:5000/api/importAds/callback',
      customer: {
        email: email || 'no-email@example.com',
        phonenumber: phoneNumber,
      },
      payment_options: 'card,banktransfer',
      customizations: {
        title: 'Ad Payment',
        description: 'Payment for your advertisement',
      },
    };

    await TemporaryAdData.create({
      tx_ref,
      userId,
      businessName,
      businessLocation,
      adDescription,
      templateType,
      categories,
      amount,
      currency,
      email,
      phoneNumber,
      imageUrl, // Save file URL to temporary ad data
      pdfUrl,
      videoUrl,
    });

    const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentPayload, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.data && response.data.data.link) {
      res.status(200).json({ paymentLink: response.data.data.link });
    } else {
      console.error('Payment initiation failed:', response.data);
      res.status(500).json({ message: 'Payment initiation failed', error: response.data });
    }
  } catch (error) {
    console.error('Error during payment initiation:', error);
    res.status(500).json({ message: 'Error during payment initiation' });
  }
};

exports.paymentCallback = async (req, res) => {
  try {
    const { tx_ref, transaction_id } = req.query;

    // Verify the transaction status from Flutterwave
    const transactionVerification = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
      }
    });

    const { status } = transactionVerification.data.data;

    if (status === 'successful') {
      const adData = await TemporaryAdData.findOne({ tx_ref });

      if (adData) {
        const { userId, businessName, businessLocation, adDescription, templateType, categories, imageUrl, pdfUrl, videoUrl } = adData;

        const newAd = new ImportAd({
          userId,
          businessName,
          businessLocation,
          adDescription,
          templateType,
          categories,
          imageUrl, // Saving image, pdf, and video URLs
          pdfUrl,
          videoUrl,
          paymentStatus: 'successful',
          paymentRef: tx_ref,
          amount: adData.amount,
          email: adData.email,
          phoneNumber: adData.phoneNumber,
        });

        await newAd.save();
        console.log('Ad data saved successfully:', newAd);

        await TemporaryAdData.deleteOne({ tx_ref });

        res.status(200).json({ message: 'Payment and ad processing successful' });
      } else {
        res.status(400).json({ message: 'Ad data not found or tx_ref mismatch' });
      }
    } else {
      console.error('Payment failed or incomplete:', status);
      res.status(400).json({ message: 'Payment failed or incomplete' });
    }
  } catch (error) {
    console.error('Error processing payment callback:', error);
    res.status(500).json({ message: 'Error processing payment callback' });
  }
};

// AdPreview.js
const AdPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { file, userId, businessName, businessLocation, adDescription, selectedCategories, templateType } = location.state || {};

  const [adContent, setAdContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('RWF');  // Default currency
  const [amount, setAmount] = useState(100);  // Low amount for testing
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setAdContent(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);

  useEffect(() => {
    if (templateType === 'pop-up') {
      const interval = setInterval(() => {
        setIsVisible((prev) => !prev);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setIsVisible(true);
    }
  }, [templateType]);

  const handlePublish = async () => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }
  
    setLoading(true);
  
    try {
      // Create FormData to include file upload
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('businessName', businessName);
      formData.append('businessLocation', businessLocation);
      formData.append('adDescription', adDescription);
      formData.append('templateType', templateType);
      formData.append('categories', JSON.stringify(selectedCategories));  // categories as a JSON string
      formData.append('amount', amount);
      formData.append('currency', currency);
      formData.append('email', email);
      formData.append('phoneNumber', phoneNumber);
      if (file) formData.append('file', file);  // Add the file to the request
  
      const response = await axios.post('http://localhost:5000/api/importAds/initiate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',  // Set proper header for file upload
        },
      });
  
      if (response.data.paymentLink) {
        window.location.href = response.data.paymentLink;
      } else {
        setError('Payment initiation failed');
      }
    } catch (error) {
      console.error('Error during payment initiation:', error);
      setError('An error occurred while initiating payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    
  );
};

Ad data saved successfully: {
  userId: 'user_2blQmsNZIYh1oxDnbHEjLdhr1iT',
  businessName: 'dream',
  businessLocation: 'kigali',
  adDescription: 'descri',
  imageUrl: '',
  pdfUrl: '',
  videoUrl: '',
  templateType: 'popdown',
  categories: [ '["technology"]' ],
  paymentStatus: 'successful',
  paymentRef: 'LEDOST-1726281509027',
  amount: 100,
  email: '',
  phoneNumber: '+250792051768',
  _id: new ObjectId('66e4f762144ecb26df26c88f'),
  createdAt: 2024-09-14T02:39:30.148Z,
  updatedAt: 2024-09-14T02:39:30.148Z,
  __v: 0
}