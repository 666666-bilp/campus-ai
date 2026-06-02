const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  topic: { type: String, required: true, trim: true },
  paperType: {
    type: String,
    enum: ['开题报告', '毕业论文', '课程论文', '文献综述'],
    default: '课程论文'
  },
  wordCount: { type: Number, default: 3000 },
  major: { type: String, required: true, trim: true },
  content: {
    abstract: { type: String, default: '' },
    keywords: [{ type: String }],
    introduction: { type: String, default: '' },
    body: [{
      sectionTitle: String,
      sectionContent: String,
      subsections: [{ title: String, content: String }]
    }],
    conclusion: { type: String, default: '' },
    references: [{
      format: { type: String, enum: ['gb7714', 'ieee', 'cnki'] },
      text: String
    }]
  },
  fullText: { type: String, default: '' },
  format: { type: String, enum: ['markdown', 'txt'], default: 'markdown' },
  status: { type: String, enum: ['draft', 'generating', 'completed'], default: 'draft' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

paperSchema.index({ userId: 1, createdAt: -1 });
paperSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Paper', paperSchema);
