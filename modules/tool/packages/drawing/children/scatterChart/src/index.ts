import { z } from 'zod';
import { ChartGenerator, InputAdapter } from '@tool/chart-core';
import type { YAxisRange } from '@tool/chart-core';

export const InputType = z
  .object({
    title: z.string().optional().default(''),
    xAxis: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    yAxis: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    sizeAxis: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]).optional(),
    chartSubType: z.string().optional().default('scatter'),
    autoOptimize: z.boolean().optional().default(true),
    colorScheme: z.string().optional().default('blue'),
    chartSize: z.string().optional().default('medium'),
    legendPosition: z.string().optional().default('bottom')
  })
  .transform((data) => {
    return {
      ...data,
      xAxis: InputAdapter.normalizeXAxis(data.xAxis),
      yAxis: InputAdapter.normalizeYAxis(data.yAxis),
      sizeAxis: data.sizeAxis ? InputAdapter.normalizeYAxis(data.sizeAxis) : undefined
    };
  });

export const OutputType = z.object({
  chartUrl: z.string(),
  echartsConfig: z.string(),
  optimizationTip: z.string()
});

// 扩展ChartGenerator以支持散点图特定选项
class ScatterChartGenerator extends ChartGenerator {
  async generateChart(
    title: string = '',
    xAxis: string[],
    yAxis: string[],
    chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'radar',
    options: {
      yAxisRange?: YAxisRange;
      colorScheme?: string;
      chartSize?: string;
      legendPosition?: string;
      chartSubType?: string;
      sizeAxis?: string[];
    } = {}
  ) {
    return super.generateChart(title, xAxis, yAxis, chartType, options);
  }
}

export async function tool({
  title,
  xAxis,
  yAxis,
  sizeAxis,
  chartSubType,
  autoOptimize,
  colorScheme,
  chartSize,
  legendPosition
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // 验证数据长度一致性
  if (xAxis.length !== yAxis.length) {
    throw new Error(`X轴数据长度(${xAxis.length})与Y轴数据长度(${yAxis.length})不匹配`);
  }

  // 验证数值有效性
  const xNumeric = xAxis.map(Number);
  const yNumeric = yAxis.map(Number);

  if (xNumeric.some((val) => isNaN(val))) {
    throw new Error('X轴数据必须为有效数字');
  }

  if (yNumeric.some((val) => isNaN(val))) {
    throw new Error('Y轴数据必须为有效数字');
  }

  // 如果有size轴数据，也要验证
  if (sizeAxis && sizeAxis.length !== xAxis.length) {
    throw new Error(`气泡大小数据长度(${sizeAxis.length})与坐标数据长度(${xAxis.length})不匹配`);
  }

  const generator = new ScatterChartGenerator();

  // 构建Y轴优化配置
  const yAxisRange: YAxisRange = {
    autoOptimize
  };

  try {
    const result = await generator.generateChart(title, xAxis, yAxis, 'scatter', {
      yAxisRange,
      colorScheme,
      chartSize,
      legendPosition,
      chartSubType,
      sizeAxis
    });

    // 生成优化建议文本
    let optimizationTip = '';
    if (result.detection?.detected) {
      optimizationTip = `🔍 ${result.detection.recommendation}`;
      if (autoOptimize) {
        optimizationTip += ' (已自动应用优化)';
      } else {
        optimizationTip += ' 建议开启"智能优化轴线"功能';
      }
    } else {
      optimizationTip =
        chartSubType === 'bubble'
          ? '✅ 气泡图显示正常，气泡大小反映第三维数据'
          : '✅ 散点图显示正常，数据分布清晰';
    }

    return {
      chartUrl: result.url,
      echartsConfig: result.config,
      optimizationTip
    };
  } catch (error) {
    throw new Error(`散点图生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
