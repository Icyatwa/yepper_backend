// models/AdClickModel.js
const mongoose = require('mongoose');

const adClickSchema = new mongoose.Schema({
  adId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportAd', required: true },
  website: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdClick', adClickSchema);
