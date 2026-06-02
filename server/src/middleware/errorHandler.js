const { error } = require('../utils/response');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  logger.error(`[${req.method}] ${req.path} - ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return error(res, messages.join('; '), 400);
  }
  if (err.name === 'CastError') {
    return error(res, '无效的ID格式', 400);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, `${field} 已存在`, 409);
  }
  if (err.type === 'entity.too.large') {
    return error(res, '请求体过大', 413);
  }
  if (err.message === 'No file uploaded') {
    return error(res, '请选择要上传的文件', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : '服务器内部错误，请稍后重试';
  error(res, message, statusCode);
};

module.exports = errorHandler;
