
// AdSpaceController.js
const AdSpace = require('../models/AdSpaceModel');

exports.createSpace = async (req, res) => {
  try {
    const { categoryId, spaceType, price, availability, userCount, instructions } = req.body;
    const newSpace = new AdSpace({ categoryId, spaceType, price, availability, userCount, instructions });
    const savedSpace = await newSpace.save();
    res.status(201).json(savedSpace);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create ad space', error });
  }
};

// AdSpaceRoutes.js
const express = require('express');
const router = express.Router();
const adSpaceController = require('../controllers/AdSpaceController');

router.post('/', adSpaceController.createSpace);

module.exports = router;

// Spaces
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../../pages/header';

function Spaces() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, selectedCategories, prices, customCategory } = location.state; // Passed from Ads.js
  const [spaces, setSpaces] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle space selection for each category
  const handleSpaceChange = (category, space, value) => {
    setSpaces((prevState) => ({
      ...prevState,
      [category]: {
        ...prevState[category],
        [space]: value,
      },
    }));
  };

  // Function to submit data to the backend
  const submitSpacesToDatabase = async () => {
    setLoading(true);
    try {
      // Extracting all space data to send to the backend
      for (const category in spaces) {
        const spaceData = spaces[category];
        if (spaceData.header || spaceData.sidebar) {
          // Send each space data separately
          await axios.post('http://localhost:5000/api/ad-spaces', {
            categoryId: categoryId, // assuming categoryId is available for all spaces
            spaceType: spaceData.header ? 'Header' : 'Sidebar', // choose Header or Sidebar
            price: spaceData.price,
            availability: 1, // hardcoded as per schema (can be dynamic)
            userCount: spaceData.userCount,
            instructions: spaceData.instructions,
          });
        }
      }

      // After successful submission, navigate to the APIs page
      navigate('/apis', {
        state: { selectedCategories, prices, spaces, customCategory },
      });
    } catch (error) {
      console.error('Failed to submit spaces to the database:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render space checkboxes for each category
  const renderSpacesForCategory = (category) => (
    <div key={category}>
      <h3>{category.charAt(0).toUpperCase() + category.slice(1)} Category</h3>
      <label>
        <input
          type="checkbox"
          onChange={(e) => handleSpaceChange(category, 'header', e.target.checked)}
        />
        Header
      </label>
      {spaces[category]?.header && (
        <div>
          <input
            type="number"
            placeholder="Price"
            onChange={(e) => handleSpaceChange(category, 'price', e.target.value)}
          />
          <input
            type="number"
            placeholder="User Count"
            onChange={(e) => handleSpaceChange(category, 'userCount', e.target.value)}
          />
          <input
            type="text"
            placeholder="Instructions"
            onChange={(e) => handleSpaceChange(category, 'instructions', e.target.value)}
          />
        </div>
      )}

      <label>
        <input
          type="checkbox"
          onChange={(e) => handleSpaceChange(category, 'sidebar', e.target.checked)}
        />
        Sidebar
      </label>
      {spaces[category]?.sidebar && (
        <div>
          <input
            type="number"
            placeholder="Price"
            onChange={(e) => handleSpaceChange(category, 'price', e.target.value)}
          />
          <input
            type="number"
            placeholder="User Count"
            onChange={(e) => handleSpaceChange(category, 'userCount', e.target.value)}
          />
          <input
            type="text"
            placeholder="Instructions"
            onChange={(e) => handleSpaceChange(category, 'instructions', e.target.value)}
          />
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Header />
      <h2>Select Ad Spaces</h2>
      {selectedCategories.banner && renderSpacesForCategory('banner')}
      {selectedCategories.popup && renderSpacesForCategory('popup')}
      {selectedCategories.custom && renderSpacesForCategory('custom')}

      <button onClick={submitSpacesToDatabase} disabled={loading}>
        {loading ? 'Saving...' : 'Continue to View APIs'}
      </button>
    </div>
  );
}

export default Spaces;

Spaces.js:29 
        
        
       POST http://localhost:5000/api/ad-spaces 500 (Internal Server Error)