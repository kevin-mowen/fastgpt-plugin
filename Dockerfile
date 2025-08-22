# 使用国内镜像源 - 网易云镜像
FROM hub-mirror.c.163.com/library/node:20-slim

WORKDIR /app

# 安装运行时依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 创建非root用户
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

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