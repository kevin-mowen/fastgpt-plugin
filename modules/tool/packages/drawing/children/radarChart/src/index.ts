import { z } from 'zod';
import { ChartGenerator, InputAdapter } from '@tool/chart-core';

export const InputType = z
  .object({
    title: z.string().optional().default(''),
    indicators: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    values: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    maxValues: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]).optional(),
    chartSubType: z.string().optional().default('basic'),
    colorScheme: z.string().optional().default('blue'),
    chartSize: z.string().optional().default('medium'),
    legendPosition: z.string().optional().default('bottom')
  })
  .transform((data) => {
    return {
      ...data,
      indicators: InputAdapter.normalizeXAxis(data.indicators),
      values: InputAdapter.normalizeYAxis(data.values),
      maxValues: data.maxValues
        ? InputAdapter.normalizeYAxis(data.maxValues).map(Number)
        : undefined
    };
  });

export const OutputType = z.object({
  chartUrl: z.string(),
  echartsConfig: z.string(),
  chartDescription: z.string()
});

// 扩展ChartGenerator以支持雷达图特定选项
class RadarChartGenerator extends ChartGenerator {
  async generateChart(
    title: string = '',
    xAxis: string[],
    yAxis: string[],
    chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'radar',
    options: {
      colorScheme?: string;
      chartSize?: string;
      legendPosition?: string;
      chartSubType?: string;
      indicators?: string[];
      maxValues?: number[];
    } = {}
  ) {
    return super.generateChart(title, xAxis, yAxis, chartType, options);
  }
}

export async function tool({
  title,
  indicators,
  values,
  maxValues,
  chartSubType,
  colorScheme,
  chartSize,
  legendPosition
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const generator = new RadarChartGenerator();

  try {
    const result = await generator.generateChart(
      title,
      indicators, // xAxis 用作指标名称
      values, // yAxis 用作数值数据
      'radar',
      {
        colorScheme,
        chartSize,
        legendPosition,
        chartSubType,
        indicators,
        maxValues
      }
    );

    // 生成图表说明文本
    const indicatorCount = indicators.length;
    const dataDescription =
      chartSubType === 'filled'
        ? `填充型雷达图展示了${indicatorCount}个维度的数据分布，填充区域大小代表整体能力范围`
        : `基础雷达图展示了${indicatorCount}个维度的数据对比，可清晰观察各维度的相对强弱`;

    return {
      chartUrl: result.url,
      echartsConfig: result.config,
      chartDescription: dataDescription
    };
  } catch (error) {
    throw new Error(`雷达图生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
