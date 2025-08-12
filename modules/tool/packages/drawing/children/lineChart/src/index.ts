import { z } from 'zod';
import { ChartGenerator, InputAdapter } from '@tool/chart-core';
import type { YAxisRange } from '@tool/chart-core';

export const InputType = z
  .object({
    title: z.string().optional().default(''),
    xAxis: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    yAxis: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    chartSubType: z.string().optional().default('basic'),
    autoOptimize: z.boolean().optional().default(true),
    yMin: z.number().optional(),
    yMax: z.number().optional(),
    showZeroLine: z.boolean().optional().default(true),
    colorScheme: z.string().optional().default('blue'),
    chartSize: z.string().optional().default('medium'),
    legendPosition: z.string().optional().default('bottom')
  })
  .transform((data) => {
    return {
      ...data,
      xAxis: InputAdapter.normalizeXAxis(data.xAxis),
      yAxis: InputAdapter.normalizeYAxis(data.yAxis)
    };
  });

export const OutputType = z.object({
  chartUrl: z.string(),
  echartsConfig: z.string(),
  optimizationTip: z.string()
});

export async function tool({
  title,
  xAxis,
  yAxis,
  chartSubType,
  autoOptimize,
  yMin,
  yMax,
  showZeroLine,
  colorScheme,
  chartSize,
  legendPosition
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const generator = new ChartGenerator();

  // 构建Y轴优化配置
  const yAxisRange: YAxisRange = {
    autoOptimize,
    min: yMin,
    max: yMax,
    showZeroLine
  };

  try {
    const result = await generator.generateChart(title, xAxis, yAxis, 'line', {
      yAxisRange,
      colorScheme,
      chartSize,
      legendPosition,
      chartSubType
    });

    // 生成优化建议文本
    let optimizationTip = '';
    if (result.detection?.detected) {
      optimizationTip = `🔍 ${result.detection.recommendation}`;
      if (autoOptimize) {
        optimizationTip += ' (已自动应用优化)';
      } else {
        optimizationTip += ' 建议开启"智能优化Y轴"功能';
      }
    } else {
      optimizationTip = '✅ 数据显示正常，无需额外优化';
    }

    return {
      chartUrl: result.url,
      echartsConfig: result.config,
      optimizationTip
    };
  } catch (error) {
    throw new Error(`折线图生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
