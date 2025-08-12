import { describe, it, expect } from 'vitest';
import { tool, InputType } from '../src';

describe('radarChart tool', () => {
  it('should generate basic radar chart', async () => {
    const input = {
      title: '能力雷达图',
      indicators: ['攻击力', '防御力', '速度', '技能', '体力'],
      values: [80, 90, 65, 70, 85],
      chartSubType: 'basic',
      colorScheme: 'blue',
      chartSize: 'medium',
      legendPosition: 'bottom'
    };

    // 验证输入类型
    const validatedInput = InputType.parse(input);
    expect(validatedInput.indicators).toEqual(['攻击力', '防御力', '速度', '技能', '体力']);
    expect(validatedInput.values).toEqual(['80', '90', '65', '70', '85']);

    // 测试工具执行
    const result = await tool(validatedInput);

    expect(result.chartUrl).toBeDefined();
    expect(result.echartsConfig).toBeDefined();
    expect(result.chartDescription).toBeDefined();
    expect(result.chartUrl).toContain('mock-chart-storage');
    expect(result.chartDescription).toContain('5个维度');
  }, 10000);

  it('should generate filled radar chart with max values', async () => {
    const input = {
      title: '性能对比',
      indicators: ['CPU', '内存', '存储', '网络'],
      values: [75, 60, 90, 85],
      maxValues: [100, 100, 100, 100],
      chartSubType: 'filled',
      colorScheme: 'green',
      chartSize: 'large'
    };

    const validatedInput = InputType.parse(input);
    const result = await tool(validatedInput);

    expect(result.chartUrl).toBeDefined();
    expect(result.chartDescription).toContain('填充型雷达图');
    expect(result.chartDescription).toContain('4个维度');

    // 验证配置包含雷达图设置
    const config = JSON.parse(result.echartsConfig);
    expect(config.radar).toBeDefined();
    expect(config.radar.indicator).toHaveLength(4);
    expect(config.series[0].type).toBe('radar');
  }, 10000);

  it('should handle string input format', async () => {
    const input = {
      indicators: '攻击,防御,速度,技能',
      values: '80,90,65,70'
    };

    const validatedInput = InputType.parse(input);
    expect(validatedInput.indicators).toEqual(['攻击', '防御', '速度', '技能']);
    expect(validatedInput.values).toEqual(['80', '90', '65', '70']);
  });

  it('should auto-calculate max values when not provided', async () => {
    const input = {
      title: '自动计算最大值',
      indicators: ['项目A', '项目B', '项目C'],
      values: [45, 78, 92],
      chartSubType: 'filled'
    };

    const validatedInput = InputType.parse(input);
    const result = await tool(validatedInput);

    expect(result.chartUrl).toBeDefined();

    // 验证自动计算的最大值
    const config = JSON.parse(result.echartsConfig);
    expect(config.radar.indicator[0].max).toBeGreaterThan(92); // 应该是 92 * 1.2
  }, 10000);
});
