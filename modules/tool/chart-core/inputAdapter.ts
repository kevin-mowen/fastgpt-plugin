/**
 * 输入格式适配器
 * 负责标准化和验证各种输入格式
 */
export class InputAdapter {
  /**
   * 标准化X轴数据
   * @param xAxis 输入的X轴数据，可以是数组、字符串等格式
   * @returns 标准化后的字符串数组
   * @throws {Error} 当输入数据无效时抛出错误
   */
  static normalizeXAxis(xAxis: any): string[] {
    if (xAxis === null || xAxis === undefined) {
      throw new Error('X轴数据不能为空');
    }

    if (Array.isArray(xAxis)) {
      if (xAxis.length === 0) {
        throw new Error('X轴数据不能为空数组');
      }
      return xAxis.map((item) => String(item));
    }

    if (typeof xAxis === 'string') {
      const trimmed = xAxis.trim();
      if (!trimmed) {
        throw new Error('X轴数据不能为空字符串');
      }

      // 尝试解析JSON
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            throw new Error('解析后的X轴数据不能为空数组');
          }
          return parsed.map((item) => String(item));
        }
        return [String(parsed)];
      } catch (parseError) {
        // JSON解析失败，按逗号分割
        const splitResult = trimmed
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item);
        if (splitResult.length === 0) {
          throw new Error('X轴数据格式无效');
        }
        return splitResult;
      }
    }

    return [String(xAxis)];
  }

  /**
   * 标准化Y轴数据
   * @param yAxis 输入的Y轴数据，可以是数组、字符串等格式
   * @returns 标准化后的字符串数组
   * @throws {Error} 当输入数据无效时抛出错误
   */
  static normalizeYAxis(yAxis: any): string[] {
    if (yAxis === null || yAxis === undefined) {
      throw new Error('Y轴数据不能为空');
    }

    if (Array.isArray(yAxis)) {
      if (yAxis.length === 0) {
        throw new Error('Y轴数据不能为空数组');
      }
      return yAxis.map((item) => String(item));
    }

    if (typeof yAxis === 'string') {
      const trimmed = yAxis.trim();
      if (!trimmed) {
        throw new Error('Y轴数据不能为空字符串');
      }

      // 尝试解析JSON
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            throw new Error('解析后的Y轴数据不能为空数组');
          }
          return parsed.map((item) => String(item));
        }
        return [String(parsed)];
      } catch (parseError) {
        // JSON解析失败，按逗号分割
        const splitResult = trimmed
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item);
        if (splitResult.length === 0) {
          throw new Error('Y轴数据格式无效');
        }
        return splitResult;
      }
    }

    return [String(yAxis)];
  }

  /**
   * 验证数据的数值有效性
   * @param data 字符串数组形式的数值数据
   * @returns 有效数值的数量
   */
  static validateNumericData(data: string[]): number {
    const numericCount = data.filter((item) => {
      const num = Number(item);
      return !isNaN(num) && isFinite(num);
    }).length;

    if (numericCount === 0) {
      throw new Error('数据中没有有效的数值');
    }

    return numericCount;
  }

  /**
   * 验证X轴和Y轴数据长度匹配
   * @param xData X轴数据
   * @param yData Y轴数据
   * @throws {Error} 当数据长度不匹配时抛出错误
   */
  static validateDataLength(xData: string[], yData: string[]): void {
    if (xData.length !== yData.length) {
      throw new Error(`X轴数据长度(${xData.length})与Y轴数据长度(${yData.length})不匹配`);
    }
  }
}
