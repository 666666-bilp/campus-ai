const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  teacher: { type: String, default: '', trim: true },
  location: { type: String, default: '', trim: true },
  dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  weeks: [{ type: Number }],
  color: { type: String, default: '#3B82F6' },
  notes: { type: String, default: '' }
}, { _id: true });

const scheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  semester: { type: String, default: '', trim: true },
  courses: [courseSchema],
  rawImportText: { type: String, default: '' },
  wallpaperUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
