import type { OAStyleDefinition } from './oa-template-reader';
import { OATemplateReader } from './oa-template-reader';

/**
 * Markdown元素类型
 */
export type MarkdownElementType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6' // 标题
  | 'paragraph' // 段落
  | 'list-bullet' // 无序列表
  | 'list-ordered' // 有序列表
  | 'table-header' // 表头
  | 'table-cell' // 表格单元格
  | 'code' // 代码块
  | 'blockquote'; // 引用

/**
 * 样式映射配置
 */
interface StyleMappingConfig {
  fallbackStyleId: string; // 回退样式ID
  enableLogging: boolean; // 是否启用日志
}

/**
 * OA样式映射器 - 负责将Markdown元素映射到OA模板中的对应样式
 *
 * 该类提供了一个智能的样式映射系统，能够：
 * - 将Markdown的各种元素（标题、段落、列表等）映射到OA模板的预定义样式
 * - 支持回退机制，当找不到对应样式时使用默认样式
 * - 提供缓存机制提升性能
 * - 支持样式验证和映射摘要
 *
 * @example
 * ```typescript
 * const reader = await createOATemplateReader('template.docx');
 * const mapper = new OAStyleMapper(reader);
 *
 * // 获取标题1的样式
 * const h1Style = mapper.getHeadingStyle(1);
 *
 * // 获取正文样式
 * const paragraphStyle = mapper.getParagraphStyle();
 *
 * // 检查样式映射有效性
 * const validation = mapper.validateMappings();
 * ```
 */
export class OAStyleMapper {
  private reader: OATemplateReader;
  private config: StyleMappingConfig;
  private mappingCache: Map<MarkdownElementType, OAStyleDefinition | null> = new Map();

  constructor(reader: OATemplateReader, config: Partial<StyleMappingConfig> = {}) {
    this.reader = reader;
    this.config = {
      fallbackStyleId: '1', // Normal样式作为默认回退
      enableLogging: true,
      ...config
    };

    this.buildMappingCache();
  }

  /**
   * 构建映射缓存
   */
  private buildMappingCache(): void {
    const mappingRules: Record<MarkdownElementType, string[]> = {
      // 标题映射：H1对应大标题(Title)，H2对应标题一，以此类推
      h1: ['34', 'Title'],
      h2: ['2', 'heading 1'],
      h3: ['3', 'heading 2'],
      h4: ['5', 'heading 4'],
      h5: ['6', 'heading 5'],
      h6: ['7', 'heading 6'],

      // 正文映射：使用 Normal（带首行缩进）；如需“无缩进正文”可在上层切换到 40
      paragraph: ['1', 'Normal', '40', '正文无缩进'],

      // 列表映射（依赖 numbering.xml）
      'list-bullet': ['14', 'List Bullet', '27', 'List'],
      'list-ordered': ['13', 'List Number', '11', 'List Number 2'],

      // 表格映射：优先使用模板中的自定义表格样式
      'table-header': ['41', '表格表头', '1', 'Normal'],
      'table-cell': ['42', '表格内容', '1', 'Normal'],

      // 代码和引用：默认回到 Normal；后续可扩展到专用样式
      code: ['1', 'Normal'],
      blockquote: ['1', 'Normal']
    };

    for (const [elementType, candidates] of Object.entries(mappingRules)) {
      const style = this.findBestMatchingStyle(candidates);
      this.mappingCache.set(elementType as MarkdownElementType, style);

      if (this.config.enableLogging) {
        if (style) {
          console.log(
            `📝 映射规则: ${elementType} → ${style.name} (ID: ${style.styleId ?? style.id})`
          );
        } else {
          console.warn(`⚠️  映射失败: ${elementType} - 未找到匹配样式，将使用回退样式`);
        }
      }
    }
  }

  /**
   * 根据候选项找到最佳匹配样式
   */
  private findBestMatchingStyle(candidates: string[]): OAStyleDefinition | null {
    for (const candidate of candidates) {
      // 先按ID查找
      let style = this.reader.getStyle(candidate);
      if (style) return style;

      // 再按名称查找
      style = this.reader.getStyleByName(candidate);
      if (style) return style;
    }
    return null;
  }

  /**
   * 获取指定Markdown元素类型对应的OA样式
   *
   * 此方法是样式映射的核心，它会：
   * 1. 首先从缓存中查找预映射的样式
   * 2. 如果找不到，则使用配置的回退样式
   * 3. 确保始终返回一个有效的样式定义
   *
   * @param elementType Markdown元素类型（如'h1', 'paragraph', 'list-bullet'等）
   * @returns 对应的OA样式定义
   * @throws {Error} 当回退样式也不存在时抛出错误
   *
   * @example
   * ```typescript
   * const h1Style = mapper.getStyleForElement('h1');
   * const listStyle = mapper.getStyleForElement('list-bullet');
   * ```
   */
  getStyleForElement(elementType: MarkdownElementType): OAStyleDefinition {
    const cachedStyle = this.mappingCache.get(elementType);

    if (cachedStyle) {
      return cachedStyle;
    }

    // 使用回退样式
    const fallbackStyle = this.reader.getStyle(this.config.fallbackStyleId);
    if (!fallbackStyle) {
      throw new Error(`回退样式 ${this.config.fallbackStyleId} 不存在`);
    }

    if (this.config.enableLogging) {
      console.warn(
        `⚠️  使用回退样式: ${elementType} → ${fallbackStyle.name} (ID: ${fallbackStyle.styleId ?? fallbackStyle.id})`
      );
    }

    return fallbackStyle;
  }

