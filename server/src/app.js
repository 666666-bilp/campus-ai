require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// 这里改成你正确的数据库函数！！！
const { connectDatabase } = require('./config/database');

const app = express();

// Railway部署需要信任反向代理
app.set('trust proxy', 1);

// Connect to database
connectDatabase();

// Security middleware
app.use(helmet());

// CORS - 支持本地开发 + Cloudflare Pages 生产环境
const allowedOrigins = [
  process.env.CLIENT_URL,                          // Railway 环境变量，覆盖自定义域名
  'http://localhost:5173',                          // Vite 本地开发
  'http://localhost:3000',                          // 后端自身（调试用）
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // 无 origin（Postman/curl/服务端调用）直接放行
    if (!origin) return callback(null, true);
    // 精确匹配白名单
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Cloudflare Pages 默认域名 *.pages.dev
    if (origin.endsWith('.pages.dev')) return callback(null, true);
    // 拒绝：打印日志便于排查，返回标准 CORS 拒绝响应
    console.warn('[CORS] 拒绝未授权域名:', origin);
    callback(null, false);
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Rate limiting
app.use('/api', generalLimiter);

// ---------- Route mounting ----------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/papers', require('./routes/papers'));
app.use('/api/polish', require('./routes/polish'));
app.use('/api/latex', require('./routes/latex'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/exam', require('./routes/exam'));
app.use('/api/experiment', require('./routes/experiment'));
app.use('/api/code', require('./routes/code'));
app.use('/api/english', require('./routes/english'));
app.use('/api/users', require('./routes/users'));

// Health check - 包含数据库状态
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  res.json({
    success: true,
    message: '服务运行正常',
    database: dbStateMap[dbState] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
