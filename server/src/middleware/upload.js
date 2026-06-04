const multer = require('multer');
const path = require('path');

const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 50 * 1024 * 1024; // 50MB default

// Memory storage - files held in memory as Buffer for Cloudinary upload
const storage = multer.memoryStorage();

/**
 * File filter: allow only supported file types.
 */
function fileFilter(req, file, cb) {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'text/plain',
    'text/markdown',
    'application/json',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, DOC/DOCX, images, TXT, Markdown, JSON, CSV, XLS/XLSX, PPT/PPTX.`), false);
  }
}

/**
 * General upload middleware - accepts any supported file type.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * PDF-only upload middleware.
 */
const uploadPDF = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Image-only upload middleware.
 */
const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedImageMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    if (allowedImageMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for images
  },
});

module.exports = { upload, uploadPDF, uploadImage };
