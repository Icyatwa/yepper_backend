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

    res.status(201).json(savedRequestAd);
  } catch (error) {
    console.error('Error importing ad:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}];

// Select.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import './styles/select.css';
import BackButton from '../../components/backToPreviusButton';

function Select() {
  const navigate = useNavigate();
  const { user } = useClerk();
  const userId = user?.id;
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);

    if (selectedFile && (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/'))) {
        setFilePreview(URL.createObjectURL(selectedFile));
    } else {
        setFilePreview(null);
        setError('Please upload a valid image or video file');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (!file) {
        alert('Please choose the Ad file');
      } else {
        navigate('/business', {
          state: {
            userId,
            file,
          }
        });
      }
    } catch (error) {
      alert('An error happened please check console');
      console.log(error);
    }
  };

  return (
    <>
      <BackButton />
      <div className="new-file-container web-app">
        <div className="form-wrapper">
          <h1>Upload Your Ad</h1>
          <p>Select an image or video file to create your ad</p>

          <form onSubmit={handleSave}>
            <div className="file-input">
              <input
                id="file-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="file-input-hidden"
              />
              <label htmlFor="file-upload" className="file-upload-label">
                <img src="https://cdn-icons-png.flaticon.com/512/685/685817.png" alt="Upload icon" />
                Select File
              </label>
            </div>
            {error && <p className="error-message">{error}</p>}
            {filePreview && (
              <div className="file-preview">
                {file?.type.startsWith('image/') && (
                  <img src={filePreview} alt="Selected file" className="preview-image" />
                )}
                {file?.type.startsWith('video/') && (
                  <video src={filePreview} controls className="preview-video" />
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Processing...' : 'Next'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Select;

// select.css

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Poppins', sans-serif;
}

.new-file-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--white);
}

.new-file-container .form-wrapper {
  background: var(--white);
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.new-file-container .form-wrapper p {
  font-size: 14px;
  color: var(--dark-gray);
  margin-bottom: 30px;
}

.new-file-container .file-input {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.new-file-container .file-input-hidden {
  display: none;
}

.new-file-container .file-upload-label {
  display: inline-flex;
  align-items: center;
  background-color: var(--blue);
  color: var(--white);
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.new-file-container .file-upload-label img {
  width: 18px;
  height: 18px;
  margin-right: 10px;
}

.new-file-container .file-upload-label:hover {
  background-color: var(--orange);
}

.new-file-container .error-message {
  color: var(--error-color);
  font-size: 14px;
  margin-bottom: 10px;
}

.new-file-container .file-preview {
  margin-bottom: 20px;
}

.new-file-container .preview-image, .preview-video {
  max-width: 100%;
  max-height: 250px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.new-file-container .submit-btn {
  width: 100%;
  padding: 12px 0;
  background-color: var(--blue);
  color: var(--white);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.new-file-container .submit-btn:hover {
  background-color: var(--orange);
}

.new-file-container .submit-btn:disabled {
  background-color: var(--light-gray);
  cursor: not-allowed;
}

remove pdf file format and add all image file formats that exists, also add the features for dragging and drop, design it well