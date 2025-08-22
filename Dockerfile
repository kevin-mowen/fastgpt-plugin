# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app

# 构建期需要的工具
RUN apk add --no-cache curl ca-certificates dumb-init \
 && npm i -g bun@1.2.20

# 一次性拷贝整个仓库（monorepo/workspaces 需要看到所有 package.json）
COPY . .

# 可选：走国内源
ENV npm_config_registry=https://registry.npmmirror.com

# 关键：用 bun 安装（会根据 bun.lockb 和 workspaces 把依赖全部装好）
RUN bun install --frozen-lockfile

# 构建
RUN bun run build:no-tsc


# ---------- runner ----------
FROM node:22-alpine AS runner
WORKDIR /app

# 运行期需要的工具（healthcheck 用到 curl）
RUN apk add --no-cache curl ca-certificates dumb-init

# 复制运行时需要的 package 清单（若 dist 仍需依赖，装生产依赖）
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps --registry=https://registry.npmmirror.com || true

# 复制已编译产物和必需的模块目录
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/modules ./modules

# 创建非 root 用户并赋权
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001 -G nodejs \
 && chown -R nodejs:nodejs /app

ENV NODE_ENV=production
ENV PORT=3000
ENV TOOLS_DIR=./dist/tools

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
