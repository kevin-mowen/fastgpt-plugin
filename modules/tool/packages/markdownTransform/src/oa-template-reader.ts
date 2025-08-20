import AdmZip from 'adm-zip';
import * as path from 'path';

/**
 * OA模板样式定义接口
 */
export interface OAStyleDefinition {
  id: string;
  styleId?: string;
  name: string;
  type: 'paragraph' | 'character' | 'table';
  font?: {
    eastAsia?: string; // 中文字体
    ascii?: string; // 英文字体
  };
  fontSize?: number; // 字号（磅）
  isBold?: boolean; // 是否粗体
  isItalic?: boolean; // 是否斜体
  color?: string; // 字体颜色
  alignment?: 'left' | 'center' | 'right' | 'both' | 'distribute';
  spacing?: {
    before?: number; // 段前距（磅）
    after?: number; // 段后距（磅）
    lineSpacing?: number; // 行距倍数
  };
  indent?: {
    firstLine?: number; // 首行缩进（字符）
    left?: number; // 左缩进（字符）
  };
}

/**
 * 页面设置接口
 */
export interface OAPageSettings {
  width: number; // 页面宽度（毫米）
  height: number; // 页面高度（毫米）
  margins: {
    top: number; // 上边距（毫米）
    bottom: number; // 下边距（毫米）
    left: number; // 左边距（毫米）
    right: number; // 右边距（毫米）
  };
}

/**
 * OA模板读取器
 */
export class OATemplateReader {
  private templatePath: string;
  private styles: Map<string, OAStyleDefinition> = new Map();
  private pageSettings?: OAPageSettings;
  private isLoaded = false;

  constructor(templatePath?: string) {
    this.templatePath = templatePath || path.join(__dirname, '../../templates/oa_template.docx');
  }

  /**
   * 加载并解析OA模板
   */
  async loadTemplate(): Promise<void> {
    try {
      const zip = new AdmZip(this.templatePath);

      // 解析样式
      await this.parseStyles(zip);

      // 解析页面设置
      await this.parsePageSettings(zip);

      this.isLoaded = true;
      console.log(`✅ OA模板加载成功，共解析${this.styles.size}个样式`);
    } catch (error) {
      console.error('❌ OA模板加载失败:', error);
      throw error;
    }
  }

  /**
   * 解析样式定义
   */
  private async parseStyles(zip: AdmZip): Promise<void> {
    const stylesEntry = zip.getEntry('word/styles.xml');
    if (!stylesEntry) {
      throw new Error('styles.xml not found in template');
    }

    const stylesXml = stylesEntry.getData().toString('utf8');

    // 解析段落样式
    this.parseStylesByType(stylesXml, 'paragraph');
    // 解析字符样式
    this.parseStylesByType(stylesXml, 'character');
    // 解析表格样式
    this.parseStylesByType(stylesXml, 'table');
  }

  /**
   * 按类型解析样式
   */
  private parseStylesByType(
    stylesXml: string,
    styleType: 'paragraph' | 'character' | 'table'
  ): void {
    // 匹配包含type的样式（不依赖属性顺序）
    const stylePattern = new RegExp(
      `<w:style[^>]*w:type="${styleType}"[^>]*>(.*?)</w:style>`,
      'gs'
    );
    let match;

    while ((match = stylePattern.exec(stylesXml)) !== null) {
      const fullStyleTag = match[0];
      const styleContent = match[1];

      // 从完整标签中提取styleId
      const idMatch = fullStyleTag.match(/w:styleId="([^"]*)"/);
      const styleId = idMatch ? idMatch[1] : 'unknown';

      // 提取样式名称
      const nameMatch = styleContent.match(/<w:name[^>]*w:val="([^"]*)"/);
      const styleName = nameMatch ? nameMatch[1] : `样式${styleId}`;

      // 解析样式格式
      const styleDefinition = this.parseStyleDefinition(
        styleId,
        styleName,
        styleType,
        styleContent
      );

