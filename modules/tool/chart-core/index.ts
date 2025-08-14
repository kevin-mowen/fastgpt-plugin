// ECharts will be dynamically imported
import { uploadFile } from '@tool/utils/uploadFile';
import { mockUploadFile } from './mockUpload';
import { SmallRangeDetector } from './detector';
import type { YAxisRange } from './detector';
import { applyStyleOptions, getChartSize } from './styles';

// 重新导出相关类型和类
export { SmallRangeDetector } from './detector';
export type { YAxisRange, SmallRangeDetection } from './detector';
export { COLOR_SCHEMES, CHART_SIZES, applyStyleOptions } from './styles';
export type { StyleOptions } from './styles';
export { InputAdapter } from './inputAdapter';

/**
 * 图表生成配置接口
 */
export interface ChartGenerateOptions {
  yAxisRange?: YAxisRange;
  colorScheme?: string;
  chartSize?: string;
  legendPosition?: string;
  chartSubType?: string;
  sizeAxis?: string[]; // 散点图气泡大小数据
  indicators?: string[]; // 雷达图指标名称
  maxValues?: number[]; // 雷达图最大值
  // 饼图特有选项
  innerRadius?: number;
  showPercentage?: boolean;
  showValue?: boolean;
  labelPosition?: string;
}

/**
 * 图表类型定义
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'radar';

/**
 * 通用图表生成器
 * 提供统一的图表生成接口，支持多种图表类型
 */
export class ChartGenerator {
  protected detector = new SmallRangeDetector();

