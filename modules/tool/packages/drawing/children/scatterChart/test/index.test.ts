import { describe, it, expect } from 'vitest';
import { tool, InputType } from '../src';

describe('scatterChart tool', () => {
  it('should generate basic scatter chart', async () => {
    const input = {
      title: '散点图测试',
      xAxis: [1, 2, 3, 4, 5],
      yAxis: [10, 20, 15, 25, 30],
      chartSubType: 'scatter',
      autoOptimize: true,
      colorScheme: 'blue',
      chartSize: 'medium',
      legendPosition: 'bottom'
    };

    // 验证输入类型
    const validatedInput = InputType.parse(input);
    expect(validatedInput.xAxis).toEqual(['1', '2', '3', '4', '5']);
    expect(validatedInput.yAxis).toEqual(['10', '20', '15', '25', '30']);

    // 测试工具执行
    const result = await tool(validatedInput);

    expect(result.chartUrl).toBeDefined();
    expect(result.echartsConfig).toBeDefined();
    expect(result.optimizationTip).toBeDefined();
    expect(result.chartUrl).toContain('mock-chart-storage');
  }, 10000);

  it('should generate bubble chart with size data', async () => {
    const input = {
      title: '气泡图测试',
      xAxis: [1, 2, 3, 4, 5],
      yAxis: [10, 20, 15, 25, 30],
      sizeAxis: [5, 10, 15, 8, 12],
      chartSubType: 'bubble',
      autoOptimize: true,
      colorScheme: 'green',
      chartSize: 'large'
    };

    const validatedInput = InputType.parse(input);
    const result = await tool(validatedInput);

    expect(result.chartUrl).toBeDefined();
    expect(result.optimizationTip).toContain('气泡图');

    // 验证配置包含气泡图设置
    const config = JSON.parse(result.echartsConfig);
    expect(config.series[0].type).toBe('scatter');
    expect(config.series[0].data[0]).toHaveLength(3); // [x, y, size]
  }, 10000);

  it('should handle string input format', async () => {
    const input = {
      xAxis: '1,2,3,4,5',
      yAxis: '10,20,15,25,30',
      chartSubType: 'scatter'
    };

    const validatedInput = InputType.parse(input);
    expect(validatedInput.xAxis).toEqual(['1', '2', '3', '4', '5']);
    expect(validatedInput.yAxis).toEqual(['10', '20', '15', '25', '30']);
  });
});
