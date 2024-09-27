// AdCategoryController.js
const AdCategory = require('../models/AdCategoryModel');

exports.createCategory = async (req, res) => {
  try {
    const { ownerId, categoryName, description, price, customAttributes } = req.body;
    const newCategory = new AdCategory({
      ownerId,
      categoryName,
      description,
      price,
      customAttributes: customAttributes || {} // Add custom attributes for custom categories
    });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category', error });
  }
};

exports.getCategories = async (req, res) => {
  const { ownerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const categories = await AdCategory.find({ ownerId })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await AdCategory.countDocuments({ ownerId });

    res.status(200).json({
      categories,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error });
  }
};