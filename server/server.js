const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDatabase();

  app.listen(PORT, () => {
    logger.info(`服务器已启动: http://localhost:${PORT}`);
    logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();
