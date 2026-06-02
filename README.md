# 大学生学术AI助手 (Academic AI Assistant)

> 面向大学生的全功能学术AI平台，集成文献处理、论文生成、论文润色、LaTeX编辑、智能课表、云端笔记、考点题库、实验报告、在线代码编辑器、外语学习等完整功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Tailwind CSS + Pinia + Vue Router |
| 后端 | Node.js + Express + JWT 鉴权 |
| 数据库 | MongoDB Atlas (云数据库) |
| 文件存储 | Cloudinary |
| AI 接口 | 通用大模型 API 架构 (支持 OpenAI / Anthropic 等) |
| 部署 | Vercel (前端) + Render (后端) |

## 项目结构

```
academic-ai-platform/
├── client/                        # Vue3 前端
│   ├── src/
│   │   ├── api/index.js          # 全部 API 接口封装
│   │   ├── components/
│   │   │   ├── common/           # 通用组件 (15个)
│   │   │   └── layout/           # 布局组件 (4个)
│   │   ├── composables/          # 组合式函数
│   │   ├── router/index.js       # Vue Router 路由配置
│   │   ├── stores/               # Pinia 状态管理
│   │   ├── styles/main.css       # 全局样式 + Tailwind
│   │   ├── utils/request.js      # Axios 请求封装
│   │   └── views/                # 页面视图 (22个)
│   ├── vercel.json               # Vercel 部署配置
│   └── vite.config.js
├── server/                        # Express 后端
│   ├── src/
│   │   ├── config/               # 数据库/AI/云存储配置
│   │   ├── controllers/          # 12个控制器
│   │   ├── middleware/           # 5个中间件
│   │   ├── models/               # 10个Mongoose模型
│   │   ├── routes/               # 12个路由模块
│   │   ├── services/aiService.js # AI服务核心
│   │   └── utils/                # 工具函数
│   ├── app.js                    # Express 应用入口
│   └── server.js                 # 服务器启动
├── .env.example                   # 环境变量模板
└── package.json                   # 根配置
```

## 快速开始

### 1. 环境准备

- Node.js 18+
- MongoDB Atlas 账号 (免费套餐即可)
- Cloudinary 账号 (免费套餐即可)
- AI API Key (OpenAI / Anthropic 等)

### 2. 配置环境变量

```bash
cd server
cp ../.env.example .env
# 编辑 .env 填入实际的数据库、存储、AI API 配置
```

### 3. 安装依赖

```bash
# 根目录
npm install

# 前端
cd client && npm install

# 后端
cd ../server && npm install
```

### 4. 启动开发环境

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:server   # 后端 http://localhost:3000
npm run dev:client   # 前端 http://localhost:5173
```

## 部署指南

### 前端部署到 Vercel

1. 在 Vercel 导入项目，选择 `client` 目录
2. 框架预设: Vite
3. 构建命令: `npm run build`
4. 输出目录: `dist`
5. 环境变量: `VITE_API_URL` 设为你的 Render 后端地址
6. 部署

### 后端部署到 Render

1. 在 Render 创建 Web Service
2. 选择 `server` 目录
3. 构建命令: `npm install`
4. 启动命令: `npm start`
5. 添加所有环境变量 (参考 .env.example)
6. 部署

### 数据库 (MongoDB Atlas)

1. 创建免费集群 (M0)
2. 创建数据库用户
3. 设置网络访问 (允许所有 IP: 0.0.0.0/0)
4. 获取连接字符串，填入 MONGODB_URI

### Cloudinary 文件存储

1. 注册账号，获取 Cloud Name、API Key、API Secret
2. 填入环境变量

## 功能清单

### 用户系统
- [x] 注册/登录/退出 (JWT)
- [x] 个人中心 (资料编辑)
- [x] 密码修改
- [x] 深浅色模式切换
- [x] 账号删除

### 学术AI辅助
- [x] 文献上传 (PDF/DOC/DOCX/TXT)
- [x] 自动文本提取 (PDF解析)
- [x] 智能摘要 + 关键词提取
- [x] 参考文献生成 (GB/T 7714 / IEEE / 知网)
- [x] 论文大纲生成
- [x] 全自动论文生成 (含流式输出)
- [x] 论文润色 & 降重 (文科/理工科/经管)
- [x] LaTeX 公式编辑器
- [x] 论文导出 (TXT/Markdown)

### 课程学习
- [x] 智能课表 (教务文本导入 + AI解析)
- [x] 云端笔记 (Markdown，AI总结)
- [x] 考点题库 (AI出题 + 错题本)

### 实验工科
- [x] 实验报告自动生成
- [x] 数据拟合 + 图表生成

### 开发工具
- [x] 在线代码编辑器 (多语言 + AI注释)
- [x] HTML 实时预览

### 外语学习
- [x] 文献双语精读 (AI翻译)
- [x] AI口语陪练 (多场景)
- [x] 四六级真题解析

## API 接口

所有接口前缀: `/api`

| 模块 | 路由 | 说明 |
|------|------|------|
| Auth | `/api/auth` | 注册/登录/个人信息 |
| Documents | `/api/documents` | 文献上传/处理 |
| Papers | `/api/papers` | 论文CRUD/生成/导出 |
| Polish | `/api/polish` | 文本润色 |
| LaTeX | `/api/latex` | 公式生成 |
| Schedule | `/api/schedule` | 课表管理 |
| Notes | `/api/notes` | 笔记CRUD |
| Exam | `/api/exam` | 题库/错题本 |
| Experiment | `/api/experiment` | 实验报告 |
| Code | `/api/code` | 代码片段 |
| English | `/api/english` | 外语学习 |
| Users | `/api/users` | 用户管理 |

## 安全机制

- JWT Token 身份验证
- bcryptjs 密码加密
- Helmet 安全头
- CORS 跨域控制
- express-rate-limit 速率限制
- express-validator 输入校验
- Multer 文件类型/大小过滤
- MongoDB 注入防护 (Mongoose)
