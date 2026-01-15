#!/bin/bash

# ================================
# 小红书爬虫工具 - 快速启动脚本
# ================================

set -e

echo "========================================="
echo "  小红书爬虫工具 - 快速启动"
echo "========================================="
echo ""

# 检查是否为首次运行
if [ ! -f "data/accounts.db" ]; then
    echo "检测到首次运行，开始完整部署..."
    ./deploy.sh deploy
else
    echo "启动已存在的服务..."
    docker-compose up -d
    
    echo ""
    echo "服务启动完成！"
    echo "服务地址: http://localhost:3000"
    echo "API文档: http://localhost:3000/api-docs"
    echo ""
    echo "查看日志: docker-compose logs -f"
fi
