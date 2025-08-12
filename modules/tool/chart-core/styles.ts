/**
 * 颜色方案配置
 */
export const COLOR_SCHEMES = {
  blue: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
  green: ['#91cc75', '#5470c6', '#fac858', '#ee6666', '#73c0de'],
  warm: ['#ee6666', '#fac858', '#91cc75', '#5470c6', '#73c0de'],
  cool: ['#73c0de', '#5470c6', '#91cc75', '#fac858', '#ee6666'],
  purple: ['#9a60b4', '#ea7ccc', '#5470c6', '#91cc75', '#fac858']
};

/**
 * 图表尺寸配置
 */
export const CHART_SIZES = {
  small: { width: 400, height: 300 },
  medium: { width: 600, height: 450 },
  large: { width: 800, height: 600 }
};

/**
 * 图表样式选项接口
 */
export interface StyleOptions {
  colorScheme?: string;
  chartSize?: string;
  legendPosition?: string;
}

/**
 * 应用样式选项到图表配置
 * @param option ECharts配置对象
 * @param options 样式选项
 */
export function applyStyleOptions(option: any, options: StyleOptions): void {
  // 应用颜色方案
  if (options.colorScheme && COLOR_SCHEMES[options.colorScheme as keyof typeof COLOR_SCHEMES]) {
    option.color = COLOR_SCHEMES[options.colorScheme as keyof typeof COLOR_SCHEMES];
  }

  // 应用图例位置
  if (options.legendPosition && option.legend) {
    switch (options.legendPosition) {
      case 'top':
        option.legend = { ...option.legend, orient: 'horizontal', top: 10, left: 'center' };
        break;
      case 'bottom':
        option.legend = { ...option.legend, orient: 'horizontal', bottom: 10, left: 'center' };
        break;
      case 'left':
        option.legend = { ...option.legend, orient: 'vertical', left: 10, top: 'middle' };
        break;
      case 'right':
        option.legend = { ...option.legend, orient: 'vertical', right: 10, top: 'middle' };
        break;
    }
  }
}

/**
 * 获取图表尺寸
 * @param size 尺寸配置键名
 * @returns 图表尺寸对象，包含width和height
 */
export function getChartSize(size?: string): { width: number; height: number } {
  return size && CHART_SIZES[size as keyof typeof CHART_SIZES]
    ? CHART_SIZES[size as keyof typeof CHART_SIZES]
    : CHART_SIZES.medium;
}
