// WebsiteController.js
const Website = require('../models/WebsiteModel');

exports.createWebsite = async (req, res) => {
  try {
    const { ownerId, websiteName, websiteLink, logoUrl } = req.body;

    if (!ownerId || !websiteName || !websiteLink) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if website URL is already in use
    const existingWebsite = await Website.findOne({ websiteLink });
    if (existingWebsite) {
      return res.status(409).json({ message: 'Website URL already exists' });
    }

    const newWebsite = new Website({
      ownerId,
      websiteName,
      websiteLink,
      logoUrl
    });

    const savedWebsite = await newWebsite.save();
    res.status(201).json(savedWebsite);
  } catch (error) {
    console.error('Error creating website:', error); // Log detailed error
    res.status(500).json({ message: 'Failed to create website', error });
  }
};

exports.getWebsitesByOwner = async (req, res) => {
  const { ownerId } = req.params;

  try {
    const websites = await Website.find({ ownerId });
    res.status(200).json(websites);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch websites', error });
  }
};
