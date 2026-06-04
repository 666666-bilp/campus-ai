const cloudinary = require('cloudinary').v2;

/**
 * Configure Cloudinary for file uploads (PDFs, images, etc.).
 * Reads credentials from environment variables.
 */
function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn(
      'Cloudinary credentials are incomplete. File upload functionality will not work. ' +
        'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  cloudinary.config({
    cloud_name: cloudName || 'demo',
    api_key: apiKey || '',
    api_secret: apiSecret || '',
    secure: true,
  });

  console.log('Cloudinary configured successfully.');
  return cloudinary;
}

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer.
 * @param {Object} options - Upload options (folder, resource_type, public_id, etc.).
 * @returns {Promise<Object>} Cloudinary upload result.
 */
async function uploadFile(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'academic-ai-platform',
      resource_type: options.resource_type || 'auto',
      public_id: options.public_id || undefined,
      overwrite: options.overwrite || true,
      ...options.extra,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error(`Cloudinary upload error: ${error.message}`);
          return reject(error);
        }
        console.log(`Cloudinary upload successful: ${result.public_id}`);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by public ID.
 * @param {string} publicId - The Cloudinary public ID.
 * @param {Object} options - Deletion options.
 * @returns {Promise<Object>} Cloudinary deletion result.
 */
async function deleteFile(publicId, options = {}) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resource_type || 'auto',
      ...options,
    });
    console.log(`Cloudinary deletion result for ${publicId}:`, result);
    return result;
  } catch (error) {
    console.error(`Cloudinary deletion error: ${error.message}`);
    throw error;
  }
}

/**
 * Extract the public ID from a Cloudinary URL.
 * @param {string} url - Full Cloudinary URL.
 * @returns {string|null} The public ID or null.
 */
function extractPublicId(url) {
  if (!url) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const afterUpload = parts.slice(uploadIndex + 2).join('/');
    const dotIndex = afterUpload.lastIndexOf('.');
    return dotIndex > -1 ? afterUpload.substring(0, dotIndex) : afterUpload;
  } catch {
    return null;
  }
}

// Initialize on import
configureCloudinary();

module.exports = {
  cloudinary,
  configureCloudinary,
  uploadFile,
  deleteFile,
  extractPublicId,
};
