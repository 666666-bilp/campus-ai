require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://d86b8bd5.campus-ai-8lk.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // 生产环境允许所有来源（也可改为错误回调以严格限制）
    }
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
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
