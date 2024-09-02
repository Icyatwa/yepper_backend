// ImportAdRoutes.js
const express = require('express');
const router = express.Router();
const importAdController = require('../controllers/ImportAdController');

router.post('/', importAdController.createImportAd);
router.get('/', importAdController.getAllAds);

router.get('/manufacturing', importAdController.getManufacturingAds);
router.get('/technology', importAdController.getTechnologyAds);
router.get('/agriculture', importAdController.getAgricultureAds);
router.get('/retail', importAdController.getRetailAds);
router.get('/services', importAdController.getServicesAds);
router.get('/hospitality', importAdController.getHospitalityAds);
router.get('/transportation-logistics', importAdController.getTransportationAndLogisticsAds);
router.get('/real-estate', importAdController.getRealEstateAds);

router.get('/:id', importAdController.getAdById);
router.get('/ads/:userId', importAdController.getAdsByUserId);
router.get('/ads/:userId/with-clicks', importAdController.getAdsByUserIdWithClicks);

module.exports = router;