  /**
   * 生成图表
   * @param title 图表标题
   * @param xAxis X轴数据
   * @param yAxis Y轴数据
   * @param chartType 图表类型
   * @param options 图表配置选项
   * @returns Promise<{url: string, config: string, detection: SmallRangeDetection | null}>
   */
  async generateChart(
    title: string = '',
    xAxis: string[],
    yAxis: string[],
    chartType: ChartType,
    options: ChartGenerateOptions = {}
  ) {
    // 确定图表尺寸
    const size = getChartSize(options.chartSize);

    const echarts = await import('echarts');
    const chart = echarts.init(undefined, undefined, {
      renderer: 'svg',
      ssr: true,
      width: size.width,
      height: size.height
    });

    // 生成基础配置
    const baseOption = this.createBaseOption(title, xAxis, yAxis, chartType, options);

    // 处理小范围大数值问题 (饼图和雷达图不适用Y轴优化)
    if (!['pie', 'radar'].includes(chartType) && options.yAxisRange) {
      this.applyYAxisOptimization(baseOption, yAxis, options.yAxisRange);
    }

    // 应用样式选项
    applyStyleOptions(baseOption, options);

    chart.setOption(baseOption);
    const svgContent = chart.renderToSVGString();

    const base64 = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

    // 在测试环境下使用mock上传，生产环境使用真实上传
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
      detection: !['pie', 'radar'].includes(chartType)
        ? this.detector.detect(yAxis.map(Number))
        : null
    };
  }

  /**
   * 创建基础图表配置
   * @param title 图表标题
   * @param xAxis X轴数据
   * @param yAxis Y轴数据
   * @param chartType 图表类型
   * @param options 配置选项
   * @returns ECharts配置对象
   */
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

    switch (chartType) {
      case 'line':
        baseOption.xAxis = {
          type: 'category',
          data: xAxis,
          axisLabel: { rotate: xAxis.some((x) => x.length > 4) ? 45 : 0 }
        };
        baseOption.yAxis = { type: 'value' };
        baseOption.tooltip = { trigger: 'axis' };
        baseOption.series = [
          {
            name: 'Data',
            type: 'line',
            data: yAxis.map(Number),
            smooth: options.chartSubType === 'smooth',
            step: options.chartSubType === 'stepped' ? 'start' : false,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 3 },
            areaStyle: options.chartSubType === 'area' ? { opacity: 0.3 } : undefined
          }
        ];
        break;

      case 'bar':
        baseOption.xAxis = {
          type: 'category',
          data: xAxis
        };
        baseOption.yAxis = { type: 'value' };
        baseOption.tooltip = { trigger: 'axis' };
        baseOption.series = [
          {
            name: 'Data',
            type: 'bar',
            data: yAxis.map(Number),
            itemStyle: { borderRadius: [4, 4, 0, 0] }
          }
        ];
        break;

      case 'pie':
        baseOption.series = [
          {
            name: 'Data',
            type: 'pie',
            radius: options.chartSubType === 'donut' ? ['40%', '70%'] : '70%',
            center: ['50%', '50%'],
            data: yAxis.map((value, index) => ({
              value: Number(value),
              name: xAxis[index] || `Category ${index + 1}`
            })),
            label: { show: true },
            labelLine: { show: options.chartSubType !== 'donut' },
            itemStyle: { borderColor: '#fff', borderWidth: 1 }
          }
        ];
        break;

      case 'scatter': {
        // 计算数据范围
        const xNumeric = xAxis.map(Number);
        const yNumeric = yAxis.map(Number);
        const xMin = Math.min(...xNumeric);
        const xMax = Math.max(...xNumeric);
        const yMin = Math.min(...yNumeric);
        const yMax = Math.max(...yNumeric);

        baseOption.xAxis = {
          type: 'value',
          axisLabel: { rotate: 0 },
          name: 'X轴',
          nameLocation: 'middle',
          nameGap: 30,
          // 只有当最小值不是0时才显式设置，避免ECharts自动从0开始
          ...(xMin !== 0 && { min: xMin }),
          max: xMax
        };
        baseOption.yAxis = {
          type: 'value',
          name: 'Y轴',
          nameLocation: 'middle',
          nameGap: 40,
          // 只有当最小值不是0时才显式设置，避免ECharts自动从0开始
          ...(yMin !== 0 && { min: yMin }),
          max: yMax
        };
        baseOption.tooltip = {
          trigger: 'item',
          formatter: function (params: any) {
            if (options.sizeAxis && options.sizeAxis.length > params.dataIndex) {
              return `${params.seriesName}<br/>点${params.dataIndex + 1}: (${params.data[0]}, ${params.data[1]}, ${options.sizeAxis[params.dataIndex]})`;
            }
            return `${params.seriesName}<br/>点${params.dataIndex + 1}: (${params.data[0]}, ${params.data[1]})`;
          }
        };

        if (options.chartSubType === 'bubble' && options.sizeAxis) {
          // 气泡图：使用sizeAxis作为气泡大小
          baseOption.series = [
            {
              name: 'Data',
              type: 'scatter',
              data: yAxis.map((y, index) => [
                Number(xAxis[index] ?? 0),
                Number(y),
                Number(options.sizeAxis?.[index] ?? 10)
              ]),
              symbolSize: (data: number[]) => Math.sqrt(data[2] || 10) * 3,
              animation: false // 禁用动画，确保气泡立即可见
            }
          ];
        } else {
          // 基础散点图
          baseOption.series = [
            {
              name: 'Data',
              type: 'scatter',
              data: yAxis.map((y, index) => [Number(xAxis[index] ?? 0), Number(y)]),
              symbolSize: 20,
              symbol: 'circle',
              itemStyle: {
                opacity: 1,
                borderWidth: 2,
                borderColor: '#333'
              },
              animation: false // 禁用动画，确保散点立即可见
            }
          ];
        }
        break;
      }

      case 'radar':
        // 雷达图配置
        baseOption.radar = {
          indicator: (options.indicators || xAxis).map((name: string, index: number) => ({
            name,
            max: options.maxValues?.[index] || Math.max(...yAxis.map(Number)) * 1.2
          }))
        };
        baseOption.series = [
          {
            name: 'Data',
            type: 'radar',
            data: [
              {
                value: yAxis.map(Number),
                name: 'Series 1'
              }
            ],
            areaStyle: options.chartSubType === 'filled' ? { opacity: 0.3 } : undefined
          }
        ];
        // 雷达图不需要xAxis和yAxis
        delete baseOption.tooltip;
        break;
    }

    return baseOption;
  }

  /**
   * 应用Y轴优化配置
   * @param option ECharts配置对象
   * @param yData Y轴数据
   * @param yAxisRange Y轴范围配置
   */
  protected applyYAxisOptimization(option: any, yData: string[], yAxisRange: YAxisRange) {
    if (!option.yAxis) return;

    const numericData = yData.map(Number).filter((val) => !isNaN(val));

    if (yAxisRange.autoOptimize) {
      const detection = this.detector.detect(numericData);
      if (detection.detected && detection.autoFix) {
        Object.assign(option.yAxis, detection.autoFix);
      }
    }

    if (yAxisRange.min !== undefined) {
      option.yAxis.min = yAxisRange.min;
    }

    if (yAxisRange.max !== undefined) {
      option.yAxis.max = yAxisRange.max;
    }

    if (yAxisRange.showZeroLine === false) {
      option.yAxis.scale = true;
    }
  }
}
