// AdCategoryModel.js
const mongoose = require('mongoose');

const adCategorySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the owner
  categoryName: { type: String, required: true, minlength: 3 },
  description: { type: String, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },
  customAttributes: { type: Map, of: String }, // Allows flexibility for custom attributes
  createdAt: { type: Date, default: Date.now }
});

// Virtual for AdSpaces that belong to this category
adCategorySchema.virtual('adSpaces', {
  ref: 'AdSpace',
  localField: '_id',
  foreignField: 'categoryId',
});

adCategorySchema.index({ ownerId: 1 }); // Adding an index for frequent queries

module.exports = mongoose.model('AdCategory', adCategorySchema);
