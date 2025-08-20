/**
 * 配置管理模块 - 提供统一的配置管理和环境检测
 */

/**
 * 环境类型
 */
export type Environment = 'development' | 'test' | 'production';

/**
 * 测试模式类型
 */
export type TestMode = 'disabled' | 'local' | 'memory' | 'mock';

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * 转换配置接口
 */
export interface ConversionConfig {
  // 环境设置
  environment: Environment;

  // 测试模式配置
  testMode: {
    enabled: boolean;
    type: TestMode;
    outputDir?: string;
    keepFiles: boolean;
    maxFiles: number;
  };

  // 性能配置
  performance: {
    enableCache: boolean;
    maxCacheSize: number;
    cacheTimeout: number; // milliseconds
    enableMetrics: boolean;
  };

  // 安全配置
  security: {
    enableContentFiltering: boolean;
    enableUrlValidation: boolean;
    enableSizeCheck: boolean;
    maxContentSize: number; // bytes
    customTrustedDomains: string[];
    customBlockedDomains: string[];
  };

  // 国际化配置
  i18n: {
    defaultLanguage: string;
    autoDetect: boolean;
    supportedLanguages: string[];
  };

  // 日志配置
  logging: {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    logDir?: string;
  };

  // 输出配置
  output: {
    format: 'oa.docx' | 'docx' | 'xlsx';
    quality: 'low' | 'medium' | 'high';
    compression: boolean;
  };
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ConversionConfig = {
  environment: (process.env.NODE_ENV as Environment) || 'production',

  testMode: {
    enabled: process.env.OA_TEST_MODE === 'true',
    type: (process.env.OA_TEST_TYPE as TestMode) || 'local',
    outputDir: process.env.OA_TEST_OUTPUT_DIR || './test',
    keepFiles: process.env.OA_TEST_KEEP_FILES === 'true',
    maxFiles: parseInt(process.env.OA_TEST_MAX_FILES || '10')
  },

  performance: {
    enableCache: process.env.OA_ENABLE_CACHE !== 'false',
    maxCacheSize: parseInt(process.env.OA_MAX_CACHE_SIZE || '100'),
    cacheTimeout: parseInt(process.env.OA_CACHE_TIMEOUT || '300000'), // 5 minutes
    enableMetrics: process.env.OA_ENABLE_METRICS === 'true'
  },

  security: {
    enableContentFiltering: process.env.OA_ENABLE_CONTENT_FILTERING !== 'false',
    enableUrlValidation: process.env.OA_ENABLE_URL_VALIDATION !== 'false',
    enableSizeCheck: process.env.OA_ENABLE_SIZE_CHECK !== 'false',
    maxContentSize: parseInt(process.env.OA_MAX_CONTENT_SIZE || String(10 * 1024 * 1024)), // 10MB
    customTrustedDomains: process.env.OA_TRUSTED_DOMAINS?.split(',') || [],
    customBlockedDomains: process.env.OA_BLOCKED_DOMAINS?.split(',') || []
  },

  i18n: {
    defaultLanguage: process.env.OA_DEFAULT_LANGUAGE || 'zh-CN',
    autoDetect: process.env.OA_I18N_AUTO_DETECT !== 'false',
    supportedLanguages: process.env.OA_SUPPORTED_LANGUAGES?.split(',') || [
      'zh-CN',
      'en',
      'zh-TW',
      'ja',
      'ko'
    ]
  },

  logging: {
    level: (process.env.OA_LOG_LEVEL as LogLevel) || 'info',
    enableConsole: process.env.OA_LOG_CONSOLE !== 'false',
    enableFile: process.env.OA_LOG_FILE === 'true',
    logDir: process.env.OA_LOG_DIR || './logs'
  },

  output: {
    format: 'oa.docx',
    quality: (process.env.OA_OUTPUT_QUALITY as any) || 'medium',
    compression: process.env.OA_OUTPUT_COMPRESSION !== 'false'
  }
};

/**
 * 配置管理器
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: ConversionConfig;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadFromEnvironment();
  }

  /**
   * 获取配置管理器实例（单例）
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 从环境变量加载配置
   */
  private loadFromEnvironment(): void {
    // 已在DEFAULT_CONFIG中处理
  }

  /**
   * 获取完整配置
   */
  getConfig(): ConversionConfig {
    return { ...this.config };
  }

  /**
   * 获取特定配置项
   */
  get<K extends keyof ConversionConfig>(key: K): ConversionConfig[K] {
    return this.config[key];
  }

