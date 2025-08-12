import { describe, it, expect } from 'vitest';
import { tool } from '../src';

describe('pieChart tool', () => {
  it('应该生成基础饼图', async () => {
    const result = await tool({
      title: '销售占比',
      categories: ['产品A', '产品B', '产品C', '产品D'],
      values: ['25', '30', '20', '25'],
      chartSubType: 'normal',
      colorScheme: 'blue',
      chartSize: 'medium',
      legendPosition: 'bottom'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.echartsConfig).toContain('"type":"pie"');
    expect(result.statisticsInfo).toContain('总数量: 100');
  });

  it('应该生成环形图', async () => {
    const result = await tool({
      title: '用户分布',
      categories: ['新用户', '活跃用户', '沉默用户'],
      values: ['40', '35', '25'],
      chartSubType: 'donut',
      innerRadius: 0.5,
      colorScheme: 'green',
      chartSize: 'large',
      legendPosition: 'right'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.echartsConfig).toContain('"type":"pie"');
    expect(result.echartsConfig).toContain('"radius":["50%","70%"]');
    expect(result.statisticsInfo).toContain('最大占比: 新用户 (40.0%)');
  });

  it('应该正确计算统计信息', async () => {
    const result = await tool({
      title: '测试统计',
      categories: ['A', 'B', 'C'],
      values: ['10', '20', '30'],
      chartSubType: 'normal',
      colorScheme: 'warm',
      chartSize: 'small',
      legendPosition: 'top'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.statisticsInfo).toContain('总数量: 60');
    expect(result.statisticsInfo).toContain('最大占比: C (50.0%)');
    expect(result.statisticsInfo).toContain('最小占比: A (16.7%)');
  });

  it('应该支持不同的颜色方案', async () => {
    const result = await tool({
      title: '颜色测试',
      categories: ['X', 'Y'],
      values: ['50', '50'],
      chartSubType: 'normal',
      colorScheme: 'purple',
      chartSize: 'medium',
      legendPosition: 'left'
    });

    expect(result.chartUrl).toMatch(/^https?:\/\//);
    expect(result.echartsConfig).toContain('"color":["#9a60b4"');
  });
});
