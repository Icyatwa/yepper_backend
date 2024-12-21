// WaitlistRoutes.js
const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/WaitlistController');

router.post('/', waitlistController.createWaitlist);
router.get('/check', waitlistController.checkWaitlistStatus);
router.delete('/cancel', waitlistController.cancelWaitlist);

module.exports = router;
