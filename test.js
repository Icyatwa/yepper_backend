// ImportAdController.js
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
      businessName,
      businessLocation,
      adDescription,
      templateType, // Added templateType to destructure
    } = req.body;
    
    const categories = ['manufacturing', 'technology', 'agriculture', 'retail', 'services', 'hospitality', 'transportationAndLogistics', 'realEstate'];
    const selectedCategory = categories.find(category => req.body[category]);

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

    const newImportAd = new ImportAd({
      userId,
      imageUrl,
      pdfUrl,
      videoUrl,
      [selectedCategory]: selectedCategory,
      businessName,
      businessLocation,
      adDescription,
      templateType, // Added templateType
    });

    const savedImportAd = await newImportAd.save();
    res.status(201).json(savedImportAd);
  } catch (error) {
    console.error('MongoDB Error:', error);
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

exports.getAdsByUserId = async (req, res) => {
  const userId = req.params.userId;
  try {
    const ads = await ImportAd.find({ userId });
    if (!ads || ads.length === 0) {
      return res.status(404).json({ message: 'No ads found for this user' });
    }
    res.status(200).json(ads); // Send the ads array directly
  } catch (error) {
    console.error('Error fetching ad by user ID:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ImportAdRoutes.js
const express = require('express');
const router = express.Router();
const importAdController = require('../controllers/ImportAdController');

router.post('/', importAdController.createImportAd);
router.get('/', importAdController.getAllAds);
router.get('/ads/:userId', importAdController.getAdsByUserId);
router.get('/ads/:userId/with-clicks', importAdController.getAdsByUserIdWithClicks);

module.exports = router;

// TemplateSelection.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './template.css';

const TemplateSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { file, userId, businessName, businessLocation, adDescription, selectedCategory } = location.state || {};

  const [templateType, setSelectedTemplate] = useState('');

  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!templateType) {
      alert('Please select a template');
      return;
    }

    navigate('/ad-preview', {
      state: {
        file,
        userId,
        businessName,
        businessLocation,
        adDescription,
        selectedCategory,
        templateType,
      },
    });
  };

  return (
    <div className="template-selection">
      <h1>Select an Ad Template</h1>
      <form onSubmit={handleNext}>
        <div>
          <input
            type="radio"
            id="banner"
            name="template"
            value="banner"
            checked={templateType === 'banner'}
            onChange={handleTemplateChange}
          />
          <label htmlFor="banner">Banner</label>
        </div>
        <div>
          <input
            type="radio"
            id="popup"
            name="template"
            value="popup"
            checked={templateType === 'popup'}
            onChange={handleTemplateChange}
          />
          <label htmlFor="popup">Pop-up</label>
        </div>
        <div>
          <input
            type="radio"
            id="popdown"
            name="template"
            value="popdown"
            checked={templateType === 'popdown'}
            onChange={handleTemplateChange}
          />
          <label htmlFor="popdown">Pop-down</label>
        </div>
        <button type="submit">Next: Preview Ad</button>
      </form>
    </div>
  );
};

export default TemplateSelection;


import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './adPreview.css';

const AdPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { file, userId, businessName, businessLocation, adDescription, selectedCategory, templateType } = location.state || {};

  const [adContent, setAdContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setAdContent(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);

  useEffect(() => {
    if (templateType === 'pop-up') {
      const interval = setInterval(() => {
        setIsVisible((prev) => !prev);
      }, 2000); // Toggle visibility every 2 seconds
      return () => clearInterval(interval); // Clear interval on component unmount
    } else {
      setIsVisible(true); // Show ad without interval for other templates
    }
  }, [templateType]);

  const handlePublish = async (e) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('businessName', businessName);
    formData.append('businessLocation', businessLocation);
    formData.append('adDescription', adDescription);
    formData.append('category', selectedCategory);
    formData.append('templateType', templateType);
    try {
      const response = await axios.post('http://localhost:5000/api/importAds', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Server response:', response.data);
      navigate('/ad-api');
    } catch (error) {
      console.error('Error during ad upload:', error);
      setError('An error occurred while uploading the ad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ad-preview">
      <h1>Preview Your Ad</h1>
      <div className={`ad-template ${templateType}`}>
        {templateType === 'pop-up' ? (
          isVisible && (
            <div className="pop-up-container">
              {adContent && <img src={adContent} alt="Ad" />}
              <p>{adDescription}</p>
            </div>
          )
        ) : (
          <div className={templateType}>
            {adContent && <img src={adContent} alt="Ad" />}
            <p>{adDescription}</p>
          </div>
        )}
      </div>
      <button onClick={handlePublish}>Publish Ad</button>
    </div>
  );
};

export default AdPreview;

