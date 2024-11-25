// storage.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Path to your service account key file
const keyFilename = path.join(__dirname, './forward-map-413614-8d5e4e1e5f7a.json');

// Your bucket name
const bucketName = 'yepper_bucket_images';

const storage = new Storage({ keyFilename });
const bucket = storage.bucket(bucketName);

module.exports = bucket;
