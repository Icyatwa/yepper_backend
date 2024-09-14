
// // models/ImportAdModel.js
// const mongoose = require('mongoose');

// const importAdSchema = new mongoose.Schema({
//   userId: { type: String, required: true },
//   imageUrl: { type: String },
//   pdfUrl: { type: String },
//   videoUrl: { type: String },
//   categories: [{ type: String, required: true }],  // Array to store selected categories
//   businessName: { type: String, required: true },
//   businessLocation: { type: String, required: true },
//   adDescription: { type: String, required: true },
//   templateType: { type: String, required: true },
// });

// module.exports = mongoose.model('ImportAd', importAdSchema);

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

