/**
 * 小范围大数值检测结果类型
 */
export interface SmallRangeDetection {
  detected: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  recommendation: string;
  autoFix?: any;
}

/**
 * Y轴范围配置类型
 */
export interface YAxisRange {
  autoOptimize?: boolean;
  sensitivity?: 'low' | 'medium' | 'high';
  min?: number;
  max?: number;
  mode?: 'fixed' | 'adaptive';
  showZeroLine?: boolean;
}

/**
 * 智能检测小范围大数值问题的检测器
 * 用于识别数据变化很小但数值很大的情况，并提供优化建议
 */
export class SmallRangeDetector {
  private thresholds = {
    high: 0.001,
    medium: 0.03,
    low: 0.1
  };

  /**
   * 检测数据中的小范围大数值问题
   * @param yData 数值数组
   * @returns 检测结果，包含严重程度和建议
   */
  detect(yData: number[]): SmallRangeDetection {
    if (!yData || yData.length === 0) {
      return { detected: false, severity: 'none', recommendation: '' };
    }

    const numericData = yData.filter((val) => !isNaN(val) && isFinite(val));
    if (numericData.length === 0) {
      return { detected: false, severity: 'none', recommendation: '' };
    }

    const stats = this.calculateStats(numericData);
    const flatness = stats.range / Math.abs(stats.mean);

    if (flatness < this.thresholds.high) {
      return {
        detected: true,
        severity: 'high',
        recommendation: '检测到数据变化极小，建议使用相对变化模式查看趋势',
        autoFix: {
          mode: 'custom',
          min: stats.p5,
          max: stats.p95,
          zeroBaseline: false,
          nice: true
        }
      };
    }

    if (flatness < this.thresholds.medium) {
      return {
        detected: true,
        severity: 'medium',
        recommendation: '数据波动较小，建议设置自定义Y轴范围或关闭零基线',
        autoFix: {
          mode: 'custom',
          min: stats.p10,
          max: stats.p90,
          zeroBaseline: false,
          nice: true
        }
      };
    }

    if (flatness < this.thresholds.low) {
      return {
        detected: true,
        severity: 'low',
        recommendation: '可考虑关闭零基线以更好显示数据趋势',
        autoFix: {
          zeroBaseline: false,
          nice: true
        }
      };
    }

    return { detected: false, severity: 'none', recommendation: '' };
  }

  /**
   * 计算数据的统计信息
   * @param data 数值数组
   * @returns 包含最小值、最大值、平均值、范围和百分位数的统计对象
   */
  private calculateStats(data: number[]) {
    const sorted = [...data].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const range = max - min;

    // 计算百分位数
    const p5 = this.percentile(sorted, 0.05);
    const p10 = this.percentile(sorted, 0.1);
    const p90 = this.percentile(sorted, 0.9);
    const p95 = this.percentile(sorted, 0.95);

    return { min, max, mean, range, p5, p10, p90, p95 };
  }

  /**
   * 计算百分位数
   * @param sortedArray 已排序的数组
   * @param p 百分位数 (0-1)
   * @returns 对应的百分位数值
   */
  private percentile(sortedArray: number[], p: number): number {
    const index = (sortedArray.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
}
