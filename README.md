# 小红书爬虫服务 🚀

<div align="center">

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

基于 NestJS + Puppeteer 的小红书数据爬取服务，提供帖子详情和用户信息的 RESTful API 接口。

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [API 文档](#-api-接口) • [部署指南](#-部署)

</div>

---

## ✨ 功能特性

- 🎯 **帖子详情爬取** - 支持单个/批量爬取帖子详情（标题、内容、点赞数、收藏数等）
- 👤 **用户信息爬取** - 支持单个/批量爬取用户信息（昵称、粉丝数、笔记数等）
- 🔗 **智能 URL 处理** - 自动识别并处理短链、长链、ID 三种格式
- 🌐 **浏览器池管理** - 智能管理多个浏览器实例，支持并发爬取
- 🔄 **健康检查** - 自动检测和重启不健康的浏览器实例
- 📦 **Cookie 管理** - 支持多账号管理，自动轮询使用
- 📊 **Swagger 文档** - 完整的 API 交互式文档
- 🐳 **Docker 部署** - 开箱即用的容器化部署方案

---

## 🚀 快速开始

### 使用 Docker（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd xhs-crawler

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 访问服务
curl http://localhost:3000/health
```

服务启动后访问：
- **API 文档**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/health

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（可选）
cp .env.example .env

# 3. 启动开发服务
npm run start:dev
```

---

## 📖 API 接口

### 📝 帖子爬取

#### 单个帖子
```bash
GET /api/posts/:postId/detail

# 示例
curl http://localhost:3000/api/posts/YOUR_NOTE_ID/detail
```

#### 批量帖子
```bash
POST /api/posts/batch
Content-Type: application/json

{
  "posts": [
    {"postId": "YOUR_NOTE_ID", "xsecToken": "xxx"},
    {"postId": "YOUR_NOTE_ID", "xsecToken": "yyy"}
  ]
}

# 示例
curl -X POST http://localhost:3000/api/posts/batch \
  -H "Content-Type: application/json" \
  -d '{"posts": [{"postId": "YOUR_NOTE_ID"}]}'
```

### 👤 用户爬取

#### 单个用户
```bash
POST /api/users/crawl
Content-Type: application/json

{
  "userIdOrUrl": "USER_ID_HERE_OR_URL"
}

# 支持三种格式：
# 1. 用户ID: "USER_ID_HERE_OR_URL"
# 2. 短链: "https://xhslink.com/m/xxx"
# 3. 长链: "https://www.xiaohongshu.com/user/profile/USER_ID"
```

#### 批量用户
```bash
POST /api/users/batch
Content-Type: application/json

{
  "users": [
    {"userIdOrUrl": "USER_ID_HERE_OR_URL"},
    {"userIdOrUrl": "https://xhslink.com/m/xxxx"}
  ]
}
```

### 🔐 账号管理

```bash
# 创建账号
POST /api/accounts
{
  "name": "测试账号",
  "cookie": "your-cookie-string"
}

# 查询账号
GET /api/accounts

# 删除账号
DELETE /api/accounts/:id
```

### 📊 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "postId": "xxxxxxx",
    "title": "标题",
    "desc": "内容",
    "likedCount": 45000,
    "collectedCount": 36000,
    "commentCount": 1234,
    "shareCount": 567
  }
}
```

---

## 🐳 部署

### Docker Compose 部署

```bash
# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

### 生产环境配置

修改 `docker-compose.prod.yml` 中的环境变量：

```yaml
environment:
  # 浏览器池配置
  BROWSER_POOL_MIN_SIZE: 1        # 初始浏览器数
  BROWSER_POOL_MAX_SIZE: 3        # 最大浏览器数
  BROWSER_IDLE_TIMEOUT: 1800000   # 空闲超时（毫秒）
```

📖 **详细部署文档**: [DEPLOYMENT.md](DEPLOYMENT.md) | [PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md)

