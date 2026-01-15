# ================================
# 阶段1: 构建阶段
# ================================
FROM node:20-alpine AS builder

# 设置环境变量 - 跳过 Puppeteer 下载
ENV PUPPETEER_SKIP_DOWNLOAD=true

# 设置工作目录
WORKDIR /app

# 配置 npm 使用淘宝镜像加速
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装编译依赖（sqlite3 等 native 模块需要）+ 安装所有依赖 + 清理缓存（合并为一层）
RUN apk add --no-cache python3 py3-setuptools make g++ && \
    npm ci && \
    npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# ================================
# 阶段2: 生产阶段（优化后）
# ================================
FROM node:20-alpine AS production

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 安装运行时依赖（移除编译工具：python3, py3-setuptools, make, g++）
# 只保留 Chromium 和必要的运行时库
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji && \
    # 清理 apk 缓存
    rm -rf /var/cache/apk/*

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 从构建阶段复制 package.json（用于记录依赖版本）
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# 从构建阶段直接复制已编译的 node_modules（避免重复安装）
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# 从构建阶段复制编译后的代码
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# 创建数据目录
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "dist/main.js"]
