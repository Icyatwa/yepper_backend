// WebsiteController.js
const Website = require('../models/WebsiteModel');

exports.createWebsite = async (req, res) => {
  try {
    const { name, link, logoUrl } = req.body;

    const newWebsite = new Website({
      name,
      link,
      logoUrl
    });

    const savedWebsite = await newWebsite.save();
    res.status(201).json(savedWebsite);
  } catch (error) {
    console.error('MongoDB Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
