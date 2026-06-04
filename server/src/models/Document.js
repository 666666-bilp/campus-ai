const mongoose = require('mongoose');

const referenceSchema = new mongoose.Schema(
  {
    format: { type: String, enum: ['gb7714', 'ieee', 'cnki'], required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'User ID is required'], index: true },
    title: { type: String, required: [true, 'Document title is required'], trim: true, maxlength: [300, 'Title must be at most 300 characters'] },
    fileName: { type: String, required: [true, 'File name is required'], trim: true },
    fileUrl: { type: String, required: [true, 'File URL is required'] },
    fileType: { type: String, enum: ['pdf', 'doc', 'docx', 'txt'], required: true },
    fileSize: { type: Number, required: true, min: 0 },
    extractedText: { type: String, default: '', maxlength: [1000000, 'Extracted text must be at most 1,000,000 characters'] },
    summary: { type: String, default: '', maxlength: [10000, 'Summary must be at most 10,000 characters'] },
    keywords: { type: [String], default: [] },
    references: { type: [referenceSchema], default: [] },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    processingError: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, status: 1 });
documentSchema.index({ keywords: 1 });

documentSchema.methods.markCompleted = async function (data) {
  this.extractedText = data.extractedText || '';
  this.summary = data.summary || '';
  this.keywords = data.keywords || [];
  this.references = data.references || [];
  this.status = 'completed';
  return this.save();
};

documentSchema.methods.markFailed = async function (errorMessage) {
  this.status = 'failed';
  this.processingError = errorMessage || 'Unknown error';
  return this.save();
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
