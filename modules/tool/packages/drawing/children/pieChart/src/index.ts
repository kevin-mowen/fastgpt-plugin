import { z } from 'zod';
import { ChartGenerator, InputAdapter, applyStyleOptions } from '@tool/chart-core';
import type { ChartType, ChartGenerateOptions } from '@tool/chart-core';

export const InputType = z
  .object({
    title: z.string().optional().default(''),
    categories: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    values: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    chartSubType: z.string().optional().default('normal'),
    innerRadius: z.number().optional(),
    showPercentage: z.boolean().optional().default(true),
    showValue: z.boolean().optional().default(false),
    labelPosition: z.string().optional().default('outside'),
    colorScheme: z.string().optional().default('blue'),
    chartSize: z.string().optional().default('medium'),
    legendPosition: z.string().optional().default('right')
  })
  .transform((data) => {
    // 设置innerRadius默认值
    if (data.innerRadius === undefined) {
      data.innerRadius = data.chartSubType === 'donut' ? 0.4 : 0;
    }

    // 验证innerRadius范围
    if (data.innerRadius < 0 || data.innerRadius > 0.8) {
      data.innerRadius = data.chartSubType === 'donut' ? 0.4 : 0;
    }

    return {
      ...data,
      categories: InputAdapter.normalizeXAxis(data.categories),
      values: InputAdapter.normalizeYAxis(data.values)
    };
  });

export const OutputType = z.object({
  chartUrl: z.string(),
  echartsConfig: z.string(),
  statisticsInfo: z.string()
});

// 扩展ChartGenerator以支持饼图特定选项
class PieChartGenerator extends ChartGenerator {
  async generateChart(
    title: string = '',
    xAxis: string[],
    yAxis: string[],
    chartType: ChartType,
    options: ChartGenerateOptions = {}
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
      detection: null,
      statistics: this.calculateStatistics(xAxis, yAxis)
    };
  }

  // 重写createBaseOption以支持饼图特定配置
  protected createBaseOption(
    title: string,
    xAxis: string[],
    yAxis: string[],
    chartType: ChartType,
    options: ChartGenerateOptions
  ) {
    const baseOption: any = {
      backgroundColor: '#ffffff',
      title: {
        text: title,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const percentage = ((params.value / params.data.total) * 100).toFixed(1);
          let tooltip = `${params.name}: ${params.value}`;
          if (options.showPercentage !== false) {
            tooltip += ` (${percentage}%)`;
          }
          return tooltip;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: 10
      }
    };

    if (chartType === 'pie') {
      const categories = xAxis;
      const values = yAxis;
      const numericValues = values.map(Number);
      const total = numericValues.reduce((sum: number, val: number) => sum + val, 0);

      // 构建饼图数据
      const pieData = categories.map((name: string, index: number) => ({
        name,
        value: numericValues[index] || 0,
        total // 添加总数用于tooltip计算
      }));

      if (options.chartSubType === 'funnel') {
        // 漏斗图配置 - 优化标签显示空间
        const isOutsideLabel = options.labelPosition === 'outside';
        baseOption.series = [
          {
            type: 'funnel',
            left: isOutsideLabel ? '20%' : '10%', // 外标签时增加左边距
            width: isOutsideLabel ? '60%' : '80%', // 外标签时减少宽度为标签留空间
            height: '60%',
            top: '15%',
            data: pieData.sort((a, b) => b.value - a.value), // 漏斗图需要降序排列
            label: {
              show: options.labelPosition !== 'none',
              position: options.labelPosition === 'inside' ? 'inside' : 'right',
              distance: isOutsideLabel ? 20 : 5, // 外标签增加距离
              formatter: (params: any) => {
                let label = params.name;
                if (options.showValue) label += `: ${params.value}`;
                if (options.showPercentage !== false) {
                  const percentage = ((params.value / total) * 100).toFixed(1);
                  label += ` (${percentage}%)`;
                }
                return label;
              },
              fontSize: 12,
              fontWeight: 'normal'
            },
            labelLine: {
              show: options.labelPosition === 'outside',
              length: 15, // 减少连接线长度
              length2: 5, // 减少第二段长度
              smooth: false,
              lineStyle: {
                width: 1,
                color: '#999'
              }
            },
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 1
            }
          }
        ];
      } else {
        // 普通饼图和环形图配置
        const radius =
          options.innerRadius && options.innerRadius > 0
            ? [`${options.innerRadius * 100}%`, '70%']
            : '70%';

        baseOption.series = [
          {
            type: 'pie',
            radius,
            center: ['50%', '50%'],
            data: pieData,
            label: {
              show: options.labelPosition !== 'none',
              position: options.labelPosition === 'inside' ? 'inside' : 'outside',
              formatter: (params: any) => {
                let label = params.name;
                if (options.showValue) label += `: ${params.value}`;
                if (options.showPercentage !== false) {
                  const percentage = ((params.value / total) * 100).toFixed(1);
                  label += ` (${percentage}%)`;
                }
                return label;
              }
            },
            labelLine: {
              show: options.labelPosition === 'outside',
              length: 15,
              length2: 10,
              smooth: true
            },
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 2,
              borderRadius: options.chartSubType === 'donut' ? 4 : 0
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ];
      }

      // 处理图例显示
      if (options.legendPosition === 'none') {
        baseOption.legend.show = false;
      }
    }

    return baseOption;
  }

  // 计算统计信息
  private calculateStatistics(categories: string[], values: string[]): string {
    const numericValues = values.map(Number);
    const total = numericValues.reduce((sum, val) => sum + val, 0);
    const maxIndex = numericValues.indexOf(Math.max(...numericValues));
    const minIndex = numericValues.indexOf(Math.min(...numericValues));

    const statistics = [];
    statistics.push(`📊 数据统计分析:`);
    statistics.push(`• 总数量: ${total}`);
    statistics.push(`• 分类数: ${categories.length}个`);
    statistics.push(
      `• 最大占比: ${categories[maxIndex]} (${((numericValues[maxIndex] / total) * 100).toFixed(1)}%)`
    );
    statistics.push(
      `• 最小占比: ${categories[minIndex]} (${((numericValues[minIndex] / total) * 100).toFixed(1)}%)`
    );

    // 添加详细占比信息
    statistics.push(`\n🔍 详细占比:`);
    categories.forEach((name, index) => {
      const percentage = ((numericValues[index] / total) * 100).toFixed(1);
      statistics.push(`• ${name}: ${numericValues[index]} (${percentage}%)`);
    });

    return statistics.join('\n');
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

export async function tool({
  title,
  categories,
  values,
  chartSubType,
  innerRadius,
  showPercentage,
  showValue,
  labelPosition,
  colorScheme,
  chartSize,
  legendPosition
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // 验证数据长度一致性
  if (categories.length !== values.length) {
    throw new Error('分类名称和数值数据的长度必须一致');
  }

  // 验证数值有效性
  const numericValues = values.map(Number);
  if (numericValues.some((val) => isNaN(val) || val < 0)) {
    throw new Error('数值数据必须为非负数字');
  }

  const generator = new PieChartGenerator();

  try {
    const result = await generator.generateChart(title, categories, values, 'pie', {
      chartSubType,
      innerRadius,
      showPercentage,
      showValue,
      labelPosition,
      colorScheme,
      chartSize,
      legendPosition
    });

    return {
      chartUrl: result.url,
      echartsConfig: result.config,
      statisticsInfo: result.statistics
    };
  } catch (error) {
    throw new Error(`饼图生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
