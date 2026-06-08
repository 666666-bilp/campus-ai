const Document = require('../models/Document');
const aiService = require('../services/aiService');
const { success, error, paginated } = require('../utils/response');
const { uploadFile, deleteFile, extractPublicId } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// pdf-parse may not be installed in all environments; load it lazily
let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (_) {
  // pdf-parse is optional — extractText will return an error if called without it
}

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/** Check if Cloudinary is properly configured */
function isCloudinaryConfigured() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/**
 * POST /api/documents/upload
 * Upload a file via multer (req.file), store it on Cloudinary or locally, and create a Document record.
 */
async function upload(req, res, next) {
  try {
    if (!req.file) {
      return error(res, 'No file provided. Please attach a file.', 400);
    }

    const { title } = req.body;

    if (!title || !title.trim()) {
      return error(res, 'Document title is required.', 400);
    }

    const file = req.file;
    const fileType = file.mimetype === 'application/pdf'
      ? 'pdf'
      : file.mimetype === 'application/msword'
        ? 'doc'
        : file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ? 'docx'
          : file.mimetype === 'text/plain'
            ? 'txt'
            : 'pdf'; // fallback

    let fileUrl;

    if (isCloudinaryConfigured()) {
      // Upload to Cloudinary
      const result = await uploadFile(file.buffer, {
        folder: `academic-ai-platform/documents/${req.user._id}`,
        resource_type: 'raw',
      });
      fileUrl = result.secure_url;
    } else {
      // Fallback to local storage
      const uniqueName = `${uuidv4()}_${file.originalname}`;
      const userDir = path.join(UPLOADS_DIR, String(req.user._id));
      if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
      const localPath = path.join(userDir, uniqueName);
      fs.writeFileSync(localPath, file.buffer);
      fileUrl = `/uploads/${req.user._id}/${uniqueName}`;
    }

    const document = await Document.create({
      userId: req.user._id,
      title: title.trim(),
      fileName: file.originalname,
      fileUrl,
      fileType,
      fileSize: file.size,
      status: 'processing',
    });

    return success(res, document, 'Document uploaded successfully.', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/documents
 * List all documents belonging to the authenticated user, newest first.
 */
async function getAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      Document.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Document.countDocuments({ userId: req.user._id }),
    ]);

    return paginated(res, documents, page, limit, total);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/documents/:id
 * Get a single document by ID. Only accessible by the owner.
 */
async function getOne(req, res, next) {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return error(res, 'Document not found.', 404);
    }

    return success(res, document, 'Document retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/documents/:id/extract-text
 * Extract text from a PDF document using pdf-parse.
 * If the request includes a fresh file upload (req.file), use that buffer;
 * otherwise attempt to fetch the file from the Cloudinary URL.
 */
async function extractText(req, res, next) {
  try {
    if (!pdfParse) {
      return error(res, 'PDF text extraction is not available. Install the "pdf-parse" package.', 501);
    }

    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return error(res, 'Document not found.', 404);
    }

    let pdfBuffer;

    if (req.file) {
      // Use the freshly uploaded buffer
      pdfBuffer = req.file.buffer;
    } else if (document.fileUrl) {
      // Fetch the file from Cloudinary
      try {
        const response = await fetch(document.fileUrl);
        if (!response.ok) {
          return error(res, `Failed to fetch document from storage (HTTP ${response.status}).`, 502);
        }
        const arrayBuffer = await response.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
      } catch (fetchErr) {
        return error(res, 'Failed to fetch the document file from storage.', 502);
      }
    } else {
      return error(res, 'No file source available for text extraction.', 400);
    }

    // Parse the PDF
    const parsed = await pdfParse(pdfBuffer);

    document.extractedText = parsed.text || '';
    document.status = 'completed';
    await document.save();

    return success(res, document, 'Text extracted successfully.');
  } catch (err) {
    // If the document exists, mark it as failed so the user can see the error
    try {
      const doc = await Document.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });
      if (doc) {
        await doc.markFailed(err.message);
      }
    } catch (_) {
      // Best-effort failure marking
    }
    next(err);
  }
}

