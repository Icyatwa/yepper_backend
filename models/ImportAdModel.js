// models/ImportAdModel.js
const mongoose = require('mongoose');

const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },

  manufacturing: { type: Boolean },
  technology: { type: Boolean },
  agriculture: { type: Boolean },
  retail: { type: Boolean },
  services: { type: Boolean },
  hospitality: { type: Boolean },
  transportationAndLogistics: { type: Boolean },
  realEstate: { type: Boolean },

  businessName: { type: String, required: true },
  businessLocation: { type: String, required: true },
  adDescription: { type: String, required: true },
  
  templateType: { type: String, required: true },
});

module.exports = mongoose.model('ImportAd', importAdSchema);
