const { body, validationResult } = require('express-validator');
const { error: errorResponse } = require('../utils/response');

/**
 * Validation middleware factory - runs express-validator and returns errors.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return errorResponse(res, `Validation failed: ${messages.join('; ')}`, 400);
  }
  next();
}

/**
 * Registration validation rules.
 */
const registerRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Username must be 2-50 characters.')
    .matches(/^[a-zA-Z0-9_一-龥]+$/).withMessage('Username can only contain letters, numbers, underscores, and Chinese characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters.'),
];

/**
 * Login validation rules.
 */
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
];

/**
 * Paper creation/update validation rules.
 */
const paperRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ min: 2, max: 300 }).withMessage('Title must be 2-300 characters.'),
  body('topic')
    .trim()
    .notEmpty().withMessage('Topic is required.'),
  body('paperType')
    .optional()
    .isIn(['开题报告', '毕业论文', '课程论文', '文献综述'])
    .withMessage('论文类型无效，请选择: 开题报告、毕业论文、课程论文、文献综述'),
  body('major')
    .optional()
    .trim(),
  body('wordCount')
    .optional()
    .isInt({ min: 100, max: 50000 }).withMessage('Word count must be 100-50000.'),
];

/**
 * Document upload validation rules.
 */
const documentRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Title must be at most 300 characters.'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array.'),
];

/**
 * Schedule validation rules.
 */
const scheduleRules = [
  body('semester')
    .trim()
    .notEmpty().withMessage('Semester is required.'),
  body('courses')
    .optional()
    .isArray().withMessage('Courses must be an array.'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  paperRules,
  documentRules,
  scheduleRules,
};
