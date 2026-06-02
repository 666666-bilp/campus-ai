const Experiment = require('../models/Experiment');
const aiService = require('../services/aiService');
const { success, error, paginated } = require('../utils/response');

exports.generate = async (req, res, next) => {
  try {
    const { title, course, data } = req.body;
    if (!title) return error(res, '请输入实验名称', 400);

    const result = await aiService.generateExperimentReport(title, course || '', data || '');
    if (!result.success) {
      return error(res, 'Failed to generate experiment report: ' + (result.error || 'Unknown error'), 500);
    }

    const generatedContent = result.data || {};
    const content = {
      objective: generatedContent.objective || '',
      theory: generatedContent.theory || '',
      equipment: generatedContent.equipment || '',
      procedure: generatedContent.procedure || '',
      data: generatedContent.data || data || '',
      analysis: generatedContent.analysis || '',
      conclusion: generatedContent.conclusion || '',
    };

    const experiment = await Experiment.create({
      userId: req.user._id,
      title,
      course: course || '',
      content,
      chartData: {},
    });
    success(res, experiment, '实验报告生成成功', 201);
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id };
    const [experiments, total] = await Promise.all([
      Experiment.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)).select('title course createdAt'),
      Experiment.countDocuments(query)
    ]);
    paginated(res, experiments, Number(page), Number(limit), total);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const experiment = await Experiment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!experiment) return error(res, '实验报告不存在', 404);
    success(res, experiment);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const experiment = await Experiment.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!experiment) return error(res, '实验报告不存在', 404);
    success(res, experiment, '更新成功');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await Experiment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    success(res, null, '删除成功');
  } catch (err) { next(err); }
};

exports.generateChart = async (req, res, next) => {
  try {
    const { type, data, labels, title } = req.body;
    if (!data || !labels) return error(res, '请提供数据和标签', 400);
    const chartOption = {
      title: { text: title || '' },
      tooltip: {},
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [{ data, type: type || 'line', smooth: true }]
    };
    success(res, { chartOption }, '图表配置生成成功');
  } catch (err) { next(err); }
};

exports.fitData = async (req, res, next) => {
  try {
    const { xData, yData } = req.body;
    if (!xData || !yData || xData.length !== yData.length || xData.length < 2) {
      return error(res, '请提供有效的x和y数据（至少2组）', 400);
    }
    const n = xData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) { sumX += xData[i]; sumY += yData[i]; sumXY += xData[i] * yData[i]; sumX2 += xData[i] * xData[i]; }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const fitted = xData.map(x => slope * x + intercept);
    let ssRes = 0, ssTot = 0;
    const meanY = sumY / n;
    for (let i = 0; i < n; i++) { ssRes += (yData[i] - fitted[i]) ** 2; ssTot += (yData[i] - meanY) ** 2; }
    const r2 = 1 - ssRes / ssTot;
    success(res, { slope, intercept, r2, fitted, equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}` }, '拟合完成');
  } catch (err) { next(err); }
};
