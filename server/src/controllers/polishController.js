const { success, error } = require('../utils/response');
const aiService = require('../services/aiService');

/**
 * Polish / rewrite text using AI.
 * POST /api/polish
 */
const polishText = async (req, res, next) => {
  try {
    const { text, mode, action } = req.body;

    if (!text) {
      return error(res, '请输入需要处理的文本', 400);
    }

    const result = await aiService.polishText(
      text,
      mode || 'science',
      action || 'polish'
    );

    if (!result.success) {
      return error(res, 'Polish failed: ' + (result.error || 'Unknown error'), 500);
    }

    success(res, result.data, '润色完成');
  } catch (err) {
    next(err);
  }
};

/**
 * Get polish history (placeholder — can be extended later).
 * GET /api/polish/history
 */
const getHistory = async (req, res, next) => {
  try {
    success(res, [], '暂无历史记录');
  } catch (err) {
    next(err);
  }
};

module.exports = { polishText, getHistory };
