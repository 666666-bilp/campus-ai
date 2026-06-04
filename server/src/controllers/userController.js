const User = require('../models/User');
const { success, error } = require('../utils/response');

exports.getProfile = async (req, res, next) => {
  try {
    success(res, req.user.toSafeObject());
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username, profile } = req.body;

    if (username !== undefined) {
      req.user.username = username;
    }

    if (profile && typeof profile === 'object') {
      const allowedFields = ['avatar', 'university', 'major', 'grade', 'bio'];
      for (const field of allowedFields) {
        if (profile[field] !== undefined) {
          req.user.profile[field] = profile[field];
        }
      }
    }

    await req.user.save();
    success(res, req.user.toSafeObject(), '个人信息更新成功');
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = {
      papersGenerated: req.user.stats.papersGenerated || 0,
      wordsProcessed: req.user.stats.wordsProcessed || 0,
      loginCount: req.user.stats.loginCount || 0
    };
    success(res, stats);
  } catch (err) { next(err); }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Promise.all([
      require('../models/Document').deleteMany({ userId }),
      require('../models/Paper').deleteMany({ userId }),
      require('../models/Note').deleteMany({ userId }),
      require('../models/Schedule').deleteMany({ userId }),
      require('../models/ExamQuestion').deleteMany({ userId }),
      require('../models/Experiment').deleteMany({ userId }),
      require('../models/CodeSnippet').deleteMany({ userId }),
      require('../models/Conversation').deleteMany({ userId }),
    ]);
    await req.user.deleteOne();
    success(res, null, '账号已删除');
  } catch (err) { next(err); }
};
