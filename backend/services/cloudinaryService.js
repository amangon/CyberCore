const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

/**
 * Initialize Cloudinary with environment credentials
 */
function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original file name
 * @returns {Object} Upload result with URL, public_id, etc.
 */
async function uploadFile(fileBuffer, fileName) {
  try {
    initCloudinary();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'sentinelx-suspicious-files',
          public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`,
          resource_type: 'auto',
          tags: ['suspicious', 'malware-scan', 'sentinelx']
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload failed: ${error.message}`);
            reject(error);
          } else {
            logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              bytes: result.bytes,
              originalFilename: fileName,
              createdAt: result.created_at,
              uploaded: true
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    logger.error(`Cloudinary upload failed: ${error.message}`);
    return { error: error.message, uploaded: false };
  }
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Object} Deletion result
 */
async function deleteFile(publicId) {
  try {
    initCloudinary();
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`File deleted from Cloudinary: ${publicId}`);
    return { deleted: result.result === 'ok', publicId };
  } catch (error) {
    logger.error(`Cloudinary delete failed: ${error.message}`);
    return { error: error.message, deleted: false };
  }
}

/**
 * Get file details from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @returns {Object} File details
 */
async function getFileInfo(publicId) {
  try {
    initCloudinary();
    const result = await cloudinary.api.resource(publicId);
    return {
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      createdAt: result.created_at,
      tags: result.tags,
      metadata: result.metadata || {}
    };
  } catch (error) {
    logger.error(`Cloudinary get file info failed: ${error.message}`);
    return { error: error.message };
  }
}

module.exports = { uploadFile, deleteFile, getFileInfo, initCloudinary };

