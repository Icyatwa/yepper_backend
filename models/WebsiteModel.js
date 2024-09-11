// models/WebsiteModel.js
const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  link: { type: String, required: true },
  logoUrl: { type: String, required: true },  // URL for the website's logo
});

module.exports = mongoose.model('Website', websiteSchema);
