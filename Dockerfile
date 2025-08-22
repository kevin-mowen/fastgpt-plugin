# 直接使用Docker Hub官方镜像
FROM node:22-alpine

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache \
    curl \
    ca-certificates \
    dumb-init

# 复制源码和配置文件
COPY package*.json ./
COPY bun.lockb* ./

# 安装npm和bun
RUN npm install -g bun

# 安装依赖 (使用legacy-peer-deps解决冲突)
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建应用
RUN bun run build:no-tsc

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 设置文件权限
RUN chown -R nodejs:nodejs /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV TOOLS_DIR=./dist/tools

# 切换到nodejs用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]