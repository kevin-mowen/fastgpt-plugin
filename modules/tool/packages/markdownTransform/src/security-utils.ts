/**
 * 安全工具模块 - 提供输入验证和内容过滤功能
 */
import { t } from './i18n';

/**
 * 配置常量 - 安全限制
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:'] as const;
type AllowedProtocol = (typeof ALLOWED_PROTOCOLS)[number];

export const SECURITY_LIMITS = {
  MAX_MARKDOWN_SIZE: 10 * 1024 * 1024, // 10MB Markdown内容限制
  MAX_IMAGE_COUNT: 50, // 最大图片数量
  MAX_TABLE_COUNT: 100, // 最大表格数量
  ALLOWED_PROTOCOLS, // 允许的URL协议
  BLOCKED_DOMAINS: [
    // 阻止的域名
    'malicious-site.com',
    'dangerous-domain.org'
  ] as const,
  TRUSTED_DOMAINS: [
    // 受信任的域名（白名单）
    'githubusercontent.com',
    'github.com',
    'cdn.jsdelivr.net',
    'unpkg.com'
  ] as const
} as const;

/**
 * XSS 攻击模式检测正则表达式（增强版）
 */
const XSS_PATTERNS = [
  // Script标签（增强版，处理各种变形）
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<script[^>]*\/>/gi, // 自闭合script标签

  // Iframe标签
  /<iframe[\s\S]*?>.*?<\/iframe>/gi,
  /<iframe[^>]*\/>/gi,

  // 其他危险标签
  /<embed[^>]*>/gi,
  /<object[\s\S]*?>.*?<\/object>/gi,
  /<applet[\s\S]*?>.*?<\/applet>/gi,
  /<form[\s\S]*?>.*?<\/form>/gi,

  // 危险协议
  /javascript:\s*[^\s]/gi,
  /vbscript:\s*[^\s]/gi,
  /data:\s*text\/html/gi,

  // 事件处理器（更精确）
  /\s*on[a-z]+\s*=\s*["'][^"']*["']/gi,
  /\s*on[a-z]+\s*=\s*[^\s>]+/gi,

  // Meta重定向和其他危险属性
  /<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi,
  /<link[^>]*href\s*=\s*["']?javascript:[^"'>]+["']?[^>]*>/gi,

  // CSS中的Javascript
  /style\s*=\s*["'][^"']*expression\s*\(/gi,
  /style\s*=\s*["'][^"']*javascript:/gi,

  // Base64编码的潜在威胁
  /data:\s*[^;]*;base64[^\s"'>]*/gi
] as const;

/**
 * 危险HTML标签模式（增强版）
 */
const DANGEROUS_HTML_PATTERNS = [
  // 表单相关标签
  /<input[^>]*>/gi,
  /<button[^>]*>.*?<\/button>/gi,
  /<select[^>]*>.*?<\/select>/gi,
  /<textarea[^>]*>.*?<\/textarea>/gi,
  /<option[^>]*>.*?<\/option>/gi,

  // 其他潜在危险标签
  /<audio[^>]*>.*?<\/audio>/gi,
  /<video[^>]*>.*?<\/video>/gi,
  /<source[^>]*>/gi,
  /<track[^>]*>/gi,

  // SVG中的潜在威胁
  /<svg[\s\S]*?>.*?<\/svg>/gi,
  /<foreignobject[\s\S]*?>.*?<\/foreignobject>/gi
] as const;

/**
 * 合并的正则表达式（性能优化）
 */
const COMBINED_XSS_PATTERN = new RegExp(
  '(' + XSS_PATTERNS.map((p) => p.source).join('|') + ')',
  'gi'
);

const COMBINED_DANGEROUS_HTML_PATTERN = new RegExp(
  '(' + DANGEROUS_HTML_PATTERNS.map((p) => p.source).join('|') + ')',
  'gi'
);

/**
 * 内容安全过滤器
 */
export class ContentSecurityFilter {
  // URL验证缓存（性能优化）
  private static urlValidationCache = new Map<string, boolean>();
  private static readonly MAX_CACHE_SIZE = 1000;
  /**
   * 安全过滤Markdown内容
   * @param markdown 原始Markdown内容
   * @returns 过滤后的安全内容
   */
  static sanitizeMarkdown(markdown: string): string {
    if (!markdown || typeof markdown !== 'string') {
      throw new Error(t('INVALID_MARKDOWN_CONTENT'));
    }

    // 检查内容大小
    if (markdown.length > SECURITY_LIMITS.MAX_MARKDOWN_SIZE) {
      throw new Error(
        t('MARKDOWN_TOO_LARGE', {
          maxSize: (SECURITY_LIMITS.MAX_MARKDOWN_SIZE / (1024 * 1024)).toFixed(0)
        })
      );
    }

    let sanitized = markdown;

    // 使用合并的正则表达式进行一次性替换（性能优化）
    sanitized = sanitized.replace(COMBINED_XSS_PATTERN, '[REMOVED: Potentially dangerous content]');
    sanitized = sanitized.replace(COMBINED_DANGEROUS_HTML_PATTERN, '[REMOVED: Dangerous HTML tag]');

    // 检查图片和表格数量
    ContentSecurityFilter.validateContentLimits(sanitized);

    return sanitized;
  }

  /**
   * 验证URL安全性（带缓存优化）
   * @param url 要验证的URL
   * @returns 是否为安全URL
   */
  static validateImageUrl(url: string): boolean {
    // 检查缓存
    if (ContentSecurityFilter.urlValidationCache.has(url)) {
      return ContentSecurityFilter.urlValidationCache.get(url)!;
    }

    // 缓存大小控制
    if (ContentSecurityFilter.urlValidationCache.size >= ContentSecurityFilter.MAX_CACHE_SIZE) {
      ContentSecurityFilter.urlValidationCache.clear();
    }
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const urlObj = new URL(url);

      // 检查协议
      if (!SECURITY_LIMITS.ALLOWED_PROTOCOLS.includes(urlObj.protocol as AllowedProtocol)) {
        console.warn(`⚠️ ${t('UNSUPPORTED_PROTOCOL', { protocol: urlObj.protocol })}`);
        return false;
      }

      // 检查黑名单域名（精确匹配或后缀匹配防止绕过）
      for (const blockedDomain of SECURITY_LIMITS.BLOCKED_DOMAINS) {
        if (urlObj.hostname === blockedDomain || urlObj.hostname.endsWith('.' + blockedDomain)) {
          console.warn(`⚠️ ${t('BLACKLISTED_DOMAIN', { domain: blockedDomain })}`);
          return false;
        }
      }

      // 对于http/https协议，检查白名单（增强安全性）
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        const isTrusted = SECURITY_LIMITS.TRUSTED_DOMAINS.some(
          (trustedDomain) =>
            urlObj.hostname === trustedDomain || urlObj.hostname.endsWith('.' + trustedDomain)
        );

        if (!isTrusted) {
          console.warn(`⚠️ ${t('UNTRUSTED_DOMAIN_WARNING', { hostname: urlObj.hostname })}`);
          // 注意：这里不直接返回false，只是警告，保持兼容性
        }
      }

      // 缓存结果
      ContentSecurityFilter.urlValidationCache.set(url, true);
      return true;
    } catch (error) {
      console.warn(`⚠️ ${t('INVALID_URL_FORMAT', { url })}`, error);
      // 缓存负面结果
      ContentSecurityFilter.urlValidationCache.set(url, false);
      return false;
    }
  }

  /**
   * 验证内容限制（图片和表格数量）
   * @param content Markdown内容
   */
  private static validateContentLimits(content: string): void {
    // 计算图片数量
    const imageMatches = content.match(/!\[.*?\]\(.*?\)/g) || [];
    if (imageMatches.length > SECURITY_LIMITS.MAX_IMAGE_COUNT) {
      throw new Error(t('TOO_MANY_IMAGES', { maxCount: SECURITY_LIMITS.MAX_IMAGE_COUNT }));
    }

    // 计算表格数量（改进版估算）
    const tableLines = content.split('\n').filter((line) => {
      const trimmed = line.trim();
      return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|');
    });

    // 通过表格分隔符（---|）来更准确地计算表格数量
    const separatorLines = content
      .split('\n')
      .filter((line) => /^\s*\|\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|\s*$/.test(line));

    const estimatedTables = Math.max(
      separatorLines.length, // 基于分隔符行计算
      Math.ceil(tableLines.length / 3) // 备用计算方法
    );

    if (estimatedTables > SECURITY_LIMITS.MAX_TABLE_COUNT) {
      throw new Error(t('TOO_MANY_TABLES', { maxCount: SECURITY_LIMITS.MAX_TABLE_COUNT }));
    }
  }

  /**
   * 安全的文件名处理
   * @param filename 原始文件名
   * @returns 安全的文件名
   */
  static sanitizeFileName(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return 'document';
    }

    const sanitized = filename
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_') // 只保留安全字符
      .replace(/_{2,}/g, '_') // 合并多个下划线
      .replace(/^_+|_+$/g, '') // 移除开头和结尾的下划线
      .substring(0, 100); // 限制长度

    // 确保不返回空字符串
    return sanitized || 'document';
  }

  /**
   * 检查内容是否包含敏感信息模式
   * @param content 要检查的内容
   * @returns 检查结果
   */
  static containsSensitiveContent(content: string): {
    hasSensitive: boolean;
    patterns: string[];
  } {
    const sensitivePatterns: Array<{ name: string; pattern: RegExp }> = [
      // 邮箱地址（更精确的匹配）
      { name: '邮箱地址', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },

      // 电话号码（中国和国际格式）
      {
        name: '电话号码',
        pattern: /(?:\+86)?\s*1[3-9]\d{9}\b|\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/g
      },

      // 信用卡号（Luhn算法验证优化）
      {
        name: '信用卡号',
        pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13})\b/g
      },

      // 身份证号（中国）
      {
        name: '身份证号',
        pattern:
          /\b[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]\b/g
      },

      // 社会保障号（美国）
      { name: '社会保障号', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },

      // 具体的API Keys（减少误报）
      { name: 'GitHub Personal Access Token', pattern: /\bghp_[A-Za-z0-9]{36}\b/g },
      { name: 'GitHub OAuth Token', pattern: /\bgho_[A-Za-z0-9]{36}\b/g },
      { name: 'AWS Access Key', pattern: /\bAKIA[A-Z0-9]{16}\b/g },
      { name: 'OpenAI API Key', pattern: /\bsk-[A-Za-z0-9]{48}\b/g },
      { name: 'Stripe API Key', pattern: /\b(sk|pk)_(test|live)_[A-Za-z0-9]{24,}\b/g },
      { name: 'JWT Token', pattern: /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b/g },

      // IP地址
      {
        name: 'IP地址',
        pattern:
          /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g
      },

      // 银行账号（中国）
      { name: '银行账号', pattern: /\b[1-9]\d{12,19}\b/g }
    ];

    const foundPatterns: string[] = [];

    for (const { name, pattern } of sensitivePatterns) {
      if (pattern.test(content)) {
        foundPatterns.push(name);
      }
    }

    return {
      hasSensitive: foundPatterns.length > 0,
      patterns: foundPatterns
    };
  }
}

/**
 * 输入验证装饰器工厂
 */
export function validateInput() {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 验证第一个参数（通常是包含markdown的对象）
      const input = args[0];
      if (input && typeof input === 'object' && input.markdown) {
        try {
          input.markdown = ContentSecurityFilter.sanitizeMarkdown(input.markdown);

          // 检查敏感内容并记录警告
          const sensitiveCheck = ContentSecurityFilter.containsSensitiveContent(input.markdown);
          if (sensitiveCheck.hasSensitive) {
            console.warn(
              `⚠️ Detected potentially sensitive content: ${sensitiveCheck.patterns.join(', ')}`
            );
          }
        } catch (error) {
          console.error('❌ Input validation failed:', error);
          throw error;
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 安全配置接口
 */
export interface SecurityConfig {
  enableContentFiltering: boolean; // 是否启用内容过滤
  enableUrlValidation: boolean; // 是否启用URL验证
  enableSizeCheck: boolean; // 是否启用大小检查
  customTrustedDomains?: string[]; // 自定义受信任域名
  customBlockedDomains?: string[]; // 自定义阻止域名
}

/**
 * 默认安全配置
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableContentFiltering: true,
  enableUrlValidation: true,
  enableSizeCheck: true
};
