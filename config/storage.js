const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Path to your service account key file
const keyFilename = path.join(__dirname, './forward-map-413614-8d5e4e1e5f7a.json');

// Your bucket name
const bucketName = 'yepper_bucket_images';

const storage = new Storage({ keyFilename });
const bucket = storage.bucket(bucketName);

/**
 * Generate a signed URL for accessing a file.
 * @param {string} fileName - Name of the file in the bucket.
 * @param {number} expiresIn - URL expiration time in seconds.
 * @returns {Promise<string>} - The signed URL.
 */
const generateSignedUrl = async (fileName, expiresIn = 3600) => {
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresIn * 1000, // e.g., 1 hour
  });
  return url;
};

module.exports = { bucket, generateSignedUrl };
