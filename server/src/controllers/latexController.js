const { success, error } = require('../utils/response');
const aiService = require('../services/aiService');

/**
 * Generate a LaTeX formula from a natural-language description.
 * POST /api/latex/generate
 */
const generate = async (req, res, next) => {
  try {
    const { description } = req.body;

    if (!description) {
      return error(res, '请描述需要的公式', 400);
    }

    const result = await aiService.generateLatex(description);

    if (!result.success) {
      return error(res, 'LaTeX generation failed: ' + (result.error || 'Unknown error'), 500);
    }

    const latex = result.data || '';

    success(res, { latex }, '公式生成成功');
  } catch (err) {
    next(err);
  }
};

/**
 * Render a LaTeX string (returns the LaTeX source — frontend renders via
 * MathJax / KaTeX).
 * POST /api/latex/render
 */
const render = async (req, res, next) => {
  try {
    const { latex } = req.body;

    success(res, { latex, renderedUrl: '' });
  } catch (err) {
    next(err);
  }
};

module.exports = { generate, render };
