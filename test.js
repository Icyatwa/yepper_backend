// WebsiteModel.js
const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  websiteName: { type: String, required: true },
  websiteLink: { type: String, required: true, unique: true },
  logoUrl: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

// Index to speed up queries for websites by owner
websiteSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Website', websiteSchema);

// WebsiteController.js
const Website = require('../models/WebsiteModel');

exports.createWebsite = async (req, res) => {
  try {
    const { ownerId, websiteName, websiteLink, logoUrl } = req.body;

    if (!ownerId || !websiteName || !websiteLink) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if website URL is already in use
    const existingWebsite = await Website.findOne({ websiteLink });
    if (existingWebsite) {
      return res.status(409).json({ message: 'Website URL already exists' });
    }

    const newWebsite = new Website({
      ownerId,
      websiteName,
      websiteLink,
      logoUrl
    });

    const savedWebsite = await newWebsite.save();
    res.status(201).json(savedWebsite);
  } catch (error) {
    console.error('Error creating website:', error); // Log detailed error
    res.status(500).json({ message: 'Failed to create website', error });
  }
};

exports.getWebsitesByOwner = async (req, res) => {
  const { ownerId } = req.params;

  try {
    const websites = await Website.find({ ownerId });
    res.status(200).json(websites);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch websites', error });
  }
};

// Website.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import axios from 'axios';

function Website() {
  const { user } = useClerk();
  const ownerId = user?.id;
  const [websiteName, setWebsiteName] = useState('');
  const [websiteLink, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!websiteLink) {
      console.error('Website URL is required');
      return;
    }
  
    try {
      const websiteData = {
        ownerId,
        websiteName,
        websiteLink,
        logoUrl,
      };
  
      const response = await axios.post('http://localhost:5000/api/websites', websiteData, {
        headers: {
          'Content-Type': 'application/json', // Correct content type for JSON
        },
      });
  
      if (response.status === 201) {
        navigate('/ads', { state: { websiteId: response.data._id } });
      } else {
        console.error('Failed to create website');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h2>Create Website</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="websiteName"
          placeholder="Website Name"
          value={websiteName}
          onChange={(e) => setWebsiteName(e.target.value)}
          required
        />
        <input
          type="text"
          name="websiteUrl"
          placeholder="Website URL"
          value={websiteLink}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          required
        />
        <input
          type="text"
          name="logoUrl"
          placeholder="Logo URL (optional)"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />
        <button type="submit">Create Website</button>
      </form>
    </div>
  );
}

export default Website;