  /**
   * 设置配置项
   */
  set<K extends keyof ConversionConfig>(key: K, value: ConversionConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * 更新配置（深度合并）
   */
  updateConfig(partialConfig: Partial<ConversionConfig>): void {
    this.config = this.deepMerge(this.config, partialConfig);
  }

  /**
   * 重置为默认配置
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * 验证配置有效性
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证测试模式配置
    if (this.config.testMode.enabled && this.config.testMode.maxFiles <= 0) {
      errors.push('testMode.maxFiles must be greater than 0');
    }

    // 验证性能配置
    if (this.config.performance.maxCacheSize <= 0) {
      errors.push('performance.maxCacheSize must be greater than 0');
    }

    if (this.config.performance.cacheTimeout <= 0) {
      errors.push('performance.cacheTimeout must be greater than 0');
    }

    // 验证安全配置
    if (this.config.security.maxContentSize <= 0) {
      errors.push('security.maxContentSize must be greater than 0');
    }

    // 验证国际化配置
    if (!this.config.i18n.supportedLanguages.includes(this.config.i18n.defaultLanguage)) {
      errors.push('i18n.defaultLanguage must be in supportedLanguages');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取测试模式配置
   */
  getTestConfig(): ConversionConfig['testMode'] & {
    shouldSaveLocally: boolean;
    outputPath: string;
  } {
    const testConfig = this.config.testMode;
    return {
      ...testConfig,
      shouldSaveLocally:
        testConfig.enabled && (testConfig.type === 'local' || testConfig.type === 'memory'),
      outputPath: testConfig.outputDir || './test'
    };
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  /**
   * 检查是否为测试环境
   */
  isTest(): boolean {
    return this.config.environment === 'test';
  }

  /**
   * 检查是否为生产环境
   */
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * 获取缓存配置
   */
  getCacheConfig(): { enabled: boolean; maxSize: number; timeout: number } {
    return {
      enabled: this.config.performance.enableCache,
      maxSize: this.config.performance.maxCacheSize,
      timeout: this.config.performance.cacheTimeout
    };
  }

  /**
   * 获取安全配置
   */
  getSecurityConfig(): ConversionConfig['security'] {
    return { ...this.config.security };
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * 导出配置为JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 从JSON导入配置
   */
  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.updateConfig(importedConfig);
    } catch (error) {
      throw new Error(
        `Failed to import config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * 便捷函数：获取配置管理器实例
 */
export function getConfig(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * 便捷函数：获取特定配置项
 */
export function getConfigValue<K extends keyof ConversionConfig>(key: K): ConversionConfig[K] {
  return ConfigManager.getInstance().get(key);
}

/**
 * 环境变量配置文档
 *
 * 测试模式:
 * - OA_TEST_MODE=true/false - 启用测试模式
 * - OA_TEST_TYPE=local/memory/mock - 测试类型
 * - OA_TEST_OUTPUT_DIR=./test - 测试输出目录
 * - OA_TEST_KEEP_FILES=true/false - 保留测试文件
 * - OA_TEST_MAX_FILES=10 - 最大测试文件数
 *
 * 性能:
 * - OA_ENABLE_CACHE=true/false - 启用缓存
 * - OA_MAX_CACHE_SIZE=100 - 最大缓存大小
 * - OA_CACHE_TIMEOUT=300000 - 缓存超时(ms)
 * - OA_ENABLE_METRICS=true/false - 启用性能指标
 *
 * 安全:
 * - OA_ENABLE_CONTENT_FILTERING=true/false - 启用内容过滤
 * - OA_ENABLE_URL_VALIDATION=true/false - 启用URL验证
 * - OA_ENABLE_SIZE_CHECK=true/false - 启用大小检查
 * - OA_MAX_CONTENT_SIZE=10485760 - 最大内容大小(bytes)
 * - OA_TRUSTED_DOMAINS=domain1.com,domain2.com - 受信任域名
 * - OA_BLOCKED_DOMAINS=bad1.com,bad2.com - 阻止域名
 *
 * 国际化:
 * - OA_DEFAULT_LANGUAGE=zh-CN - 默认语言
 * - OA_I18N_AUTO_DETECT=true/false - 自动检测语言
 * - OA_SUPPORTED_LANGUAGES=zh-CN,en,zh-TW,ja,ko - 支持的语言
 *
 * 日志:
 * - OA_LOG_LEVEL=debug/info/warn/error/silent - 日志级别
 * - OA_LOG_CONSOLE=true/false - 控制台日志
 * - OA_LOG_FILE=true/false - 文件日志
 * - OA_LOG_DIR=./logs - 日志目录
 *
 * 输出:
 * - OA_OUTPUT_QUALITY=low/medium/high - 输出质量
 * - OA_OUTPUT_COMPRESSION=true/false - 启用压缩
 */
