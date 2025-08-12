# 图表工具迁移指南

从 `complexChart` 到新图表工具系统的迁移指南。

## 📋 迁移概述

### 架构变更

**之前**: 单一的 `complexChart` 工具处理所有图表类型
**现在**: 专门的图表工具，每种类型一个独立工具

### 新工具对应关系

| 原 complexChart 类型 | 新工具 | 说明 |
|---------------------|--------|------|
| `bar` | `barChart` | 柱状图 |
| `line` | `lineChart` | 折线图 |
| `pie` | `pieChart` | 饼图 |
| `scatter` | `scatterChart` | 散点图 |
| `radar` | `radarChart` | 雷达图 |

## 🔄 API 迁移对照

### 1. 柱状图迁移

**之前 (complexChart)**:
```javascript
{
  "title": "销售数据",
  "chartType": "bar",
  "xData": ["产品A", "产品B", "产品C"],
  "yData": [120, 180, 150],
  "configuration": {
    "barWidth": 0.6,
    "colorScheme": "blue"
  }
}
```

**现在 (barChart)**:
```javascript
{
  "title": "销售数据",
  "xAxis": ["产品A", "产品B", "产品C"],
  "yAxis": ["120", "180", "150"],
  "barWidth": 0.6,
  "colorScheme": "blue",
  "chartSubType": "normal"
}
```

**主要变更**:
- `chartType` 参数移除 (由工具类型决定)
- `xData` → `xAxis`
- `yData` → `yAxis` (现在接受字符串数组)
- `configuration` 对象拆分为顶级参数
- 新增 `chartSubType` 支持堆积图等变体

### 2. 折线图迁移

**之前 (complexChart)**:
```javascript
{
  "chartType": "line",
  "xData": ["1月", "2月", "3月"],
  "yData": [100, 150, 120],
  "configuration": {
    "smooth": true,
    "areaStyle": true
  }
}
```

**现在 (lineChart)**:
```javascript
{
  "xAxis": ["1月", "2月", "3月"],
  "yAxis": ["100", "150", "120"],
  "chartSubType": "smooth", // 或 "area"
  "autoOptimize": true
}
```

**主要变更**:
- `smooth` 和 `areaStyle` 合并为 `chartSubType`
- 支持的子类型: `basic`, `smooth`, `stepped`, `area`
- 新增自动优化功能

### 3. 饼图迁移

**之前 (complexChart)**:
```javascript
{
  "chartType": "pie",
  "categories": ["产品A", "产品B"],
  "values": [30, 70],
  "configuration": {
    "radius": ["40%", "70%"]  // 环形图
  }
}
```

**现在 (pieChart)**:
```javascript
{
  "categories": ["产品A", "产品B"],
  "values": ["30", "70"],
  "chartSubType": "donut",
  "innerRadius": 0.4,
  "showPercentage": true,
  "labelPosition": "outside"
}
```

**主要变更**:
- 环形图通过 `chartSubType: "donut"` 设置
- `radius` 配置简化为 `innerRadius` 数值
- 新增标签显示控制选项
- 输出包含详细统计信息

## 📊 输出格式变更

### 通用输出

**之前**:
```javascript
{
  "imageUrl": "https://...",
  "chartConfig": "{...}",
  "summary": "图表生成成功"
}
```

**现在**:
```javascript
// 柱状图/折线图
{
  "chartUrl": "https://...",
  "echartsConfig": "{...}",
  "optimizationTip": "✅ 数据显示正常，无需额外优化"
}

// 饼图
{
  "chartUrl": "https://...",
  "echartsConfig": "{...}",
  "statisticsInfo": "📊 数据统计分析:\n• 总数量: 100\n..."
}
```

**主要变更**:
- `imageUrl` → `chartUrl`
- `chartConfig` → `echartsConfig`
- 饼图提供详细统计信息
- 柱状图/折线图提供优化建议

## ⚙️ 配置选项映射

### 颜色方案
保持兼容，无需更改:
- `blue`, `green`, `warm`, `cool`, `purple`

### 图表尺寸
保持兼容，无需更改:
- `small` (400x300)
- `medium` (600x450)  
- `large` (800x600)

### 图例位置
保持兼容，无需更改:
- `top`, `right`, `bottom`, `left`, `none`

## 🔧 迁移步骤

### 步骤 1: 识别现有用法

扫描代码库中所有使用 `complexChart` 的地方：
```bash
grep -r "complexChart" --include="*.js" --include="*.ts" .
```

### 步骤 2: 按图表类型分类

根据 `chartType` 参数确定需要迁移到哪个新工具：
- `bar` → `barChart`
- `line` → `lineChart`  
- `pie` → `pieChart`
- `scatter` → `scatterChart`
- `radar` → `radarChart`

### 步骤 3: 更新参数结构

按照上述对照表更新参数结构，主要注意：
1. 移除 `chartType` 参数
2. 重命名数据参数 (`xData` → `xAxis`, `yData` → `yAxis`)
3. 将配置对象参数提升到顶级
4. 数值数据转换为字符串数组
5. 添加适当的 `chartSubType`

### 步骤 4: 更新输出处理

更新处理返回值的代码：
1. `imageUrl` → `chartUrl`
2. `chartConfig` → `echartsConfig`
3. 根据工具类型处理特殊输出 (如饼图的统计信息)

### 步骤 5: 测试验证

1. 单元测试更新
2. 集成测试验证
3. 视觉回归测试 (确保图表外观一致)

## 🚨 注意事项

### 破坏性变更

1. **工具调用方式**: 需要调用不同的工具而不是传递 `chartType`
2. **数据格式**: Y轴数据现在必须是字符串数组
3. **输出键名**: 部分输出字段重命名
4. **配置结构**: 扁平化配置结构

### 兼容性

1. **图表外观**: 新工具生成的图表与原工具基本一致
2. **功能增强**: 新工具提供更多配置选项和优化功能
3. **性能提升**: 模块化设计提供更好的性能

### 渐进式迁移

可以采用渐进式迁移策略：
1. 保留 `complexChart` 作为兼容层
2. 新功能使用新工具
3. 逐步迁移现有功能
4. 最后移除 `complexChart`

## 📝 迁移检查清单

- [ ] 识别所有使用 `complexChart` 的位置
- [ ] 更新工具调用 (按图表类型)
- [ ] 更新输入参数结构
- [ ] 更新输出处理逻辑
- [ ] 更新单元测试
- [ ] 运行集成测试
- [ ] 验证图表生成正确
- [ ] 性能测试
- [ ] 文档更新
- [ ] 用户通知/培训

## 🆘 故障排除

### 常见问题

1. **数据类型错误**: 确保 Y轴数据是字符串数组
2. **配置参数丢失**: 检查是否正确映射了所有配置参数
3. **输出字段未找到**: 更新输出字段名称引用
4. **图表类型不匹配**: 确认使用了正确的新工具

### 获取帮助

- 查看各工具的测试文件了解正确用法
- 参考工具配置文件了解完整参数列表
- 检查 chart-core 文档了解共享功能

---

通过遵循此迁移指南，可以平稳地从旧的 `complexChart` 迁移到新的模块化图表工具系统，获得更好的性能、更多功能和更清晰的代码结构。