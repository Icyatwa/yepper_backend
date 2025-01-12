// // AdCategoryModel.js
// const mongoose = require('mongoose');

// const adCategorySchema = new mongoose.Schema({
//   ownerId: { type: String, required: true },
//   websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true },
//   categoryName: { type: String, required: true, minlength: 3 },
//   description: { type: String, maxlength: 500 },
//   price: { type: Number, required: true, min: 0 },
//   customAttributes: { type: Map, of: String },
//   createdAt: { type: Date, default: Date.now }
// });

// adCategorySchema.virtual('adSpaces', {
//   ref: 'AdSpace',
//   localField: '_id',
//   foreignField: 'categoryId',
// });

// adCategorySchema.index({ ownerId: 1 }); // Adding an index for frequent queries

// module.exports = mongoose.model('AdCategory', adCategorySchema);

// AdCategoryModel.js
const mongoose = require('mongoose');

const adCategorySchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true },
  categoryName: { type: String, required: true, minlength: 3 },
  description: { type: String, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },
  spaceType: { type: String, required: true },
  userCount: { type: Number, default: 0 },
  instructions: { type: String },
  customAttributes: { type: Map, of: String },
  apiCodes: {
    HTML: { type: String },
    JavaScript: { type: String },
    PHP: { type: String },
    Python: { type: String },
  },
  selectedAds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImportAd' }],
  webOwnerEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

adCategorySchema.index({ ownerId: 1, websiteId: 1, categoryName: 1 });

const AdCategory = mongoose.model('AdCategory', adCategorySchema);
module.exports = AdCategory;