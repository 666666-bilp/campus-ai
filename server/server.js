const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`服务器已启动: http://localhost:${PORT}`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
});
