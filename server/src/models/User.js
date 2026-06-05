const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [/^[a-zA-Z0-9_一-鿿]+$/, 'Username can only contain letters, numbers, underscores, and Chinese characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: { values: ['student', 'admin'], message: 'Role must be either student or admin' },
      default: 'student',
    },
    profile: {
      avatar: { type: String, default: '' },
      university: { type: String, default: '', maxlength: [100, 'University name must be at most 100 characters'] },
      major: { type: String, default: '', maxlength: [100, 'Major name must be at most 100 characters'] },
      grade: { type: String, default: '', maxlength: [20, 'Grade must be at most 20 characters'] },
      bio: { type: String, default: '', maxlength: [500, 'Bio must be at most 500 characters'] },
    },
    stats: {
      papersGenerated: { type: Number, default: 0, min: 0 },
      wordsProcessed: { type: Number, default: 0, min: 0 },
      loginCount: { type: Number, default: 0, min: 0 },
      lastLogin: { type: Date, default: null },
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      language: { type: String, enum: ['zh-CN', 'en-US'], default: 'zh-CN' },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

userSchema.methods.recordLogin = async function () {
  this.stats.loginCount += 1;
  this.stats.lastLogin = new Date();
  return this.save();
};

userSchema.methods.incrementPapersGenerated = async function (count = 1) {
  this.stats.papersGenerated += count;
  return this.save();
};

userSchema.methods.addWordsProcessed = async function (wordCount) {
  this.stats.wordsProcessed += wordCount;
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
