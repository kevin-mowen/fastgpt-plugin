import { describe, it, expect } from 'vitest';
import { tool } from '../src';

describe('lineChart tool', () => {
  it('应该生成基础折线图', async () => {
    const result = await tool({
      title: '测试折线图',
      xAxis: ['1月', '2月', '3月', '4月'],
      yAxis: ['100', '150', '120', '180'],
      chartSubType: 'basic',
      autoOptimize: false,
      showZeroLine: true,
      colorScheme: 'blue',
      chartSize: 'medium',
      legendPosition: 'bottom'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.echartsConfig).toContain('"type":"line"');
    expect(result.optimizationTip).toContain('数据显示正常');
  });

  it('应该检测小范围大数值问题', async () => {
    const result = await tool({
      title: '小范围大数值测试',
      xAxis: ['Day1', 'Day2', 'Day3', 'Day4'],
      yAxis: ['1000000', '1000050', '1000080', '999950'], // 小波动大数值
      chartSubType: 'basic',
      autoOptimize: true,
      showZeroLine: true,
      colorScheme: 'blue',
      chartSize: 'medium',
      legendPosition: 'bottom'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.optimizationTip).toContain('检测到');
    expect(result.optimizationTip).toContain('已自动应用优化');
  });

  it('应该支持不同的子类型', async () => {
    const result = await tool({
      title: '平滑折线图',
      xAxis: ['A', 'B', 'C'],
      yAxis: ['10', '20', '15'],
      chartSubType: 'smooth',
      autoOptimize: false,
      showZeroLine: true,
      colorScheme: 'green',
      chartSize: 'small',
      legendPosition: 'top'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.echartsConfig).toContain('"smooth":true');
  });

  it('应该支持手动Y轴范围设置', async () => {
    const result = await tool({
      title: '手动Y轴范围',
      xAxis: ['A', 'B', 'C'],
      yAxis: ['100', '200', '300'],
      chartSubType: 'basic',
      autoOptimize: false,
      yMin: 50,
      yMax: 350,
      showZeroLine: false,
      colorScheme: 'warm',
      chartSize: 'large',
      legendPosition: 'right'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.echartsConfig).toContain('"min":50');
    expect(result.echartsConfig).toContain('"max":350');
  });
});
