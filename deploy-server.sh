#!/bin/bash

# 生产服务器部署脚本
# 在生产服务器上执行此脚本

set -e

echo "🚀 开始部署小红书爬虫服务..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 步骤1：创建数据目录
echo -e "${YELLOW}📁 步骤 1/5: 创建并配置数据目录...${NC}"
mkdir -p ./data ./logs
chmod 777 ./data ./logs
echo -e "${GREEN}✅ 数据目录创建成功${NC}"
echo ""

# 步骤2：检查 Docker 服务
echo -e "${YELLOW}🔍 步骤 2/5: 检查 Docker 服务...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker 服务正常${NC}"
echo ""

# 步骤3：登录镜像仓库（如果是私有仓库）
echo -e "${YELLOW}🔐 步骤 3/5: 登录镜像仓库...${NC}"
echo "如果是私有仓库，请输入用户名（公共仓库直接回车跳过）："
read -r DOCKER_USERNAME

if [ -n "$DOCKER_USERNAME" ]; then
    echo "请输入密码："
    read -s DOCKER_PASSWORD
    echo ""
    
    echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin your-registry.example.com || {
        echo -e "${RED}❌ 登录失败${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ 登录成功${NC}"
else
    echo -e "${YELLOW}⏭️  跳过登录${NC}"
fi
echo ""

# 步骤4：拉取最新镜像
echo -e "${YELLOW}📦 步骤 4/5: 拉取最新镜像...${NC}"
docker-compose -f docker-compose.prod.yml pull || {
    echo -e "${RED}❌ 拉取镜像失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 镜像拉取成功${NC}"
echo ""

# 步骤5：启动服务
echo -e "${YELLOW}🚀 步骤 5/5: 启动服务...${NC}"
docker-compose -f docker-compose.prod.yml up -d || {
    echo -e "${RED}❌ 启动失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 服务启动成功${NC}"
echo ""

# 等待服务就绪
echo -e "${YELLOW}⏳ 等待服务就绪...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务已就绪${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 服务启动超时，请检查日志${NC}"
        echo ""
        echo "查看日志："
        docker-compose -f docker-compose.prod.yml logs --tail=50
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""

# 显示服务状态
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ 部署完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 服务状态："
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🏥 健康检查："
curl -s http://localhost:3000/health | python3 -m json.tool || echo "健康检查失败"
echo ""
echo "📝 常用命令："
echo "  - 查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - 重启服务: docker-compose -f docker-compose.prod.yml restart"
echo "  - 停止服务: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "📡 服务地址："
echo "  - API: http://localhost:3000"
echo "  - 健康检查: http://localhost:3000/health"
echo "  - API文档: http://localhost:3000/api-docs"
echo ""
