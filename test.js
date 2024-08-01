
const mongoose = require('mongoose');

const ImportAdSchema = new mongoose.Schema({
  // user ID
  userId: { type: String, required: true },

  // ad
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String },

  // categories
  manufacturing: { type: String },
  technology: { type: String },
  agriculture: { type: String },
  retail: { type: String },
  services: { type: String },
  hospitality: { type: String },
  transportionAndLogistics: { type: String },
  realEstate: { type: String },

  // business
  businessName: { type: String, required: true },
  businessLocation: { type: String },
  adDescription: { type: String, required: true },
}, { timestamps: true });

const ImportAd = mongoose.model('ImportAd', ImportAdSchema);

module.exports = ImportAd;

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
    } = req.body;
    
    const categories = ['manufacturing', 'technology', 'agriculture', 'retail', 'services', 'hospitality', 'transportionAndLogistics', 'realEstate'];
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
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getAdsByUserId = async (req, res) => {
  const userId = req.params.userId;
  try {
    const ad = await ImportAd.find({ userId });
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.status(200).json(ad);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}; 


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ImportAd = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => { 
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try{
      if(!file){
        alert('Please choose the Ad file');
      }else{
        navigate('/categories',{
          state:{
            file
          }
        })
      }

    }catch(error){
      alert('An error happened please check console');
      console.log(error);
    }

  };

  return (
    <div className='AdRegister'>
      <div className='registerPage'>
        <form className='registerForm' onSubmit={handleSave}>
          <input
            type="file"
            accept="image/*,application/pdf,video/*"
            onChange={handleFileChange}
            required
            className='inputField'
          />
          {error && <p className='errorMessage'>{error}</p>}
          <button type="submit" disabled={loading} className='submitButton'>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ImportAd;


import React, { useState } from 'react';
import { useClerk } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';

function Categories() {
  const { user } = useClerk();
  const locationVar = useLocation();
  const { file } = locationVar.state || {};
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }
    setError(null);
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);
    formData.append('businessName', 'Example Business'); // Replace with actual business name
    formData.append('adDescription', 'Example Description'); // Replace with actual description
    formData.append(selectedCategory, selectedCategory); // Append the selected category

    try {
      const response = await axios.post('/api/importAd', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data);
      navigate('/success'); // Navigate to success page or any other page
    } catch (error) {
      console.error(error);
      setError('An error occurred while uploading the ad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Select a Category</h1>
      <form onSubmit={handleSubmit}>
        {error && <p className='error'>{error}</p>}
        <div>
          <input
            type="radio"
            id="manufacturing"
            name="category"
            value="manufacturing"
            checked={selectedCategory === 'manufacturing'}
            onChange={handleCategoryChange}
          />
          <label htmlFor="manufacturing">Manufacturing</label>
        </div>
        <div>
          <input
            type="radio"
            id="technology"
            name="category"
            value="technology"
            checked={selectedCategory === 'technology'}
            onChange={handleCategoryChange}
          />
          <label htmlFor="technology">Technology</label>
        </div>
        <div>
          <input
            type="radio"
            id="agriculture"
            name="category"
            value="agriculture"
            checked={selectedCategory === 'agriculture'}
            onChange={handleCategoryChange}
          />
          <label htmlFor="agriculture">Agriculture</label>
        </div>
        <div>
          <input
            type="radio"
            id="retail"
            name="category"
            value="retail"
            checked={selectedCategory === 'retail'}
            onChange={handleCategoryChange}
          />
          <label htmlFor="retail">Retail</label>
        </div>
        <div>
          <input
            type="radio"
            id="services"
            name="category"
            value="services"
            checked={selectedCategory === 'services'}
            onChange={handleCategoryChange}
          />
          <label htmlFor="services">Services</label>
        </div>
        <div>
          <input
            type="radio"
            id="hospitality"
            name="category"
            value="hospitality"
            checked={selectedCategory === 'hospitality'}
            onChange={handleCategoryChange}
          />
          <label htmlFor="hospitality">Hospitality</label>
        </div>
        <div>
          <input
            type="radio"
            id="transportionAndLogistics"
            name="category"
            value="transportionAndLogistics"
            checked={selectedCategory === 'transportionAndLogistics'}
            onChange={handleCategoryChange}
          />
          <label htmlFor="transportionAndLogistics">Transportation and Logistics</label>
        </div>
        <div>
          <input
            type="radio"
            id="realEstate"
            name="category"
            value="realEstate"
            checked={selectedCategory === 'realEstate'}
            onChange={handleCategoryChange}
          />
          <label htmlFor="realEstate">Real Estate</label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

export default Categories;