  /**
   * 获取标题样式（支持级别参数）
   *
   * 支持Markdown的6级标题（H1-H6），会自动映射到OA模板中对应的标题样式：
   * - H1 → Title (22磅，粗体，居中)
   * - H2 → heading 1 (16磅，左对齐，首行缩进2字符)
   * - H3 → heading 2 (16磅，两端对齐，首行缩进4字符)
   * - H4-H6 → 对应的heading样式
   *
   * @param level 标题级别，范围1-6，超出范围时使用H6样式
   * @returns 对应级别的标题样式定义
   *
   * @example
   * ```typescript
   * const titleStyle = mapper.getHeadingStyle(1); // 获取H1样式
   * const h2Style = mapper.getHeadingStyle(2);    // 获取H2样式
   * const fallbackStyle = mapper.getHeadingStyle(10); // 超出范围，返回H6样式
   * ```
   */
  getHeadingStyle(level: number): OAStyleDefinition {
    const headingTypes: MarkdownElementType[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    if (level >= 1 && level <= 6) {
      return this.getStyleForElement(headingTypes[level - 1]);
    }

    // 超出范围的标题级别使用最后一个标题样式
    return this.getStyleForElement('h6');
  }

  /**
   * 获取正文样式
   */
  getParagraphStyle(): OAStyleDefinition {
    return this.getStyleForElement('paragraph');
  }

  /**
   * 获取列表样式
   *
   * 根据列表类型返回对应的OA样式：
   * - 无序列表：使用 List Bullet 样式（首行缩进3字符）
   * - 有序列表：使用 List Number 样式（首行缩进2字符）
   *
   * @param ordered 是否为有序列表，默认false（无序列表）
   * @returns 对应的列表样式定义
   *
   * @example
   * ```typescript
   * const bulletStyle = mapper.getListStyle(false); // 无序列表样式
   * const numberedStyle = mapper.getListStyle(true); // 有序列表样式
   * ```
   */
  getListStyle(ordered: boolean = false): OAStyleDefinition {
    return this.getStyleForElement(ordered ? 'list-ordered' : 'list-bullet');
  }

  /**
   * 获取表格样式
   *
   * 根据单元格类型返回对应的表格样式：
   * - 表头单元格：使用 表格表头 样式（通常加粗显示）
   * - 普通单元格：使用 表格内容 样式（正文格式）
   *
   * @param isHeader 是否为表头单元格，默认false（普通单元格）
   * @returns 对应的表格单元格样式定义
   *
   * @example
   * ```typescript
   * const headerStyle = mapper.getTableCellStyle(true);  // 表头样式
   * const cellStyle = mapper.getTableCellStyle(false);   // 普通单元格样式
   * ```
   */
  getTableCellStyle(isHeader: boolean = false): OAStyleDefinition {
    return this.getStyleForElement(isHeader ? 'table-header' : 'table-cell');
  }

  /**
   * 获取代码块样式
   */
  getCodeBlockStyle(): OAStyleDefinition {
    return this.getStyleForElement('code');
  }

  /**
   * 获取引用样式
   */
  getBlockquoteStyle(): OAStyleDefinition {
    return this.getStyleForElement('blockquote');
  }

  /**
   * 检查样式是否存在
   */
  hasStyle(elementType: MarkdownElementType): boolean {
    return this.mappingCache.get(elementType) !== null;
  }

  /**
   * 获取所有映射的样式信息
   */
  getMappingSummary(): Record<MarkdownElementType, { styleId: string; styleName: string } | null> {
    const summary: Record<string, { styleId: string; styleName: string } | null> = {};

    for (const [elementType, style] of this.mappingCache) {
      summary[elementType] = style
        ? {
            styleId: style.styleId ?? style.id,
            styleName: style.name
          }
        : null;
    }

    return summary;
  }

  /**
   * 验证所有映射是否完整
   */
  validateMappings(): { isValid: boolean; missingMappings: MarkdownElementType[] } {
    const missingMappings: MarkdownElementType[] = [];

    for (const [elementType, style] of this.mappingCache) {
      if (!style) {
        missingMappings.push(elementType);
      }
    }

    return {
      isValid: missingMappings.length === 0,
      missingMappings
    };
  }

  /**
   * 创建样式映射器
   */
  static async create(
    reader: OATemplateReader,
    config?: Partial<StyleMappingConfig>
  ): Promise<OAStyleMapper> {
    return new OAStyleMapper(reader, config);
  }
}

/**
 * 快速创建样式映射器
 */
export async function createOAStyleMapper(
  reader: OATemplateReader,
  config?: Partial<StyleMappingConfig>
): Promise<OAStyleMapper> {
  return OAStyleMapper.create(reader, config);
}