---

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|-----|------|-----|
| **NestJS** | 10.x | Node.js 框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Puppeteer** | 22.x | 无头浏览器 |
| **SQLite** | - | 轻量级数据库 |
| **TypeORM** | 0.3.x | ORM 框架 |
| **Docker** | - | 容器化部署 |

---

## 📁 项目结构

```
xhs-crawler/
├── src/
│   ├── modules/
│   │   ├── account/              # 账号管理
│   │   ├── crawler/              # 爬虫核心
│   │   │   ├── controllers/      # 控制器
│   │   │   ├── services/         # 服务层
│   │   │   │   ├── browser-pool.service.ts       # 浏览器池
│   │   │   │   ├── browser-instance.puppeteer.ts # 浏览器实例
│   │   │   │   └── crawler.service.ts            # 爬虫服务
│   │   │   └── dto/              # 数据传输对象
│   │   ├── health/               # 健康检查
│   │   └── database/             # 数据库
│   └── common/                   # 通用模块
├── docker-compose.yml            # Docker 配置
├── Dockerfile                    # 镜像构建
└── package.json
```

---

## 🔧 开发命令

```bash
# 开发
npm run start:dev          # 启动开发服务（热重载）
npm run build              # 构建生产版本
npm run start:prod         # 启动生产服务

# 测试
npm run test               # 运行单元测试
npm run test:cov           # 测试覆盖率报告
npm run test:e2e           # 端到端测试

# 代码质量
npm run lint               # 代码检查
npm run format             # 代码格式化
```

---

## 📝 环境变量

| 变量名 | 默认值 | 说明 |
|-------|--------|-----|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 服务端口 |
| `DATABASE_PATH` | `/app/data/accounts.db` | 数据库路径 |
| `BROWSER_POOL_MIN_SIZE` | `1` | 最小浏览器实例数 |
| `BROWSER_POOL_MAX_SIZE` | `3` | 最大浏览器实例数 |
| `BROWSER_IDLE_TIMEOUT` | `1800000` | 浏览器空闲超时（30分钟） |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium-browser` | Chromium 路径 |

---

## ❓ 常见问题

<details>
<summary><b>Q: 如何获取小红书的 Cookie？</b></summary>

1. 打开浏览器开发者工具（F12）
2. 访问小红书网站并登录
3. 在 Network 标签中找到任意请求
4. 复制 Request Headers 中的 Cookie 值
5. 通过 `/api/accounts` 接口添加到系统中
</details>

<details>
<summary><b>Q: 浏览器启动失败怎么办？</b></summary>

检查以下配置：
- Docker 容器是否有足够的共享内存（`shm_size: 2gb`）
- 确保 Chromium 正确安装
- 查看日志：`docker-compose logs -f`
</details>

<details>
<summary><b>Q: 爬取速度慢怎么优化？</b></summary>

- 增加浏览器池大小（`BROWSER_POOL_MAX_SIZE`）
- 使用批量接口进行并发爬取
- 确保服务器资源充足（CPU、内存）
</details>

<details>
<summary><b>Q: 如何处理反爬虫？</b></summary>

- 使用真实的登录 Cookie
- 控制请求频率，避免过于频繁
- 定期更新 Cookie
- 使用多个账号轮询
</details>

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

在提交 PR 之前，请确保：
- 代码通过 `npm run lint` 检查
- 添加必要的测试用例
- 更新相关文档

---

## 📄 许可证

[MIT License](LICENSE)

---

## ⚠️ 免责声明

本项目仅供学习和研究使用，请勿用于商业用途。使用本项目时请遵守小红书的服务条款和相关法律法规。

---


## 💰 赞助支持

如果这个项目对你有帮助，请给个 ⭐ Star！欢迎请作者喝杯咖啡 ☕

<div align="center">

<img src="./alipay-qrcode.jpg" alt="支付宝收款码" width="300"/>

**扫码使用支付宝打赏**

</div>
