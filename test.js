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
        categories,  // Expect this array directly from the form data
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

        const newImportAd = new ImportAd({
        userId,
        imageUrl,
        pdfUrl,
        videoUrl,
        categories,  // Save the array of categories directly
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
  
      const baseUrl = `${req.protocol}://${req.get('host')}`;  // Get the base URL of the server
  
      const template = `
        <div class="${ad.templateType}">
          ${ad.imageUrl ? `<img src="${baseUrl}${ad.imageUrl}" alt="Ad Image"/>` : ''}
          ${ad.pdfUrl ? `<a href="${baseUrl}${ad.pdfUrl}" target="_blank">View PDF</a>` : ''}
          ${ad.videoUrl ? `<video controls src="${baseUrl}${ad.videoUrl}"></video>` : ''}
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
    const adId = req.params.AdId;
  
    try{
      const ad = await ImportAd.findById(adId);
      if(!ad){
        return res.status(404).json({message: 'Ad not found'});
      }
      res.status(200).json(ad);
    }catch(error){
      console.error(error);
      res.status(500).json({message: 'Internal server error'});
    }
}


// AdTestAd.js
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/adTestAd.css';

function AdTestAd() {
    const { adId } = useParams();  // Corrected destructuring
    const [ad, setAd] = useState({});
    const [activeTemplate, setActiveTemplate] = useState('Banner');

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/importAds/ad/${adId}`);
                console.log('Fetched ad details:', response.data); // Check the response data here
                if (response.data) {
                    setAd(response.data);
                }
            } catch (error) {
                console.error('Error fetching ad:', error);
            }
        };
        fetchAd();
    }, [adId]);
    

    const templates = [
        { name: 'Banner', src: ad.imageUrl || 'fallback-banner-url.jpg' },
        { name: 'Interstitial', src: ad.imageUrl || 'fallback-banner-url.jpg' },
        { name: 'Native', src: ad.imageUrl || 'fallback-banner-url.jpg' },
        { name: 'Video', src: ad.imageUrl || 'fallback-banner-url.jpg' },
        { name: 'Pop up', src: ad.imageUrl || 'fallback-banner-url.jpg' },
        { name: 'Pop down', src: ad.imageUrl || 'fallback-banner-url.jpg' }
    ];

    return (
        <div className='adTestAd'>
            <h1>{ad.businessName}</h1>
            <div className='upper'>
                <img src={templates.find(template => template.name === activeTemplate).src} alt={activeTemplate} />
            </div>

            <div className='middle'>
                {templates.map((template) => (
                    <div
                        key={template.name}
                        className={`template-container ${template.name === activeTemplate ? 'active' : ''}`}
                        onClick={() => setActiveTemplate(template.name)}
                    >
                        <div className='template'>
                            <img src={template.src} alt={template.name} />
                            <label>{template.name}</label>
                        </div>
                        <div className='line'></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdTestAd;