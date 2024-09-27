const ImportAd = require('../models/ImportAdModel');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|pdf|mp4/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

exports.createImportAd = [upload.single('file'), async (req, res) => {
  try {
    const {
      userId,
      categories,
      businessName,
      businessWebsite,
      businessLocation,
      businessContacts,
      adDescription,
      templateType,
    } = req.body;
  
    let imageUrl = '';
    let pdfUrl = '';
    let videoUrl = '';
  
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(__dirname, '../uploads', fileName);

      if (req.file.mimetype.startsWith('image')) {
        await sharp(req.file.buffer)
          .resize(300, 300)
          .toFile(filePath);
        imageUrl = `/uploads/${fileName}`;
      } else {
        await fs.promises.writeFile(filePath, req.file.buffer);
        if (req.file.mimetype === 'application/pdf') {
          pdfUrl = `/uploads/${fileName}`;
        } else if (req.file.mimetype.startsWith('video')) {
          videoUrl = `/uploads/${fileName}`;
        }
      }
    }
  
    const newRequestAd = new ImportAd({
      userId,
      imageUrl,
      pdfUrl,
      videoUrl,
      categories,
      businessName,
      businessWebsite,
      businessLocation,
      businessContacts,
      adDescription,
      templateType,
    });
  
    const savedRequestAd = await newRequestAd.save();
    res.status(201).json(savedRequestAd);
  } catch (error) {
    console.error('MongoDB Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}];

// ImportAdRoutes.js
const express = require('express');
const router = express.Router();
const importAdController = require('../controllers/ImportAdController');

router.post('/', importAdController.createImportAd);
router.get('/', importAdController.getAllAds);

router.get('/:id', importAdController.getAdById);
router.get('/ad/:id', importAdController.getAdByIds);
router.get('/ads/:userId', importAdController.getAdsByUserId);
router.get('/ads/:userId/with-clicks', importAdController.getAdsByUserIdWithClicks);

module.exports = router;