/**
 * POST /api/documents/:id/summarize
 * Generate an AI summary and keywords for the document's extracted text.
 */
async function summarize(req, res, next) {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return error(res, 'Document not found.', 404);
    }

    if (!document.extractedText || document.extractedText.trim().length === 0) {
      return error(res, 'Document has no extracted text. Please run text extraction first.', 400);
    }

    const result = await aiService.summarizeDocument(document.extractedText);
    if (!result.success) {
      return error(res, 'AI summarization failed: ' + (result.error || 'Unknown error'), 500);
    }

    document.summary = (result.data && result.data.summary) || '';
    document.keywords = (result.data && result.data.keywords) || [];
    await document.save();

    return success(res, document, 'Document summarized successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/documents/:id/generate-references
 * Generate reference lists in GB/T 7714, IEEE, and CNKI formats.
 */
async function generateReferences(req, res, next) {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return error(res, 'Document not found.', 404);
    }

    if (!document.extractedText || document.extractedText.trim().length === 0) {
      return error(res, 'Document has no extracted text. Please run text extraction first.', 400);
    }

    // Wrap the text as a single-item array for the references service
    const texts = [document.extractedText];

    const [gb7714Result, ieeeResult, cnkiResult] = await Promise.all([
      aiService.generateReferences(texts, 'gb7714'),
      aiService.generateReferences(texts, 'ieee'),
      aiService.generateReferences(texts, 'cnki'),
    ]);

    const references = [];

    if (gb7714Result.success && gb7714Result.data) {
      gb7714Result.data.forEach((ref) => {
        if (ref && ref.text && ref.text.trim()) {
          references.push({ format: 'gb7714', text: ref.text.trim() });
        }
      });
    }

    if (ieeeResult.success && ieeeResult.data) {
      ieeeResult.data.forEach((ref) => {
        if (ref && ref.text && ref.text.trim()) {
          references.push({ format: 'ieee', text: ref.text.trim() });
        }
      });
    }

    if (cnkiResult.success && cnkiResult.data) {
      cnkiResult.data.forEach((ref) => {
        if (ref && ref.text && ref.text.trim()) {
          references.push({ format: 'cnki', text: ref.text.trim() });
        }
      });
    }

    document.references = references;
    await document.save();

    return success(res, document, 'References generated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/documents/:id
 * Delete the document file from Cloudinary and remove the database record.
 */
async function deleteOne(req, res, next) {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return error(res, 'Document not found.', 404);
    }

    // Remove from Cloudinary
    const publicId = extractPublicId(document.fileUrl);
    if (publicId) {
      try {
        await deleteFile(publicId, { resource_type: 'raw' });
      } catch (cloudErr) {
        // Log but continue — the DB record should still be cleaned up
        console.error(`Failed to delete file from Cloudinary (publicId: ${publicId}):`, cloudErr.message);
      }
    }

    await Document.deleteOne({ _id: document._id });

    return success(res, null, 'Document deleted successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/documents/search
 * Full-text search across the authenticated user's documents.
 * Query params: q (search term), page, limit
 */
async function search(req, res, next) {
  try {
    const { q } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    if (!q || !q.trim()) {
      return error(res, 'A search query (q) is required.', 400);
    }

    const searchTerm = q.trim();
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedTerm, 'i');

    const filter = {
      userId: req.user._id,
      $or: [
        { title: { $regex: regex } },
        { extractedText: { $regex: regex } },
      ],
    };

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Document.countDocuments(filter),
    ]);

    return paginated(res, documents, page, limit, total);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upload,
  getAll,
  getOne,
  extractText,
  summarize,
  generateReferences,
  delete: deleteOne,
  search,
};
