/**
 * 类型定义文件 - 集中管理OA DOCX转换相关的所有TypeScript类型定义
 */

/**
 * Markdown元素类型枚举
 * 定义了所有支持的Markdown元素类型
 */
export enum MarkdownElementType {
  /** 标题1级 */
  H1 = 'h1',
  /** 标题2级 */
  H2 = 'h2',
  /** 标题3级 */
  H3 = 'h3',
  /** 标题4级 */
  H4 = 'h4',
  /** 标题5级 */
  H5 = 'h5',
  /** 标题6级 */
  H6 = 'h6',
  /** 正文段落 */
  PARAGRAPH = 'paragraph',
  /** 无序列表项 */
  LIST_BULLET = 'list-bullet',
  /** 有序列表项 */
  LIST_ORDERED = 'list-ordered',
  /** 表格表头单元格 */
  TABLE_HEADER = 'table-header',
  /** 表格普通单元格 */
  TABLE_CELL = 'table-cell',
  /** 代码块 */
  CODE = 'code',
  /** 引用块 */
  BLOCKQUOTE = 'blockquote'
}

/**
 * OA样式类型枚举
 * 定义了OA模板中支持的样式类型
 */
export enum OAStyleType {
  /** 段落样式 */
  PARAGRAPH = 'paragraph',
  /** 字符样式 */
  CHARACTER = 'character',
  /** 表格样式 */
  TABLE = 'table'
}

/**
 * 对齐方式枚举
 * 定义了文档中支持的对齐方式
 */
export enum AlignmentType {
  /** 左对齐 */
  LEFT = 'left',
  /** 居中对齐 */
  CENTER = 'center',
  /** 右对齐 */
  RIGHT = 'right',
  /** 两端对齐 */
  BOTH = 'both',
  /** 分散对齐 */
  DISTRIBUTE = 'distribute'
}

/**
 * 字体定义接口
 * 定义了字体的基本属性
 */
export interface FontDefinition {
  /** 中文字体名称 */
  eastAsia?: string;
  /** 英文字体名称 */
  ascii?: string;
}

/**
 * 间距定义接口
 * 定义了段落间距的各种属性（单位：磅）
 */
export interface SpacingDefinition {
  /** 段前距离（磅） */
  before?: number;
  /** 段后距离（磅） */
  after?: number;
  /** 行距倍数 */
  lineSpacing?: number;
}

/**
 * 缩进定义接口
 * 定义了段落缩进的各种属性（单位：字符）
 */
export interface IndentDefinition {
  /** 首行缩进（字符） */
  firstLine?: number;
  /** 左边缩进（字符） */
  left?: number;
}

/**
 * 边距定义接口
 * 定义了页面边距的各种属性（单位：毫米）
 */
export interface MarginDefinition {
  /** 上边距（毫米） */
  top: number;
  /** 下边距（毫米） */
  bottom: number;
  /** 左边距（毫米） */
  left: number;
  /** 右边距（毫米） */
  right: number;
}

/**
 * OA样式定义接口
 * 完整定义了一个OA样式的所有属性
 */
export interface OAStyleDefinition {
  /** 样式唯一标识符 */
  id: string;
  /** Word文档中的styleId，可能与id不同 */
  styleId?: string;
  /** 样式显示名称 */
  name: string;
  /** 样式类型 */
  type: keyof typeof OAStyleType;
  /** 基于的样式ID（样式继承） */
  basedOn?: string;
  /** 字体定义 */
  font?: FontDefinition;
  /** 字号（磅） */
  fontSize?: number;
  /** 是否粗体 */
  isBold?: boolean;
  /** 是否斜体 */
  isItalic?: boolean;
  /** 字体颜色（十六进制，如：'FF0000'） */
  color?: string;
  /** 对齐方式 */
  alignment?: keyof typeof AlignmentType;
  /** 间距定义 */
  spacing?: SpacingDefinition;
  /** 缩进定义 */
  indent?: IndentDefinition;
}

/**
 * 页面设置接口
 * 定义了页面的尺寸和边距
 */
export interface OAPageSettings {
  /** 页面宽度（毫米） */
  width: number;
  /** 页面高度（毫米） */
  height: number;
  /** 页面边距 */
  margins: MarginDefinition;
}

/**
 * 样式映射配置接口
 * 定义了样式映射器的配置选项
 */
export interface StyleMappingConfig {
  /** 回退样式ID，当找不到对应样式时使用 */
  fallbackStyleId: string;
  /** 是否启用日志输出 */
  enableLogging: boolean;
}

/**
 * 样式映射规则类型
 * 定义了Markdown元素到OA样式的映射规则
 */
export type StyleMappingRules = Record<keyof typeof MarkdownElementType, string[]>;

/**
 * 样式映射摘要接口
 * 提供样式映射的概览信息
 */
