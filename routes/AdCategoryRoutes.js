// AdCategoryRoutes.js
const express = require('express');
const router = express.Router();
const adCategoryController = require('../controllers/AdCategoryController');

router.post('/', adCategoryController.createCategory);
router.get('/', adCategoryController.getCategories);

module.exports = router;