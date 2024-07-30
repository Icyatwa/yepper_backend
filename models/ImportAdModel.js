const mongoose = require('mongoose');

const ImportAdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String }
}, { timestamps: true });

const ImportAd = mongoose.model('ImportAd', ImportAdSchema);

module.exports = ImportAd;
