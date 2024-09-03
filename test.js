// models/ImportAdModel.js
const mongoose = require('mongoose');

const importAdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },
  categories: [{ type: String, required: true }],  // Array to store selected categories
  businessName: { type: String, required: true },
  businessLocation: { type: String, required: true },
  adDescription: { type: String, required: true },
  templateType: { type: String, required: true },
});

module.exports = mongoose.model('ImportAd', importAdSchema);

// controller
exports.createImportAd = [upload.single('file'), async (req, res) => {
  try {
    const {
      userId,
      businessName,
      businessLocation,
      adDescription,
      templateType,
    } = req.body;
    
    const categories = [
      'manufacturing', 'technology', 'agriculture', 
      'retail', 'services', 'hospitality', 
      'transportationAndLogistics', 'realEstate'
    ];

    let selectedCategory = {};
    categories.forEach(category => {
      if (req.body[category]) {
        selectedCategory[category] = true;
      } else {
        selectedCategory[category] = false;
      }
    });

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
      ...selectedCategory,
      businessName,
      businessLocation,
      adDescription,
      templateType,
    });

    const savedImportAd = await newImportAd.save();
    res.status(201).json(savedImportAd);
  } catch (error) {
    console.error('MongoDB Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}];

// Categories.js
import React, { useState } from 'react';
import { useClerk } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";

function Categories() {
  const { user } = useClerk();
  const location = useLocation();
  const { file } = location.state || {};
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState(null);
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategories(prevState =>
      prevState.includes(value)
        ? prevState.filter(category => category !== value)
        : [...prevState, value]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }
    setError(null);
    navigate('/business', {
      state: {
        file,
        selectedCategories,
        userId: user.id,
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {['manufacturing', 'technology', 'agriculture', 'retail', 'services', 'hospitality', 'transportationAndLogistics', 'realEstate'].map(category => (
        <div key={category}>
          <input
            type="checkbox"
            id={category}
            name="category"
            value={category}
            checked={selectedCategories.includes(category)}
            onChange={handleCategoryChange}
          />
          <label htmlFor={category}>{category}</label>
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}
export default Categories;

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
    <form onSubmit={handleNext}>
      <input
        type="radio"
        id="banner"
        name="template"
        value="banner"
        checked={templateType === 'banner'}
        onChange={handleTemplateChange}
      />
      <input
        type="radio"
        id="popup"
        name="template"
        value="popup"
        checked={templateType === 'popup'}
        onChange={handleTemplateChange}
      />
      <input
        type="radio"
        id="popdown"
        name="template"
        value="popdown"
        checked={templateType === 'popdown'}
        onChange={handleTemplateChange}
      />
      <input
        type="radio"
        id="sidebar"
        name="template"
        value="sidebar"
        checked={templateType === 'sidebar'}
        onChange={handleTemplateChange}
      />
      <input
        type="radio"
        id="fullscreen"
        name="template"
        value="fullscreen"
        checked={templateType === 'fullscreen'}
        onChange={handleTemplateChange}
      />
      <input
        type="radio"
        id="native"
        name="template"
        value="native"
        checked={templateType === 'native'}
        onChange={handleTemplateChange}
      />
      <input
        type="radio"
        id="carousel"
        name="template"
        value="carousel"
        checked={templateType === 'carousel'}
        onChange={handleTemplateChange}
      />
      <button type="submit">Next: Preview Ad</button>
    </form>
  );
};
export default TemplateSelection;

// AdPreview.js
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
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setIsVisible(true);
    }
  }, [templateType]);

  const handlePublish = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('businessName', businessName);
    formData.append('businessLocation', businessLocation);
    formData.append('adDescription', adDescription);
    formData.append('selectedCategory', selectedCategory);
    formData.append('templateType', templateType);
  
    try {
      const response = await axios.post('http://localhost:5000/api/importAds', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      const apiUrl = `http://localhost:5000/api/importAds/${response.data._id}`;
      navigate('/ad-api', { state: { apiUrl } });
    } catch (error) {
      console.error('Error during ad upload:', error);
      setError('An error occurred while uploading the ad');
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div className="ad-preview-container">
      <h1>Preview Your Ad</h1>
      <div className="ad-template-container">
        {isVisible && (
          <div className={`ad-template ${templateType}`}>
            {adContent && <img src={adContent} alt="Ad" />}
            <p>{adDescription}</p>
          </div>
        )}
      </div>
      {error && <div className="error">{error}</div>}
      <button onClick={handlePublish} disabled={loading}>
        {loading ? 'Publishing...' : 'Publish Ad'}
      </button>
    </div>
  );
};
export default AdPreview;
