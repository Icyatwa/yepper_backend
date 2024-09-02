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
      templateType,
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
      templateType,
    });

    const savedImportAd = await newImportAd.save();
    res.status(201).json(savedImportAd);
  } catch (error) {
    console.error('MongoDB Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}];

exports.getAdById = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await ImportAd.findById(id);

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    const template = `
      <div class="${ad.templateType}">
        ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="Ad Image"/>` : ''}
        ${ad.pdfUrl ? `<a href="${ad.pdfUrl}" target="_blank">View PDF</a>` : ''}
        ${ad.videoUrl ? `<video controls src="${ad.videoUrl}"></video>` : ''}
        <p>${ad.adDescription}</p>
      </div>
      <style>
        ${generateTemplateStyles(ad.templateType)}
      </style>
    `;

    const scriptContent = `
      document.write(\`${template}\`);
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(scriptContent);
  } catch (error) {
    console.error('MongoDB Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

function generateTemplateStyles(templateType) {
  switch (templateType) {
    case 'banner':
      return `
        .banner {
          height: 150px;
          border: 2px solid #ddd;
          background-color: #f9f9f9;
          width: 100%;
          text-align: center;
          padding: 10px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .banner img {
          max-height: 100px;
          object-fit: contain;
        }
      `;
    case 'pop-up':
      return `
        .pop-up {
          width: 400px;
          height: 300px;
          border: 2px solid #4caf50;
          background-color: #e8f5e9;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
          padding: 20px;
          text-align: center;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .pop-up img {
          max-width: 100%;
          border-radius: 10px;
          margin-bottom: 15px;
        }
        .pop-up p {
          margin: 0;
        }
      `;
    case 'pop-down':
      return `
        .pop-down {
          height: 150px;
          border: 2px solid #f44336;
          background-color: #ffebee;
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          text-align: center;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
          padding: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .pop-down img {
          max-height: 100px;
          object-fit: contain;
          margin-bottom: 10px;
        }
      `;
    case 'sidebar':
      return `
        .sidebar {
          width: 300px;
          height: 600px;
          border: 2px solid #3f51b5;
          background-color: #e8eaf6;
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          padding: 15px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .sidebar img {
          max-width: 100%;
          border-radius: 10px;
          margin-bottom: 15px;
        }
      `;
    case 'fullscreen':
      return `
        .fullscreen {
          width: 100%;
          height: 100vh;
          color: #fff;
          position: fixed;
          top: 0;
          left: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          box-sizing: border-box;
          text-align: center;
          overflow: hidden;
        }
        .fullscreen img {
          max-width: 100%;
          max-height: 80%;
          border-radius: 10px;
          margin-bottom: 15px;
        }
        .fullscreen p {
          margin: 0;
          font-size: 1.5em;
        }
      `;
    default:
      return '';
  }
}


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
    formData.append('category', selectedCategory);
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

import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const AdAPIPage = () => {
  const location = useLocation();
  const { apiUrl } = location.state || {};

  const embedCode = `
    <script type="text/javascript">
      (function() {
        var script = document.createElement('script');
        script.src = '${apiUrl}';  // Uses the unique ad URL
        script.async = true;
        document.body.appendChild(script);
      })();
    </script>
  `;

  return (
    <div>
      <h1>Your Ad Embed Code</h1>
      <p>Copy and paste the following code into your website's HTML where you want the ad to appear:</p>
      <pre>
        <code>{embedCode}</code>
      </pre>
      <Link to='/basic-dash'>Dashboard</Link>
    </div>
  );
};
export default AdAPIPage;

import React, { useEffect } from 'react';

function APITest() {
  useEffect(() => {
    fetch('http://localhost:5000/api/importAds/66d437f4f739ce0a5bf4f364')
      .then(response => response.text())
      .then(adContent => {
        const adContainer = document.createElement('div');
        adContainer.innerHTML = adContent;
        document.body.appendChild(adContainer);
      })
      .catch(error => console.error('Error loading ad:', error));
  }, []);

  return (
    <div>
      This page will act as a person who has a website will use to add the API I'll give him.
    </div>
  );
}

export default APITest;

the ad(image) is not appearing, to prove this i copied the link of ad(http://localhost:5000/api/importAds/66d437f4f739ce0a5bf4f364)
and pasted it in the URL to test but instead it gave me this:
document.write(`
  <div class="fullscreen">
    <img src="/uploads/1725183985682-gutter cleaning-rafiki.png" alt="Ad Image"/>
    
    
    <p>OW yeye ya</p>
  </div>
  <style>
    
    .fullscreen {
      width: 100%;
      height: 100vh;
      color: #fff;
      position: fixed;
      top: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
      overflow: hidden;
    }
    .fullscreen img {
      max-width: 100%;
      max-height: 80%;
      border-radius: 10px; 
      margin-bottom: 15px;
    }
    .fullscreen p {
      margin: 0;
      font-size: 1.5em;
    }
  
  </style>
`);
