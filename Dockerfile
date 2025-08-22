# 使用阿里云公开镜像
FROM registry.cn-hangzhou.aliyuncs.com/library/node:20-alpine

WORKDIR /app

# 安装运行时依赖 (Alpine使用apk)
RUN apk add --no-cache \
    curl \
    ca-certificates \
    dumb-init

# 创建非root用户 (Alpine语法)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 复制预构建的产物（需要本地先运行 bun run build）
COPY --chown=nodejs:nodejs ./dist/ ./dist/
COPY --chown=nodejs:nodejs ./package.json ./package.json

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