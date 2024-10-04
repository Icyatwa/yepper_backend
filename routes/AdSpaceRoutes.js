// AdSpaceRoutes.js
const express = require('express');
const router = express.Router();
const adSpaceController = require('../controllers/AdSpaceController');

router.post('/', adSpaceController.createSpace);
router.get('/', adSpaceController.getAllSpaces);
router.get('/:categoryId', adSpaceController.getSpaces);
// router.get('/ads', adSpaceController.getAdContent);

module.exports = router;