// AdSpaceController.js
const AdSpace = require('../models/AdSpaceModel');

exports.createSpace = async (req, res) => {
  try {
    const { categoryId, spaceType, price, availability, userCount, instructions } = req.body;

    // Check for missing fields
    if (!categoryId || !spaceType || !price || !availability || !userCount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newSpace = new AdSpace({ categoryId, spaceType, price, availability, userCount, instructions });
    const savedSpace = await newSpace.save();
    res.status(201).json(savedSpace);
  } catch (error) {
    console.error('Error saving ad space:', error);  // Log the actual error
    res.status(500).json({ message: 'Failed to create ad space', error });
  }
};

exports.getSpaces = async (req, res) => {
  try {
    const spaces = await AdSpace.find({ categoryId: req.params.categoryId });
    res.status(200).json(spaces);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ad spaces', error });
  }
};