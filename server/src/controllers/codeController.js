const CodeSnippet = require('../models/CodeSnippet');
const aiService = require('../services/aiService');
const { success, error, paginated } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

exports.save = async (req, res, next) => {
  try {
    const { title, language, code } = req.body;
    if (!title) return error(res, '请输入代码片段标题', 400);
    if (!language) return error(res, '请选择编程语言', 400);
    const snippet = await CodeSnippet.create({
      userId: req.user._id,
      title,
      language,
      code: code || ''
    });
    success(res, snippet, '代码片段保存成功', 201);
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, language } = req.query;
    const query = { userId: req.user._id };
    if (language) query.language = language;
    const [snippets, total] = await Promise.all([
      CodeSnippet.find(query)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select('title language createdAt isPublic'),
      CodeSnippet.countDocuments(query)
    ]);
    paginated(res, snippets, Number(page), Number(limit), total);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findOne({ _id: req.params.id, userId: req.user._id });
    if (!snippet) return error(res, '代码片段不存在', 404);
    success(res, snippet);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!snippet) return error(res, '代码片段不存在', 404);
    success(res, snippet, '更新成功');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!snippet) return error(res, '代码片段不存在', 404);
    success(res, null, '删除成功');
  } catch (err) { next(err); }
};

exports.addComments = async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findOne({ _id: req.params.id, userId: req.user._id });
    if (!snippet) return error(res, '代码片段不存在', 404);
    if (!snippet.code || snippet.code.trim().length === 0) {
      return error(res, '代码片段为空，无法添加注释', 400);
    }
    const result = await aiService.addCodeComments(snippet.code, snippet.language);
    const commentedCode = (result.success && result.data) ? result.data : '';
    snippet.aiComments = commentedCode;
    await snippet.save();
    success(res, snippet, '注释添加成功');
  } catch (err) { next(err); }
};

exports.format = async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findOne({ _id: req.params.id, userId: req.user._id });
    if (!snippet) return error(res, '代码片段不存在', 404);
    if (!snippet.code) return error(res, '代码片段为空', 400);

    let formatted = snippet.code.trim();
    // Replace tabs with 2 spaces
    formatted = formatted.replace(/\t/g, '  ');
    // Normalize trailing whitespace on each line
    formatted = formatted.replace(/[ \t]+$/gm, '');
    // Collapse multiple blank lines into one
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    snippet.code = formatted;
    await snippet.save();
    success(res, snippet, '代码格式化成功');
  } catch (err) { next(err); }
};

exports.share = async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findOne({ _id: req.params.id, userId: req.user._id });
    if (!snippet) return error(res, '代码片段不存在', 404);

    snippet.isPublic = !snippet.isPublic;
    if (snippet.isPublic && !snippet.shareId) {
      snippet.shareId = uuidv4();
    }
    await snippet.save();

    const shareLink = snippet.isPublic && snippet.shareId
      ? `/share/code/${snippet.shareId}`
      : null;
    success(res, { snippet, shareLink }, snippet.isPublic ? '已公开分享' : '已取消分享');
  } catch (err) { next(err); }
};
