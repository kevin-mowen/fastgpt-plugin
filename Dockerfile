# --------- builder -----------
FROM node:22-alpine AS builder
WORKDIR /app

# 安装bun
RUN npm install -g bun

# 复制所有文件
COPY . .

# 安装依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm install

# 直接构建主要文件，避免复杂的构建脚本
RUN mkdir -p dist && \
    bun build --outfile=dist/index.js --target=node ./src/index.ts && \
    bun build --outfile=dist/worker.js --target=node ./src/worker/worker.ts

# 构建工具（允许失败）
RUN bun ./scripts/build.ts || echo "Tool build failed, continuing..."

# --------- runner -----------
FROM node:22-alpine AS runner
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    curl ca-certificates dumb-init \
    && update-ca-certificates

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制构建产物
COPY --from=builder --chown=nodejs:nodejs /app/dist/ ./dist/
COPY --from=builder --chown=nodejs:nodejs /app/dist/public/ ./public/
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV TOOLS_DIR=./dist/tools
ENV NODE_PATH=/app/dist

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 切换到非root用户
USER nodejs

# 使用dumb-init作为PID 1进程，更好的信号处理
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]