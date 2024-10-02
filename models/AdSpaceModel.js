// // AdSpaceModel.js
// const mongoose = require('mongoose');

// const adSpaceSchema = new mongoose.Schema({
//   categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory', required: true },
//   spaceType: { type: String, required: true, enum: ['Header', 'Sidebar', 'Footer'] },
//   price: { type: Number, required: true, min: 0 },
//   availability: { type: Number, required: true, min: 1 },
//   userCount: { type: Number, required: true, min: 1 },
//   instructions: { type: String, maxlength: 500 },
//   createdAt: { type: Date, default: Date.now }
// });

// adSpaceSchema.index({ categoryId: 1 }); // Index for faster lookups

// module.exports = mongoose.model('AdSpace', adSpaceSchema);

// AdSpaceModel.js
const mongoose = require('mongoose');

const adSpaceSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory', required: true },
  spaceType: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  availability: { type: Boolean, default: true },
  userCount: { type: Number, default: 0 },
  instructions: { type: String },
  apiCodes: {
    HTML: { type: String },
    JavaScript: { type: String },
    PHP: { type: String },
    Python: { type: String },
  }, // Object to store API codes for different languages
  createdAt: { type: Date, default: Date.now }
});

adSpaceSchema.index({ categoryId: 1 }); // Index for faster lookups

module.exports = mongoose.model('AdSpace', adSpaceSchema);