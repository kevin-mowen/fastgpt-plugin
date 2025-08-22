# FastGPT插件服务构建指南

由于阿里云构建服务的Docker Hub限制，推荐以下两种构建方案：

## 方案1：本地构建推送（推荐）

### 步骤：
1. **本地构建镜像**：
```bash
# 先构建代码
bun run build

# 构建Docker镜像
docker build -t fastgpt-plugin:latest .

# 标记为阿里云镜像
docker tag fastgpt-plugin:latest crpi-0nyhmsk4kaamfjub.cn-guangzhou.personal.cr.aliyuncs.com/mokevin/fastgpt-plugin:latest

# 推送到阿里云
docker push crpi-0nyhmsk4kaamfjub.cn-guangzhou.personal.cr.aliyuncs.com/mokevin/fastgpt-plugin:latest
```

2. **更新docker-compose**：
镜像就会自动更新

## 方案2：使用GitHub Actions自动构建

创建 `.github/workflows/docker-build.yml`：

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ release ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Install dependencies
      run: bun install
    
    - name: Build application
      run: bun run build
    
    - name: Login to Alibaba Cloud Registry
      uses: docker/login-action@v3
      with:
        registry: crpi-0nyhmsk4kaamfjub.cn-guangzhou.personal.cr.aliyuncs.com
        username: ${{ secrets.ALIBABA_CLOUD_REGISTRY_USERNAME }}
        password: ${{ secrets.ALIBABA_CLOUD_REGISTRY_PASSWORD }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: crpi-0nyhmsk4kaamfjub.cn-guangzhou.personal.cr.aliyuncs.com/mokevin/fastgpt-plugin:latest
```

## 当前问题说明

阿里云构建服务遇到Docker Hub速率限制 `429 Too Many Requests`，这是因为：
1. Docker Hub对匿名拉取有限制
2. 阿里云构建服务没有配置Docker Hub认证
3. 所有公共基础镜像都受到限制

**推荐使用方案1进行本地构建推送**，这样可以完全避开这个问题。