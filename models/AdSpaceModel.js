// AdSpaceModel.js
const mongoose = require('mongoose');

const adSpaceSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory', required: true },
  spaceType: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  availability: { type: String, required: true },
  // availability: { type: Boolean, default: true },
  userCount: { type: Number, default: 0 },
  instructions: { type: String },
  apiCodes: {
    HTML: { type: String },
    JavaScript: { type: String },
    PHP: { type: String },
    Python: { type: String },
  },
  selectedAds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImportAd' }],  // Added selectedAds reference
  createdAt: { type: Date, default: Date.now }
});

adSpaceSchema.index({ categoryId: 1 }); // Index for faster lookups

adSpaceSchema.virtual('remainingUserCount').get(function() {
  return this.userCount - this.selectedAds.length;
});

adSpaceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('AdSpace', adSpaceSchema);