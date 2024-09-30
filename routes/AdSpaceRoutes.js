// AdSpaceRoutes.js
const express = require('express');
const router = express.Router();
const adSpaceController = require('../controllers/AdSpaceController');

router.post('/', adSpaceController.createSpace);
router.get('/:categoryId', adSpaceController.getSpaces);

module.exports = router;