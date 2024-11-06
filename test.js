// ImportAdModel.js
const mongoose = require('mongoose');
const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  adOwnerEmail: { type: String, required: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },
  businessName: { type: String, required: true },
  businessLocation: { type: String, required: true },
  adDescription: { type: String, required: true },
  selectedWebsites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Website' }],
  selectedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdCategory' }],
  selectedSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdSpace' }],
  approved: { type: Boolean, default: false },
  confirmed: { type: Boolean, default: false },
});

module.exports = mongoose.model('ImportAd', importAdSchema);

// ImportAdController.js
const ImportAd = require('../models/ImportAdModel');
const AdSpace = require('../models/AdSpaceModel');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const sendEmailNotification = require('./emailService');

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
      adOwnerEmail,
      businessName,
      businessLocation,
      adDescription,
      selectedWebsites,
      selectedCategories,
      selectedSpaces,
    } = req.body;

    // Parse JSON strings
    const websitesArray = JSON.parse(selectedWebsites);
    const categoriesArray = JSON.parse(selectedCategories);
    const spacesArray = JSON.parse(selectedSpaces);

    let imageUrl = '';
    let pdfUrl = '';
    let videoUrl = '';

    // Process uploaded file
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(__dirname, '../uploads', fileName);

      if (req.file.mimetype.startsWith('image')) {
        await sharp(req.file.buffer).resize(300, 300).toFile(filePath);
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

    // Create ImportAd entry
    const newRequestAd = new ImportAd({
      userId,
      adOwnerEmail,
      imageUrl,
      pdfUrl,
      videoUrl,
      businessName,
      businessLocation,
      adDescription,
      selectedWebsites: websitesArray,
      selectedCategories: categoriesArray,
      selectedSpaces: spacesArray,
      approved: false,
      confirmed: false
    });

    const savedRequestAd = await newRequestAd.save();

    // Get the ad spaces that the ad owner selected
    const adSpaces = await AdSpace.find({ _id: { $in: spacesArray } });

    // Push this ad to the selected spaces
    await AdSpace.updateMany(
      { _id: { $in: spacesArray } }, 
      { $push: { selectedAds: savedRequestAd._id } }
    );

    // Notify each web owner via email
    for (const space of adSpaces) {
      const emailBody = `
        <h2>New Ad Request for Your Ad Space</h2>
        <p>Hello,</p>
        <p>An advertiser has selected your ad space. Please review and approve the ad.</p>
        <p><strong>Business Name:</strong> ${businessName}</p>
        <p><strong>Description:</strong> ${adDescription}</p>
      `;
      await sendEmailNotification(space.webOwnerEmail, 'New Ad Request for Your Space', emailBody);
    }

    res.status(201).json(savedRequestAd);
  } catch (error) {
    console.error('Error importing ad:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}];

exports.getAllAds = async (req, res) => {
  try {
    const ads = await ImportAd.find();
    res.status(200).json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getAdByIds = async (req, res) => {
  const adId = req.params.id;

  try {
    const ad = await ImportAd.findById(adId)
      .lean()  // Faster loading
      .select('businessName businessLocation adDescription imageUrl pdfUrl videoUrl approved selectedWebsites selectedCategories selectedSpaces');

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.status(200).json(ad);
  } catch (error) {
    console.error('Error fetching ad by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAdsByUserId = async (req, res) => {
  const userId = req.params.userId;

  try {
    const ads = await ImportAd.find({ userId })
      .lean()  // Faster data retrieval
      .select('businessName businessLocation adDescription approved');

    if (!ads.length) {
      return res.status(404).json({ message: 'No ads found for this user' });
    }

    res.status(200).json(ads);
  } catch (error) {
    console.error('Error fetching ads by user ID:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getProjectsByUserId = async (req, res) => {
  const userId = req.params.userId;

  try {
    const approvedAds = await ImportAd.find({ userId, approved: true })
      .lean()
      .populate('selectedWebsites', 'websiteName websiteLink')
      .populate('selectedCategories', 'categoryName description')
      .populate('selectedSpaces', 'spaceType price availability')
      .select('businessName businessLocation adDescription approved selectedWebsites selectedCategories selectedSpaces');

    const pendingAds = await ImportAd.find({ userId, approved: false })
      .lean()
      .populate('selectedWebsites', 'websiteName websiteLink')
      .populate('selectedCategories', 'categoryName description')
      .populate('selectedSpaces', 'spaceType price availability')
      .select('businessName businessLocation adDescription approved selectedWebsites selectedCategories selectedSpaces');
      
    res.status(200).json({
      approvedAds,
      pendingAds
    });
  } catch (error) {
    console.error('Error fetching ads by user ID:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ImportAdRoutes.js
const express = require('express');
const router = express.Router();
const importAdController = require('../controllers/ImportAdController');

router.post('/', importAdController.createImportAd);
router.get('/', importAdController.getAllAds);
router.get('/ad/:id', importAdController.getAdByIds);
router.get('/ads/:userId', importAdController.getAdsByUserId);
router.get('/projects/:userId', importAdController.getProjectsByUserId);

module.exports = router;

// PendingAds.js
import React, { useState, useEffect } from "react";
import { useClerk } from '@clerk/clerk-react';
import './PendingAds.css';

function PendingAds() {
    const { user } = useClerk();
    const [pendingAds, setPendingAds] = useState([]);
    const [selectedAd, setSelectedAd] = useState(null);

    useEffect(() => {
        const fetchAds = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/importAds/projects/${user.id}`);
            const data = await response.json();
            setPendingAds(data.pendingAds);
        } catch (error) {
            console.error('Error fetching ads:', error);
        }
        };

        fetchAds();
    }, [user]);

    const openModal = (ad) => {
        setSelectedAd(ad);
    };

    const closeModal = () => {
        setSelectedAd(null);
    };

    return (
        <div className="pending-ads-container">
            <h2 className="title">Pending Ads</h2>
            <div className="ads-grid">
                {pendingAds.length ? (
                    pendingAds.map((ad) => (
                        <div key={ad._id} className="ad-card pending-ad-card">
                            <h3 className="business-name">{ad.businessName}</h3>
                            <p className="business-location">{ad.businessLocation}</p>
                            <p className="ad-description">{ad.adDescription.substring(0, 50)}...</p>
                            <button className="view-more-btn" onClick={() => openModal(ad)}>View More</button>
                        </div>
                    ))
                ) : (
                    <p className="no-ads-message">No pending ads</p>
                )}
            </div>

            {selectedAd && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content pending-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">{selectedAd.businessName}</h3>
                        <p className="modal-subtitle">{selectedAd.businessLocation}</p>
                        <p className="modal-description">{selectedAd.adDescription}</p>

                        <div className="modal-section">
                            <h4 className="section-title">Selected Websites</h4>
                            <ul className="website-list">
                                {selectedAd.selectedWebsites.map((website) => (
                                    <li key={website._id} className="website-item">
                                        <span className="website-name">{website.websiteName}</span>
                                        <a className="website-link" href={website.websiteLink} target="_blank" rel="noopener noreferrer">{website.websiteLink}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="modal-section">
                            <h4 className="section-title">Selected Categories</h4>
                            <ul className="category-list">
                                {selectedAd.selectedCategories.map((category) => (
                                    <li key={category._id} className="category-item">
                                        <span className="category-name">{category.categoryName}</span> - {category.description}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="modal-section">
                            <h4 className="section-title">Selected Spaces</h4>
                            <ul className="space-list">
                                {selectedAd.selectedSpaces.map((space) => (
                                    <li key={space._id} className="space-item">
                                        <span className="space-type">Type: {space.spaceType}</span>
                                        <span className="space-price">Price: ${space.price}</span>
                                        <span className="space-availability">Availability: {space.availability}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button className="close-modal-btn" onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PendingAds;
use any strategies you want but i want to see the data loads fast, they're taking soooooooo long, they're taking like 30 seconds meanwhile i want them to start appearing once a user opens a page