      this.styles.set(styleId, styleDefinition);
    }
  }

  /**
   * 解析单个样式定义
   */
  private parseStyleDefinition(
    id: string,
    name: string,
    type: 'paragraph' | 'character' | 'table',
    content: string
  ): OAStyleDefinition {
    const style: OAStyleDefinition = {
      id,
      styleId: id, // 兼容调用方读取 styleId 的用法
      name,
      type
    };

    // 解析字体（对属性顺序不敏感）
    const rFontsTag = content.match(/<w:rFonts\b[^>]*>/)?.[0] || '';
    const eastAsiaFont = rFontsTag.match(/w:eastAsia="([^"]*)"/)?.[1];
    const asciiFont = rFontsTag.match(/w:ascii="([^"]*)"/)?.[1];
    if (eastAsiaFont || asciiFont) {
      style.font = {
        eastAsia: eastAsiaFont,
        ascii: asciiFont
      };
    }

    // 解析字号（优先 w:sz，其次 w:szCs）
    const sizeMatch =
      content.match(/<w:sz[^>]*w:val="(\d+)"/) || content.match(/<w:szCs[^>]*w:val="(\d+)"/);
    if (sizeMatch) {
      style.fontSize = parseInt(sizeMatch[1], 10) / 2; // 半点制转换为磅
    }

    // 解析粗体（兼容帶屬性形式）
    const bTag = content.match(/<w:b(?:\s+[^>]*)?\/>/);
    if (bTag) {
      const bVal = bTag[0].match(/w:val="([^"]*)"/)?.[1];
      style.isBold = bVal ? bVal !== '0' && bVal.toLowerCase() !== 'false' : true;
    }

    // 解析斜体（兼容帶屬性形式）
    const iTag = content.match(/<w:i(?:\s+[^>]*)?\/>/);
    if (iTag) {
      const iVal = iTag[0].match(/w:val="([^"]*)"/)?.[1];
      style.isItalic = iVal ? iVal !== '0' && iVal.toLowerCase() !== 'false' : true;
    }

    // 解析字体颜色
    const colorMatch = content.match(/<w:color\b[^>]*w:val="([^"]*)"/);
    if (colorMatch && colorMatch[1] && colorMatch[1] !== 'auto') {
      style.color = colorMatch[1];
    }

    // 解析对齐方式
    const alignMatch = content.match(/<w:jc\b[^>]*w:val="([^"]*)"/);
    if (alignMatch) {
      style.alignment = alignMatch[1] as any;
    }

    // 解析间距
    const beforeMatch = content.match(/<w:spacing[^>]*w:before="(\d+)"/);
    const afterMatch = content.match(/<w:spacing[^>]*w:after="(\d+)"/);
    const lineSpacingMatch = content.match(
      /<w:spacing[^>]*w:line="(\d+)"[^>]*w:lineRule="([^"]*)"/
    );

    if (beforeMatch || afterMatch || lineSpacingMatch) {
      style.spacing = {};

      if (beforeMatch) {
        style.spacing.before = parseInt(beforeMatch[1]) / 20; // twips转磅
      }

      if (afterMatch) {
        style.spacing.after = parseInt(afterMatch[1]) / 20;
      }

      if (lineSpacingMatch && lineSpacingMatch[2] === 'auto') {
        style.spacing.lineSpacing = parseInt(lineSpacingMatch[1]) / 240; // 240=单倍行距
      }
    }

    // 解析缩进
    const firstLineMatch = content.match(/<w:ind[^>]*w:firstLine="(\d+)"/);
    const leftIndentMatch = content.match(/<w:ind[^>]*w:left="(\d+)"/);

    if (firstLineMatch || leftIndentMatch) {
      style.indent = {};

      if (firstLineMatch) {
        style.indent.firstLine = Math.round(parseInt(firstLineMatch[1]) / 420); // 420 twips = 1字符
      }

      if (leftIndentMatch && leftIndentMatch[1] !== '0') {
        style.indent.left = Math.round(parseInt(leftIndentMatch[1]) / 420);
      }
    }

    return style;
  }

  /**
   * 解析页面设置
   */
  private async parsePageSettings(zip: AdmZip): Promise<void> {
    const docEntry = zip.getEntry('word/document.xml');
    if (!docEntry) return;

    const docXml = docEntry.getData().toString('utf8');

    // 页面尺寸
    const sizeMatch = docXml.match(/<w:pgSz[^>]*w:w="(\d+)"[^>]*w:h="(\d+)"/);
    // 页边距
    const marginMatch = docXml.match(
      /<w:pgMar[^>]*w:top="(\d+)"[^>]*w:right="(\d+)"[^>]*w:bottom="(\d+)"[^>]*w:left="(\d+)"/
    );

    if (sizeMatch && marginMatch) {
      this.pageSettings = {
        width: Math.round((parseInt(sizeMatch[1], 10) / 1440) * 25.4), // twips转毫米
        height: Math.round((parseInt(sizeMatch[2], 10) / 1440) * 25.4),
        margins: {
          top: Math.round((parseInt(marginMatch[1], 10) / 1440) * 25.4),
          right: Math.round((parseInt(marginMatch[2], 10) / 1440) * 25.4),
          bottom: Math.round((parseInt(marginMatch[3], 10) / 1440) * 25.4),
          left: Math.round((parseInt(marginMatch[4], 10) / 1440) * 25.4)
        }
      };
    }
  }

  /**
   * 获取指定ID的样式
   */
  getStyle(styleId: string): OAStyleDefinition | undefined {
    this.ensureLoaded();
    return this.styles.get(styleId);
  }

  /**
   * 根据样式名称获取样式
   */
  getStyleByName(styleName: string): OAStyleDefinition | undefined {
    this.ensureLoaded();
    const want = (styleName || '').trim().toLowerCase();
    for (const style of this.styles.values()) {
      if ((style.name || '').trim().toLowerCase() === want) {
        return style;
      }
    }
    return undefined;
  }

  /**
   * 获取所有样式
   */
  getAllStyles(): OAStyleDefinition[] {
    this.ensureLoaded();
    return Array.from(this.styles.values());
  }

  /**
   * 获取段落样式
   */
  getParagraphStyles(): OAStyleDefinition[] {
    this.ensureLoaded();
    return this.getAllStyles().filter((style) => style.type === 'paragraph');
  }

  /**
   * 获取字符样式
   */
  getCharacterStyles(): OAStyleDefinition[] {
    this.ensureLoaded();
    return this.getAllStyles().filter((style) => style.type === 'character');
  }

  /**
   * 获取表格样式
   */
  getTableStyles(): OAStyleDefinition[] {
    this.ensureLoaded();
    return this.getAllStyles().filter((style) => style.type === 'table');
  }

  /**
   * 获取页面设置
   */
  getPageSettings(): OAPageSettings | undefined {
    this.ensureLoaded();
    return this.pageSettings;
  }

  /**
   * 检查是否已加载
   */
  private ensureLoaded(): void {
    if (!this.isLoaded) {
      throw new Error('Template not loaded. Please call loadTemplate() first.');
    }
  }

  /**
   * 模板是否存在
   */
  static exists(templatePath?: string): boolean {
    try {
      const finalPath = templatePath || path.join(__dirname, '../../templates/oa_template.docx');
      return require('fs').existsSync(finalPath);
    } catch {
      return false;
    }
  }
}

/**
 * 创建OA模板读取器实例
 */
export async function createOATemplateReader(templatePath?: string): Promise<OATemplateReader> {
  const reader = new OATemplateReader(templatePath);
  await reader.loadTemplate();
  return reader;
}
