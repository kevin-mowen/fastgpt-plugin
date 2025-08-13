import { describe, it, expect } from 'vitest';
import { tool } from '../src';

describe('barChart tool', () => {
  it('应该生成普通柱状图', async () => {
    const result = await tool({
      title: '销售数据',
      xAxis: ['产品A', '产品B', '产品C', '产品D'],
      yAxis: ['120', '180', '150', '200'],
      chartSubType: 'normal',
      autoOptimize: false,
      showZeroLine: true,
      barWidth: 0.6,
      colorScheme: 'blue',
      chartSize: 'medium',
      legendPosition: 'bottom'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.echartsConfig).toContain('"type":"bar"');
    expect(result.optimizationTip).toContain('数据显示正常');
  });

  it('应该生成堆积柱状图', async () => {
    const result = await tool({
      title: '堆积销售数据',
      xAxis: ['Q1', 'Q2', 'Q3', 'Q4'],
      yAxis: ['100,80,60,120;90,70,85,110'], // 堆积数据格式：两个系列，每个系列4个数据点
      chartSubType: 'stacked',
      autoOptimize: false,
      showZeroLine: true,
      barWidth: 0.8,
      colorScheme: 'green',
      chartSize: 'large',
      legendPosition: 'top'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.echartsConfig).toContain('"type":"bar"');
    expect(result.echartsConfig).toContain('"stack":"total"');
  });

  it('应该检测小范围大数值问题', async () => {
    const result = await tool({
      title: '小范围大数值测试',
      xAxis: ['A', 'B', 'C', 'D'],
      yAxis: ['2000000', '2000050', '2000080', '1999950'],
      chartSubType: 'normal',
      autoOptimize: true,
      showZeroLine: true,
      barWidth: 0.6,
      colorScheme: 'warm',
      chartSize: 'small',
      legendPosition: 'right'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.optimizationTip).toContain('检测到');
    expect(result.optimizationTip).toContain('已自动应用优化');
  });

  it('应该验证barWidth范围', async () => {
    const result = await tool({
      title: '柱子宽度测试',
      xAxis: ['A', 'B', 'C'],
      yAxis: ['10', '20', '15'],
      chartSubType: 'normal',
      autoOptimize: false,
      barWidth: 1.5, // 超出范围，应该被重置为0.6
      showZeroLine: true,
      colorScheme: 'purple',
      chartSize: 'medium',
      legendPosition: 'bottom'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    // 验证barWidth被重置为默认值（转换为像素）
    expect(result.echartsConfig).toContain('"barWidth":"36px"');
  });

  it('应该支持手动Y轴范围设置', async () => {
    const result = await tool({
      title: '手动Y轴范围',
      xAxis: ['A', 'B', 'C'],
      yAxis: ['100', '200', '300'],
      chartSubType: 'normal',
      autoOptimize: false,
      yMin: 50,
      yMax: 350,
      showZeroLine: false,
      barWidth: 0.7,
      colorScheme: 'cool',
      chartSize: 'large',
      legendPosition: 'left'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.echartsConfig).toContain('"min":50');
    expect(result.echartsConfig).toContain('"max":350');
  });
});