export interface StyleMappingSummary {
  /** 映射的样式信息，key为Markdown元素类型 */
  [elementType: string]: {
    /** 样式ID */
    styleId: string;
    /** 样式名称 */
    styleName: string;
  } | null;
}

/**
 * 样式验证结果接口
 * 提供样式映射验证的结果信息
 */
export interface StyleValidationResult {
  /** 是否所有映射都有效 */
  isValid: boolean;
  /** 缺失映射的元素类型列表 */
  missingMappings: (keyof typeof MarkdownElementType)[];
}

/**
 * 图片处理选项接口
 * 定义了图片处理的各种选项
 */
export interface ImageProcessingOptions {
  /** 最大宽度（像素） */
  maxWidth?: number;
  /** 最大高度（像素） */
  maxHeight?: number;
  /** 图片质量（0-100） */
  quality?: number;
  /** 是否启用压缩 */
  enableCompression?: boolean;
}

/**
 * 图片尺寸信息接口
 * 定义了图片的尺寸信息
 */
export interface ImageDimensions {
  /** 图片宽度（像素） */
  width: number;
  /** 图片高度（像素） */
  height: number;
}

/**
 * 显示尺寸接口
 * 定义了在文档中显示的尺寸
 */
export interface DisplaySize {
  /** 显示宽度 */
  width: number;
  /** 显示高度 */
  height: number;
}

/**
 * 转换选项接口
 * 定义了Markdown转换的各种选项
 */
export interface ConversionOptions {
  /** 目标格式 */
  format: 'oa.docx' | 'docx' | 'xlsx';
  /** 输出质量 */
  quality?: 'low' | 'medium' | 'high';
  /** 是否启用压缩 */
  compression?: boolean;
  /** 自定义样式映射 */
  customMappings?: Partial<StyleMappingRules>;
  /** 图片处理选项 */
  imageOptions?: ImageProcessingOptions;
}

/**
 * 转换结果接口
 * 定义了转换操作的结果
 */
export interface ConversionResult {
  /** 文件访问URL */
  url: string;
  /** 文件大小（字节） */
  size?: number;
  /** 转换耗时（毫秒） */
  duration?: number;
  /** 转换统计信息 */
  statistics?: ConversionStatistics;
}

/**
 * 转换统计信息接口
 * 提供转换过程的详细统计
 */
export interface ConversionStatistics {
  /** 处理的标题数量 */
  headingCount: number;
  /** 处理的段落数量 */
  paragraphCount: number;
  /** 处理的列表项数量 */
  listItemCount: number;
  /** 处理的表格数量 */
  tableCount: number;
  /** 处理的图片数量 */
  imageCount: number;
  /** 处理的代码块数量 */
  codeBlockCount: number;
  /** 模板加载时间（毫秒） */
  templateLoadTime: number;
  /** Markdown解析时间（毫秒） */
  parseTime: number;
  /** 文档生成时间（毫秒） */
  generationTime: number;
}

/**
 * 错误信息接口
 * 定义了错误信息的结构
 */
export interface ErrorInfo {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: any;
  /** 发生错误的位置 */
  location?: string;
}

/**
 * 模板信息接口
 * 提供OA模板的基本信息
 */
export interface TemplateInfo {
  /** 模板路径 */
  path: string;
  /** 模板版本 */
  version?: string;
  /** 样式数量 */
  styleCount: number;
  /** 支持的元素类型 */
  supportedElements: (keyof typeof MarkdownElementType)[];
  /** 创建时间 */
  createdAt?: Date;
  /** 最后修改时间 */
  lastModified?: Date;
}

/**
 * 性能指标接口
 * 定义了性能监控的各项指标
 */
export interface PerformanceMetrics {
  /** 内存使用量（字节） */
  memoryUsage: number;
  /** CPU使用时间（毫秒） */
  cpuTime: number;
  /** 缓存命中率（0-1） */
  cacheHitRate: number;
  /** 平均处理时间（毫秒） */
  avgProcessingTime: number;
  /** 错误率（0-1） */
  errorRate: number;
}

/**
 * 工具函数类型定义
 */

/**
 * 样式查找函数类型
 * 用于在模板中查找样式的函数签名
 */
export type StyleLookupFunction = (candidates: string[]) => OAStyleDefinition | null;

/**
 * 内容验证函数类型
 * 用于验证Markdown内容的函数签名
 */
export type ContentValidator = (content: string) => { isValid: boolean; errors: string[] };

/**
 * 进度回调函数类型
 * 用于报告转换进度的回调函数
 */
export type ProgressCallback = (progress: number, stage: string, details?: any) => void;

/**
 * 错误处理函数类型
 * 用于处理转换过程中错误的回调函数
 */
export type ErrorHandler = (error: ErrorInfo) => void | Promise<void>;

/**
 * 自定义渲染函数类型
 * 用于自定义渲染特定Markdown元素的函数
 */
export type CustomRenderer = (element: any, context: any) => any | Promise<any>;
