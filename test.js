// ImportAdModel.js
const mongoose = require('mongoose');

const ImportAdSchema = new mongoose.Schema({
  ImportAdId: { type: String, required: true },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  videoUrl: { type: String }
}, { timestamps: true });

const ImportAd = mongoose.model('ImportAd', ImportAdSchema);

module.exports = ImportAd;

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
    const { ImportAdId } = req.body;
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
      ImportAdId,
      imageUrl,
      pdfUrl,
      videoUrl
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

// ImportAdRoutes.js
const express = require('express');
const router = express.Router();
const ImportAdController = require('../controllers/ImportAdController');

router.post('/', ImportAdController.createImportAd);
router.get('/', ImportAdController.getAllAds);

module.exports = router;



// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const importAdRoutes = require('./routes/ImportAdRoutes');

const app = express(); 
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/importAds', importAdRoutes);

const server = http.createServer(app);
const io = socketIo(server); 

module.exports.io = io;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });


// ImportAd.js
import React, { useState } from 'react';
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Header from '../../pages/header';

const ImportAd = () => {
    const navigate = useNavigate();
    const { user } = useClerk();
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const displayError = (message) => {
        setError(message);
        setTimeout(() => {
            setError(null);
        }, 3000);
    }

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!file) {
            displayError('Please upload a file.');
            return;
        }

        const formData = new FormData();
        formData.append('ImportAdId', user.id);
        formData.append('file', file);

        try {
            setLoading(true);
            const response = await axios.post('http://localhost:5000/api/importAds', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status !== 201) {
                displayError('Failed to create an ad. Please try again.');
            } else {
                setError(null);
                navigate('/');
            }
        } catch (error) {
            displayError('An error occurred while sending the request.');
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
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

here's the logic, i uploaded a picture and after uploading it i want to upload others like pdf, videos or more images with my account because as you can see this is the ads management system where a user should upload his/her ads as many as he/she can, so here i have an issue, when i add an image for example, the system shows that the image is uploaded successfully but when i try to add another image, a pdf or a video the system says:Server is running on port 5000
MongoDB Error: MongoServerError: E11000 duplicate key error collection: test.importads index: ImportAdId_1 dup key: { ImportAdId: 
null } but what i want is that the users can add as many files as they want not just adding one file and be required to update it(delete it) in order to add another one no!