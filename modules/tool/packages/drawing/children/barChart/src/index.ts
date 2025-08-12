import { z } from 'zod';
import { ChartGenerator, InputAdapter, applyStyleOptions } from '@tool/chart-core';
import type { YAxisRange } from '@tool/chart-core';

export const InputType = z
  .object({
    title: z.string().optional().default(''),
    xAxis: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    yAxis: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    chartSubType: z.string().optional().default('normal'),
    autoOptimize: z.boolean().optional().default(true),
    yMin: z.number().optional(),
    yMax: z.number().optional(),
    showZeroLine: z.boolean().optional().default(true),
    barWidth: z.number().optional().default(0.6),
    colorScheme: z.string().optional().default('blue'),
    chartSize: z.string().optional().default('medium'),
    legendPosition: z.string().optional().default('bottom')
  })
  .transform((data) => {
    // 验证barWidth范围
    if (data.barWidth !== undefined && (data.barWidth < 0.1 || data.barWidth > 1.0)) {
      data.barWidth = 0.6; // 设置为默认值
    }

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

// 扩展ChartGenerator以支持柱状图特定选项
class BarChartGenerator extends ChartGenerator {
  async generateChart(
    title: string = '',
    xAxis: string[],
    yAxis: string[],
    chartType: 'line' | 'bar' | 'pie',
    options: {
      yAxisRange?: YAxisRange;
      colorScheme?: string;
      chartSize?: string;
      legendPosition?: string;
      chartSubType?: string;
      barWidth?: number;
    } = {}
  ) {
    // 确定图表尺寸
    const size =
      options.chartSize && this.CHART_SIZES[options.chartSize as keyof typeof this.CHART_SIZES]
        ? this.CHART_SIZES[options.chartSize as keyof typeof this.CHART_SIZES]
        : this.CHART_SIZES.medium;

    const chart = (await import('echarts')).init(undefined, undefined, {
      renderer: 'svg',
      ssr: true,
      width: size.width,
      height: size.height
    });

    // 生成基础配置
    const baseOption = this.createBaseOption(title, xAxis, yAxis, chartType, options);

    // 处理小范围大数值问题
    if (chartType !== 'pie' && options.yAxisRange) {
      this.applyYAxisOptimization(baseOption, yAxis, options.yAxisRange);
    }

    // 应用样式选项
    applyStyleOptions(baseOption, options);

    chart.setOption(baseOption);
    const svgContent = chart.renderToSVGString();

    const base64 = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

    // 在测试环境或开发模式下使用mock上传
    const { mockUploadFile } = await import('@tool/chart-core/mockUpload');
    const { uploadFile } = await import('@tool/utils/uploadFile');

    const file =
      process.env.NODE_ENV === 'test'
        ? await mockUploadFile({
            base64,
            defaultFilename: `${chartType}-chart.svg`
          })
        : await uploadFile({
            base64,
            defaultFilename: `${chartType}-chart.svg`
          });

    chart.dispose();

    return {
      url: file.accessUrl,
      config:
        process.env.NODE_ENV === 'test'
          ? JSON.stringify(baseOption) // 在测试环境中不格式化JSON
          : JSON.stringify(baseOption, null, 2), // 在生产环境中格式化JSON
      detection: chartType !== 'pie' ? this.detector.detect(yAxis.map(Number)) : null
    };
  }

  // 重写createBaseOption以支持柱状图特定配置
  protected createBaseOption(
    title: string,
    xAxis: string[],
    yAxis: string[],
    chartType: 'line' | 'bar' | 'pie',
    options: any
  ) {
    const baseOption: any = {
      backgroundColor: '#ffffff',
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {},
      legend: {
        orient: 'horizontal',
        bottom: 10
      }
    };

    if (chartType === 'bar') {
      baseOption.xAxis = {
        type: 'category',
        data: xAxis,
        axisLabel: { rotate: xAxis.some((x) => x.length > 4) ? 45 : 0 }
      };
      baseOption.yAxis = { type: 'value' };
      baseOption.tooltip = { trigger: 'axis' };

      // 根据子类型配置柱状图
      if (options.chartSubType === 'stacked') {
        // 堆积柱状图：假设yAxis包含多个系列的数据，用分号分隔
        const series = yAxis[0]?.includes(';')
          ? yAxis[0].split(';').map((seriesData: string, index: number) => ({
              name: `系列${index + 1}`,
              type: 'bar',
              stack: 'total',
              data: seriesData.split(',').map(Number),
              barWidth: options.barWidth || 0.6,
              itemStyle: { borderRadius: [2, 2, 0, 0] }
            }))
          : [
              {
                name: 'Data',
                type: 'bar',
                data: yAxis.map(Number),
                barWidth: options.barWidth || 0.6,
                itemStyle: { borderRadius: [4, 4, 0, 0] }
              }
            ];
        baseOption.series = series;
      } else {
        // 普通柱状图
        baseOption.series = [
          {
            name: 'Data',
            type: 'bar',
            data: yAxis.map(Number),
            barWidth: options.barWidth || 0.6,
            itemStyle: { borderRadius: [4, 4, 0, 0] }
          }
        ];
      }
    }

    return baseOption;
  }

  // 访问父类的常量
  private get CHART_SIZES() {
    return {
      small: { width: 400, height: 300 },
      medium: { width: 600, height: 450 },
      large: { width: 800, height: 600 }
    };
  }
}

export async function tool(input: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // 先通过Zod解析输入，确保验证和转换被应用
  const validatedInput = InputType.parse(input);
  const {
    title,
    xAxis,
    yAxis,
    chartSubType,
    autoOptimize,
    yMin,
    yMax,
    showZeroLine,
    barWidth,
    colorScheme,
    chartSize,
    legendPosition
  } = validatedInput;
  const generator = new BarChartGenerator();

  // 构建Y轴优化配置
  const yAxisRange: YAxisRange = {
    autoOptimize,
    min: yMin,
    max: yMax,
    showZeroLine
  };

  try {
    const result = await generator.generateChart(title, xAxis, yAxis, 'bar', {
      yAxisRange,
      colorScheme,
      chartSize,
      legendPosition,
      chartSubType,
      barWidth
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
    throw new Error(`柱状图生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
