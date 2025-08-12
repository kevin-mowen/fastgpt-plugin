# Drawing Tools - 图表绘制工具集

这是一个模块化的图表绘制工具集，用于生成各种类型的数据可视化图表。基于 ECharts 构建，支持多种图表类型和自定义配置。

## 🏗️ 架构概述

### 核心组件

- **chart-core**: 核心图表生成器和共享功能
- **children/**: 各种专门的图表工具实现
- **baseChart**: 基础图表工具（通用接口）

### 支持的图表类型

1. **柱状图** (barChart) - 支持普通和堆积模式
2. **折线图** (lineChart) - 支持基础、平滑、阶梯、面积图
3. **饼图** (pieChart) - 支持普通、环形、漏斗图
4. **散点图** (scatterChart) - 支持基础散点图和气泡图
5. **雷达图** (radarChart) - 支持基础和填充雷达图

## 📦 图表核心库 (chart-core)

### 主要功能

- **ChartGenerator**: 统一的图表生成器基类
- **SmallRangeDetector**: 小范围大数值检测和优化
- **InputAdapter**: 输入数据标准化适配器
- **StyleOptions**: 样式配置和主题管理
- **mockUpload**: 测试环境文件上传模拟

### 样式配置

支持5种内置颜色方案：
- `blue`: 蓝色系 (默认)
- `green`: 绿色系
- `warm`: 暖色系
- `cool`: 冷色系  
- `purple`: 紫色系

支持3种尺寸规格：
- `small`: 400x300
- `medium`: 600x450 (默认)
- `large`: 800x600

## 🔧 各图表工具详解

### 1. 柱状图 (barChart)

**功能特点**:
- 支持普通柱状图和堆积柱状图
- 自动柱宽验证 (0.1-1.0 范围)
- 小范围大数值自动优化
- 手动Y轴范围设置

**输入参数**:
```typescript
{
  title: string;           // 图表标题
  xAxis: string[];         // X轴分类数据
  yAxis: string[];         // Y轴数值数据
  chartSubType: 'normal' | 'stacked';  // 图表子类型
  barWidth: number;        // 柱宽 (0.1-1.0)
  autoOptimize: boolean;   // 自动优化开关
  // ... 通用样式配置
}
```

### 2. 折线图 (lineChart)

**功能特点**:
- 支持基础、平滑、阶梯、面积图
- Y轴范围自动优化
- 数值趋势智能分析

**输入参数**:
```typescript
{
  chartSubType: 'basic' | 'smooth' | 'stepped' | 'area';
  // ... 其他与柱状图相似
}
```

### 3. 饼图 (pieChart)

**功能特点**:
- 支持普通饼图、环形图、漏斗图
- 自动占比计算和统计分析
- 灵活的标签显示配置

**输入参数**:
```typescript
{
  categories: string[];    // 分类名称
  values: string[];        // 对应数值
  chartSubType: 'normal' | 'donut' | 'funnel';
  innerRadius: number;     // 内径大小 (环形图)
  showPercentage: boolean; // 显示百分比
  showValue: boolean;      // 显示原始数值
  labelPosition: 'outside' | 'inside' | 'none';
}
```

**统计信息输出**:
- 总数量和分类数
- 最大/最小占比分析
- 详细占比列表

### 4. 散点图 (scatterChart)

**功能特点**:
- 基础散点图和气泡图
- 支持第三维数据 (气泡大小)
- 数据关联性可视化

### 5. 雷达图 (radarChart)

**功能特点**:
- 多维度数据对比
- 自动/手动最大值设置
- 支持填充和线框模式

## 🛠️ 开发指南

### 添加新图表类型

1. 在 `children/` 目录创建新工具目录
2. 实现必要文件：
   - `config.ts`: 工具配置和I/O定义
   - `index.ts`: 工具导出
   - `src/index.ts`: 主要实现逻辑
   - `test/index.test.ts`: 测试用例

3. 继承 `ChartGenerator` 或直接使用
4. 实现输入验证和输出格式化
5. 添加完整的测试覆盖

### 测试规范

- 每个工具至少4个测试用例
- 覆盖主要功能和边界情况
- 验证输出格式和数据准确性
- 使用 mock 文件上传避免外部依赖

### 代码规范

- 使用 Zod 进行输入验证和类型安全
- 遵循项目的 TypeScript 配置
- 保持一致的错误处理方式
- 生产环境格式化JSON输出，测试环境压缩

## 📋 维护说明

### 性能优化

- Chart-core 提供共享逻辑避免重复
- 测试环境使用压缩JSON减少比较复杂度
- 生产环境使用格式化JSON提升可读性

### 错误处理

- 统一的错误消息格式
- 输入数据验证和边界检查
- 图表生成失败的优雅降级

### 未来扩展

- 支持更多图表类型 (树状图、桑基图等)
- 增强交互功能配置
- 支持动画效果配置
- 主题和样式系统扩展

---

通过模块化设计，每个图表工具都可以独立开发、测试和维护，同时共享核心功能和保持一致的用户体验。