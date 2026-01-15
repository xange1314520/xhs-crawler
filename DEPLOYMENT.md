# Docker 部署指南

本文档介绍如何在Linux服务器上使用Docker部署小红书爬虫服务。

## 📋 前提条件

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 内存
- 至少 5GB 磁盘空间

## 🚀 快速开始

### 1. 克隆代码

```bash
git clone <your-repo-url>
cd xhs-crawler
```

### 2. 构建并启动服务

```bash
# 构建镜像并启动服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f xhs-crawler

# 查看服务状态
docker-compose ps
```

### 3. 验证服务

```bash
# 健康检查
curl http://localhost:3000/health

# 查看API文档
# 浏览器访问: http://localhost:3000/api-docs
```

## 🔧 配置说明

### 环境变量

在 `docker-compose.yml` 中配置环境变量：

```yaml
environment:
  # 应用配置
  NODE_ENV: production
  PORT: 3000
  
  # Puppeteer配置（Docker环境必须）
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true"
  PUPPETEER_EXECUTABLE_PATH: /usr/bin/chromium-browser
  
  # 浏览器连接池配置
  BROWSER_POOL_MAX_INSTANCES: 5      # 最大浏览器实例数
  BROWSER_POOL_MIN_INSTANCES: 3      # 最小浏览器实例数
  BROWSER_POOL_IDLE_TIMEOUT_MINUTES: 30
  BROWSER_POOL_HEALTH_CHECK_INTERVAL_SECONDS: 60
```

### 端口映射

默认映射到主机的 `3000` 端口：

```yaml
ports:
  - "3000:3000"
```

修改为其他端口：

```yaml
ports:
  - "8080:3000"  # 映射到主机的8080端口
```

### 数据持久化

数据库和日志文件会持久化到本地目录：

```yaml
volumes:
  - ./data:/app/data    # 数据库文件
  - ./logs:/app/logs    # 日志文件
```

## 📦 Chromium 安装说明

### Docker 镜像内置 Chromium

本项目的 Dockerfile 已经配置好了 Chromium：

```dockerfile
# 安装 Chromium 和依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# 设置 Puppeteer 使用系统 Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 为什么使用 Alpine Linux + Chromium？

✅ **镜像小**：约 300MB（vs Debian + Chrome 约 1GB+）  
✅ **性能好**：Alpine 内核优化  
✅ **安全性**：最小化攻击面  
✅ **稳定性**：Chromium 包维护良好

## 🔍 常见问题

### 1. 浏览器启动失败

**错误**: `Failed to launch the browser process`

**解决方案**: 确保容器有足够的共享内存

```yaml
# docker-compose.yml 添加
services:
  xhs-crawler:
    shm_size: '2gb'  # 增加共享内存
```

### 2. 内存不足

**错误**: `JavaScript heap out of memory`

**解决方案**: 增加 Node.js 内存限制

```yaml
environment:
  NODE_OPTIONS: "--max-old-space-size=4096"  # 4GB
```

### 3. 权限问题

**错误**: `EACCES: permission denied`

**解决方案**: 检查挂载目录权限

```bash
# 给予正确的权限
sudo chown -R 1001:1001 ./data ./logs
```

### 4. 网络问题

如果容器无法访问外网：

```bash
# 检查Docker网络
docker network inspect xhs-network

# 重建网络
docker-compose down
docker-compose up -d
```

## 🎯 使用示例

### 添加账号

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的账号",
    "cookie": "你的完整Cookie字符串"
  }'
```

### 爬取帖子

```bash
curl "http://localhost:3000/api/posts/6408f3bd000000002703bbc9/detail?xsecToken=xxx"
```

### 批量爬取

```bash
curl -X POST http://localhost:3000/api/posts/batch \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {"postId": "6408f3bd000000002703bbc9", "xsecToken": "xxx"},
      {"postId": "6964cb84000000000a03e044", "xsecToken": "yyy"}
    ]
  }'
```

## 📊 监控和维护

### 查看日志

```bash
# 实时日志
docker-compose logs -f xhs-crawler

# 最近100行日志
docker-compose logs --tail=100 xhs-crawler
```

### 重启服务

```bash
# 重启
docker-compose restart xhs-crawler

# 停止
docker-compose stop xhs-crawler

# 启动
docker-compose start xhs-crawler
```

### 更新服务

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

### 清理资源

```bash
# 停止并删除容器
docker-compose down

# 删除容器和镜像
docker-compose down --rmi all

# 删除容器、镜像和数据卷
docker-compose down --rmi all -v
```

## 🔐 生产环境建议

### 1. 使用反向代理

使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 启用 HTTPS

使用 Let's Encrypt 获取免费SSL证书：

```bash
sudo certbot --nginx -d your-domain.com
```

### 3. 资源限制

限制容器资源使用：

```yaml
services:
  xhs-crawler:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 4. 备份数据

定期备份数据库：

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp ./data/accounts.db ./backups/accounts_$DATE.db
# 保留最近7天的备份
find ./backups -name "accounts_*.db" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加到crontab
crontab -e
# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

### 5. 日志轮转

配置日志轮转避免磁盘占满：

```yaml
# docker-compose.yml
services:
  xhs-crawler:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🐛 调试技巧

### 进入容器

```bash
# 进入容器shell
docker-compose exec xhs-crawler sh

# 查看浏览器进程
ps aux | grep chromium

# 查看系统资源
top
```

### 查看浏览器路径

```bash
docker-compose exec xhs-crawler which chromium-browser
# 输出: /usr/bin/chromium-browser
```

### 测试 Chromium

```bash
docker-compose exec xhs-crawler chromium-browser --version
```

## 📚 相关文档

- [README.md](README.md) - 项目介绍
- [GET_COOKIE.md](./docs/GET_COOKIE.md) - 如何获取Cookie
- [API文档](http://localhost:3000/api-docs) - 完整API文档

## ❓ 需要帮助？

如果遇到问题：

1. 查看日志：`docker-compose logs -f`
2. 检查健康状态：`docker-compose ps`
3. 查看容器资源：`docker stats xhs-crawler`
4. 查看本文档的常见问题部分

---

**版本**: 1.0.0  
**最后更新**: 2026-01-14
