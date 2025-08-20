import { z } from 'zod';
import { uploadFile } from '@tool/utils/uploadFile';
import { ContentSecurityFilter } from './security-utils';
import { t, autoDetectLanguage, I18n, type SupportedLanguage } from './i18n';
import { getConfig } from './config';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType
} from 'docx';
import MarkdownIt from 'markdown-it';
import type { OutputType } from './type';
import {
  downloadImage,
  getImageDimensions,
  getImageExtension,
  calculateDisplaySize
} from './shared';
import { createOATemplateReader, OATemplateReader } from './oa-template-reader';
import { createOAStyleMapper, OAStyleMapper } from './oa-style-mapper';
import type { OAStyleDefinition } from './oa-template-reader';
import * as path from 'path';
import PizZip from 'pizzip';
import * as fs from 'fs';

/**
 * DOCX转换常量 - 提升可维护性
 */
const DOCX_CONSTANTS = {
  // 间距常量 (points)
  PARAGRAPH_SPACING_AFTER: 100, // 段落后间距
  HEADING_SPACING_AFTER: 200, // 标题后间距
  IMAGE_SPACING_AFTER: 200, // 图片后间距
  CODE_LINE_SPACING: 0, // 代码行间距
  LIST_ITEM_SPACING: 100, // 列表项间距

  // 字号常量 (half-points)
  DEFAULT_FONT_SIZE: 20, // 默认字号 (10pt)
  CODE_FONT_SIZE: 20, // 代码字号 (10pt)

  // 缩进常量 (twips)
  LIST_INDENT_LEFT: 420, // 列表左缩进
  LIST_INDENT_HANGING: 420, // 列表悬挂缩进

  // 尺寸转换常量
  HALF_POINTS_TO_POINTS: 2, // 半点转磅
  TWIPS_CONVERSION: {
    TO_POINTS: 20, // twips转磅
    TO_MM: 1440 / 25.4, // twips转毫米
    MM_MULTIPLIER: 56.69 // 毫米转twips
  },

  // 行距常量
  SINGLE_LINE_SPACING: 240, // 单倍行距 (twips)

  // 表格设置
  TABLE_WIDTH_PERCENTAGE: 100, // 表格宽度百分比

  // 边框设置
  BORDER_SIZE: 1, // 边框大小

  // 颜色常量
  COLORS: {
    ERROR: 'FF0000', // 红色 - 错误信息
    WARNING: '666666', // 灰色 - 警告信息
    CODE_BACKGROUND: 'EEEEEE', // 浅灰色 - 代码背景
    CODE_TEXT: '333333', // 深灰色 - 代码文本
    AUTO: 'auto' // 自动颜色
  }
} as const;

export const InputType = z.object({
  markdown: z.string().describe('Markdown content to convert')
});

/**
 * 将OA样式定义转换为docx样式选项
 */
function convertOAStyleToDocxOptions(oaStyle: OAStyleDefinition): {
  font?: { name: string };
  size?: number;
  bold?: boolean;
  italics?: boolean;
  color?: string;
} {
  const options: {
    font?: { name: string };
    size?: number;
    bold?: boolean;
    italics?: boolean;
    color?: string;
  } = {};

  // 字体设置 - 完全按照模板定义，如果模板没有设置字体，则不设置字体
  if (oaStyle.font) {
    options.font = {
      name: oaStyle.font.eastAsia || oaStyle.font.ascii || 'Times New Roman'
    };
  }
  // 不再强制设置字体，让docx库使用默认字体

  // 字号设置（磅转换为半点）
  if (oaStyle.fontSize) {
    options.size = oaStyle.fontSize * DOCX_CONSTANTS.HALF_POINTS_TO_POINTS;
  }

  // 粗体和斜体 - 完全按照模板定义
  if (oaStyle.isBold) options.bold = true;
  if (oaStyle.isItalic) options.italics = true;

  // 移除强制添加粗体的逻辑，完全按照模板来

  // 字体颜色
  if (oaStyle.color) {
    options.color = oaStyle.color;
  }

  return options;
}

/**
 * 将OA对齐方式转换为docx对齐类型
 */
function convertOAAlignmentToDocx(
  alignment?: string
): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  switch (alignment) {
    case 'left':
      return AlignmentType.LEFT;
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'both':
      return AlignmentType.BOTH;
    case 'distribute':
      return AlignmentType.DISTRIBUTE;
    default:
      return undefined;
  }
}

/**
 * 创建带OA样式的TextRun
 */
function createOATextRun(
  text: string,
  oaStyle: OAStyleDefinition,
  overrides: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}
): TextRun {
  const baseOptions = convertOAStyleToDocxOptions(oaStyle);

  return new TextRun({
    text,
    ...baseOptions,
    bold: overrides.bold !== undefined ? overrides.bold : baseOptions.bold,
    italics: overrides.italics !== undefined ? overrides.italics : baseOptions.italics,
    color: overrides.color || baseOptions.color,
    size: overrides.size && !isNaN(overrides.size) ? overrides.size : baseOptions.size
  });
}

/**
 * 创建带OA样式的段落
 */
function createOAParagraph(
  children: TextRun[],
  oaStyle: OAStyleDefinition,
  options: any = {}
): Paragraph {
  const paragraphOptions: any = {
    children,
    ...options
  };

  // 应用模板段落样式（关键：使用模板的 w:styleId）
  if (oaStyle && (oaStyle.styleId || oaStyle.id)) {
    paragraphOptions.style = oaStyle.styleId || oaStyle.id;
  }

  // 对齐方式
  if (oaStyle.alignment) {
    paragraphOptions.alignment = convertOAAlignmentToDocx(oaStyle.alignment);
  }

  // 间距设置
  if (oaStyle.spacing) {
    paragraphOptions.spacing = {};
    if (oaStyle.spacing.before) {
      paragraphOptions.spacing.before =
        oaStyle.spacing.before * DOCX_CONSTANTS.TWIPS_CONVERSION.TO_POINTS; // 磅转twips
    }
    if (oaStyle.spacing.after) {
      paragraphOptions.spacing.after =
        oaStyle.spacing.after * DOCX_CONSTANTS.TWIPS_CONVERSION.TO_POINTS;
    }
    if (oaStyle.spacing.lineSpacing) {
      paragraphOptions.spacing.line =
        oaStyle.spacing.lineSpacing * DOCX_CONSTANTS.SINGLE_LINE_SPACING; // 倍数转twips
      paragraphOptions.spacing.lineRule = 'auto';
    }
  }

  // 缩进设置
  if (oaStyle.indent) {
    paragraphOptions.indent = {};
    if (oaStyle.indent.firstLine) {
      paragraphOptions.indent.firstLine =
        oaStyle.indent.firstLine * DOCX_CONSTANTS.LIST_INDENT_LEFT; // 字符转twips
    }
    if (oaStyle.indent.left) {
      paragraphOptions.indent.left = oaStyle.indent.left * DOCX_CONSTANTS.LIST_INDENT_LEFT;
    }
  }

  return new Paragraph(paragraphOptions);
}

/**
 * 处理图片 - 添加安全验证
 * @param text 包含图片的文本
 * @param mapper 样式映射器
 * @returns 图片段落或null
 */
async function processImageFromText(
  text: string,
  mapper: OAStyleMapper
): Promise<Paragraph | null> {
  const imageMatch = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (!imageMatch) return null;

  const [, alt, src] = imageMatch;

  // 安全验证URL
  if (!ContentSecurityFilter.validateImageUrl(src)) {
    console.warn(`⚠️ 图片URL安全验证失败，跳过处理: ${src}`);
    const paragraphStyle = mapper.getParagraphStyle();
    return createOAParagraph(
      [
        createOATextRun(`[${t('UNSAFE_URL_BLOCKED')}]`, paragraphStyle, {
          italics: true,
          color: DOCX_CONSTANTS.COLORS.ERROR
        })
      ],
      paragraphStyle,
      { spacing: { after: DOCX_CONSTANTS.IMAGE_SPACING_AFTER } }
    );
  }

  try {
    const imageBuffer = await downloadImage(src);
    const originalDimensions = getImageDimensions(imageBuffer);
    const displaySize = calculateDisplaySize(originalDimensions.width, originalDimensions.height);

    return new Paragraph({
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: {
            width: displaySize.width,
            height: displaySize.height
          },
          type: getImageExtension(src)
        })
      ],
      spacing: { after: DOCX_CONSTANTS.IMAGE_SPACING_AFTER }
    });
  } catch (error) {
    console.warn(`processImageFromText error: ${src}`, error);
    const paragraphStyle = mapper.getParagraphStyle();
    return createOAParagraph(
      [
        createOATextRun(`[${t('IMAGE_LOAD_FAILED', { src: alt || src })}]`, paragraphStyle, {
          italics: true,
          color: DOCX_CONSTANTS.COLORS.WARNING
        })
      ],
      paragraphStyle,
      { spacing: { after: DOCX_CONSTANTS.IMAGE_SPACING_AFTER } }
    );
  }
}

function parseInline(content: string, baseStyle: OAStyleDefinition): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /(\*\*.+?\*\*|\*.+?\*|\[.+?\]\(.+?\)|[^*[\]]+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const part = match[1];
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(createOATextRun(part.slice(2, -2), baseStyle, { bold: true }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(createOATextRun(part.slice(1, -1), baseStyle, { italics: true }));
    } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      runs.push(createOATextRun(part, baseStyle));
    } else if (part.trim()) {
      runs.push(createOATextRun(part, baseStyle));
    }
  }
  return runs;
}

function parseListTokens(
  tokens: any[],
  startIndex: number,
  mapper: OAStyleMapper,
  isOrdered: boolean = false
): { listElements: Paragraph[]; nextIndex: number } {
  const listElements: Paragraph[] = [];
  let i = startIndex + 1; // skip list_open

  while (
    i < tokens.length &&
    tokens[i].type !== 'bullet_list_close' &&
    tokens[i].type !== 'ordered_list_close'
  ) {
    if (tokens[i].type === 'list_item_open') {
      i++; // skip list_item_open

      // 处理列表项内容
      let itemContent = '';

      while (i < tokens.length && tokens[i].type !== 'list_item_close') {
        if (tokens[i].type === 'paragraph_open') {
          i++; // skip paragraph_open
          if (tokens[i] && tokens[i].type === 'inline' && tokens[i].content) {
            itemContent += tokens[i].content;
          }
          i++; // skip inline
          i++; // skip paragraph_close
        } else if (
          tokens[i].type === 'bullet_list_open' ||
          tokens[i].type === 'ordered_list_open'
        ) {
          // 处理嵌套列表 - 暂时跳过，可以后续扩展
          const nestedIsOrdered = tokens[i].type === 'ordered_list_open';
          const { listElements: nestedElements, nextIndex } = parseListTokens(
            tokens,
            i,
            mapper,
            nestedIsOrdered
          );
          listElements.push(...nestedElements);
          i = nextIndex;
        } else {
          i++;
        }
      }

      if (itemContent.trim()) {
        const listStyle = mapper.getListStyle(isOrdered);
        const textRuns = parseInline(itemContent, listStyle);

        const listParagraph = createOAParagraph(textRuns, listStyle, {
          spacing: { after: DOCX_CONSTANTS.LIST_ITEM_SPACING }, // 列表项间距
          numbering: {
            reference: isOrdered ? 'numbered-list' : 'bullet-list',
            level: 0
          }
        });

        listElements.push(listParagraph);
      }

      i++; // skip list_item_close
    } else {
      i++;
    }
  }

  return { listElements, nextIndex: i + 1 }; // skip list_close
}

async function parseTableTokens(
  tokens: any[],
  startIndex: number,
  mapper: OAStyleMapper
): Promise<{ table: Table; nextIndex: number }> {
  const rows: TableRow[] = [];
  let i = startIndex + 1;
  let isFirstRow = true;

  while (i < tokens.length && tokens[i].type !== 'table_close') {
    if (tokens[i].type === 'tr_open') {
      const cells: TableCell[] = [];
      i++;
      while (i < tokens.length && tokens[i].type !== 'tr_close') {
        if (tokens[i].type === 'td_open' || tokens[i].type === 'th_open') {
          i++;
          let cellText = '';
          while (
            i < tokens.length &&
            tokens[i].type !== 'td_close' &&
            tokens[i].type !== 'th_close'
          ) {
            if (tokens[i].type === 'inline') {
              cellText += tokens[i].content;
            }
            i++;
          }

          const cellStyle = mapper.getTableCellStyle(isFirstRow);
          const cellParagraph = createOAParagraph(parseInline(cellText, cellStyle), cellStyle);

          const cell = new TableCell({
            children: [cellParagraph]
          });
          cells.push(cell);
          i++; // skip td_close or th_close
        } else {
          i++;
        }
      }
      rows.push(new TableRow({ children: cells }));
      i++; // skip tr_close
      isFirstRow = false;
    } else {
      i++;
    }
  }

  const table = new Table({
    rows,
    width: {
      size: DOCX_CONSTANTS.TABLE_WIDTH_PERCENTAGE,
      type: WidthType.PERCENTAGE
    }
  });

  return { table, nextIndex: i };
}

async function parseMarkdownToParagraphs(
  markdown: string,
  mapper: OAStyleMapper
): Promise<(Paragraph | Table)[]> {
  const md = new MarkdownIt();
  const tokens = md.parse(markdown, {});
  const elements: (Paragraph | Table)[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'heading_open') {
      const level = Number(token.tag.slice(1)); // h1 -> 1
      const inlineToken = tokens[i + 1];
      let children: TextRun[] = [];

      const headingStyle = mapper.getHeadingStyle(level);

      if (inlineToken?.type === 'inline' && inlineToken.children) {
        const childTokens = inlineToken.children;
        for (let j = 0; j < childTokens.length; j++) {
          const inline = childTokens[j];
          if (inline.type === 'text') {
            children.push(...parseInline(inline.content, headingStyle));
          } else if (inline.type === 'strong_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              children.push(createOATextRun(next.content, headingStyle, { bold: true }));
              j++;
            }
          } else if (inline.type === 'em_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              children.push(createOATextRun(next.content, headingStyle, { italics: true }));
              j++;
            }
          } else if (inline.type === 'code_inline') {
            children.push(
              createOATextRun(inline.content, headingStyle, {
                // 代码字体设置
              })
            );
          } else if (inline.type === 'link_open') {
            const linkText = childTokens[j + 1]?.content || '';
            const linkUrl = inline.attrGet('href') || '';
            children.push(createOATextRun(`[${linkText}](${linkUrl})`, headingStyle));
            j++;
          } else if (inline.type === 'image') {
            if (children.length > 0) {
              elements.push(createOAParagraph(children, headingStyle, { spacing: { after: 100 } }));
              children = [];
            }
            const alt = inline.attrGet('alt') || '';
            const src = inline.attrGet('src');
            if (src) {
              const imageMarkdown = `![${alt}](${src})`;
              const imageParagraph = await processImageFromText(imageMarkdown, mapper);
              if (imageParagraph) elements.push(imageParagraph);
            }
          }
        }
      }

      if (children.length > 0) {
        elements.push(
          createOAParagraph(children, headingStyle, {
            spacing: { after: DOCX_CONSTANTS.HEADING_SPACING_AFTER }
          })
        );
      }

      i += 2;
      continue;
    }

    if (token.type === 'fence') {
      const codeLines = token.content.split('\n');
      const codeStyle = mapper.getCodeBlockStyle();

      for (let k = 0; k < codeLines.length; k++) {
        const line = codeLines[k];
        const codeParagraph = createOAParagraph(
          [
            createOATextRun(line, codeStyle, {
              // 使用等宽字体
              size: DOCX_CONSTANTS.CODE_FONT_SIZE,
              color: DOCX_CONSTANTS.COLORS.CODE_TEXT
            })
          ],
          codeStyle,
          {
            shading: {
              type: 'clear',
              color: DOCX_CONSTANTS.COLORS.AUTO,
              fill: DOCX_CONSTANTS.COLORS.CODE_BACKGROUND
            },
            spacing:
              k === codeLines.length - 1
                ? { after: DOCX_CONSTANTS.HEADING_SPACING_AFTER }
                : { after: DOCX_CONSTANTS.CODE_LINE_SPACING },
            border:
              k === 0
                ? {
                    top: {
                      size: DOCX_CONSTANTS.BORDER_SIZE,
                      color: DOCX_CONSTANTS.COLORS.AUTO,
                      style: BorderStyle.SINGLE
                    },
                    left: {
                      size: DOCX_CONSTANTS.BORDER_SIZE,
                      color: DOCX_CONSTANTS.COLORS.AUTO,
                      style: BorderStyle.SINGLE
                    },
                    right: {
                      size: DOCX_CONSTANTS.BORDER_SIZE,
                      color: DOCX_CONSTANTS.COLORS.AUTO,
                      style: BorderStyle.SINGLE
                    }
                  }
                : k === codeLines.length - 1
                  ? {
                      bottom: {
                        size: DOCX_CONSTANTS.BORDER_SIZE,
                        color: DOCX_CONSTANTS.COLORS.AUTO,
                        style: BorderStyle.SINGLE
                      },
                      left: {
                        size: DOCX_CONSTANTS.BORDER_SIZE,
                        color: DOCX_CONSTANTS.COLORS.AUTO,
                        style: BorderStyle.SINGLE
                      },
                      right: {
                        size: DOCX_CONSTANTS.BORDER_SIZE,
                        color: DOCX_CONSTANTS.COLORS.AUTO,
                        style: BorderStyle.SINGLE
                      }
                    }
                  : {
                      left: {
                        size: DOCX_CONSTANTS.BORDER_SIZE,
                        color: DOCX_CONSTANTS.COLORS.AUTO,
                        style: BorderStyle.SINGLE
                      },
                      right: {
                        size: DOCX_CONSTANTS.BORDER_SIZE,
                        color: DOCX_CONSTANTS.COLORS.AUTO,
                        style: BorderStyle.SINGLE
                      }
                    }
          }
        );

        elements.push(codeParagraph);
      }

      continue;
    }

    if (token.type === 'paragraph_open') {
      const children: TextRun[] = [];
      const imageMarkdowns: string[] = [];

      const paragraphStyle = mapper.getParagraphStyle();

      const inlineToken = tokens[i + 1];
      if (inlineToken?.type === 'inline' && inlineToken.children) {
        const childTokens = inlineToken.children;
        for (let j = 0; j < childTokens.length; j++) {
          const inline = childTokens[j];

          if (inline.type === 'text') {
            children.push(...parseInline(inline.content, paragraphStyle));
          } else if (inline.type === 'strong_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              children.push(createOATextRun(next.content, paragraphStyle, { bold: true }));
              j++; // skip next
            }
          } else if (inline.type === 'em_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              children.push(createOATextRun(next.content, paragraphStyle, { italics: true }));
              j++;
            }
          } else if (inline.type === 'link_open') {
            const linkText = childTokens[j + 1]?.content || '';
            const linkUrl = inline.attrGet('href') || '';
            children.push(createOATextRun(`[${linkText}](${linkUrl})`, paragraphStyle));
            j++;
          } else if (inline.type === 'image') {
            const alt = inline.attrGet('alt') || '';
            const src = inline.attrGet('src');
            if (src) {
              imageMarkdowns.push(`![${alt}](${src})`);
            }
          }
        }
      }

      if (children.length > 0) {
        elements.push(
          createOAParagraph(children, paragraphStyle, {
            spacing: { after: DOCX_CONSTANTS.PARAGRAPH_SPACING_AFTER }
          })
        );
      }

      for (const imgMd of imageMarkdowns) {
        const imageParagraph = await processImageFromText(imgMd, mapper);
        if (imageParagraph) {
          elements.push(imageParagraph);
        }
      }

      i += 2; // skip inline and paragraph_close
      continue;
    }

    // 处理列表
    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const isOrdered = token.type === 'ordered_list_open';
      const { listElements, nextIndex } = parseListTokens(tokens, i, mapper, isOrdered);
      elements.push(...listElements);
      i = nextIndex;
      continue;
    }

    if (token.type === 'table_open') {
      const { table, nextIndex } = await parseTableTokens(tokens, i, mapper);
      elements.push(table);
      i = nextIndex;
      continue;
    }

    if (token.type === 'inline' && token.children) {
      for (const child of token.children) {
        if (child.type === 'image') {
          const imageMarkdown = `![${child.attrGet('alt') || ''}](${child.attrGet('src')})`;
          const imageParagraph = await processImageFromText(imageMarkdown, mapper);
          if (imageParagraph) elements.push(imageParagraph);
        }
      }
    }
  }

  return elements;
}

// 缓存模板读取器和样式映射器以提高性能
let cachedReader: OATemplateReader | null = null;
let cachedMapper: OAStyleMapper | null = null;

/**
 * 清理测试文件目录，保持文件数量在限制内
 * @param directory 目录路径
 * @param maxFiles 最大文件数
 */
async function cleanupTestFiles(directory: string, maxFiles: number): Promise<void> {
  try {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(directory)) {
      return;
    }

    const files = fs
      .readdirSync(directory)
      .filter((file: string) => file.endsWith('.docx') && file.startsWith('test-output-'))
      .map((file: string) => ({
        name: file,
        path: path.join(directory, file),
        stats: fs.statSync(path.join(directory, file))
      }))
      .sort((a: any, b: any) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

    // 删除超过限制的旧文件
    if (files.length > maxFiles) {
      const filesToDelete = files.slice(maxFiles);
      for (const file of filesToDelete) {
        try {
          fs.unlinkSync(file.path);
          console.log(`🗑️ 已删除旧测试文件: ${file.name}`);
        } catch (error) {
          console.warn(`⚠️ 删除测试文件失败: ${file.name}`, error);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ 清理测试文件时出错:', error);
  }
}

export async function oaDocxTool(
  params: z.infer<typeof InputType>
): Promise<z.infer<typeof OutputType>> {
  const { markdown } = params;
  const startTime = Date.now();

  // 获取配置管理器
  const configManager = getConfig();
  const config = configManager.getConfig();

  // 验证配置
  const configValidation = configManager.validateConfig();
  if (!configValidation.isValid) {
    console.warn('⚠️ 配置验证失败，使用默认配置:', configValidation.errors);
  }

  // 设置语言
  if (config.i18n.autoDetect) {
    autoDetectLanguage();
  } else {
    I18n.setLanguage(config.i18n.defaultLanguage as SupportedLanguage);
  }

  // 安全验证和过滤输入内容（根据配置启用/禁用）
  let sanitizedMarkdown = markdown;
  if (config.security.enableContentFiltering) {
    try {
      sanitizedMarkdown = ContentSecurityFilter.sanitizeMarkdown(markdown);

      // 检查敏感内容并记录警告
      const sensitiveCheck = ContentSecurityFilter.containsSensitiveContent(markdown);
      if (sensitiveCheck.hasSensitive) {
        console.warn(
          `⚠️ ${t('SENSITIVE_CONTENT_DETECTED', { patterns: sensitiveCheck.patterns.join(', ') })}`
        );
      }
    } catch (error) {
      console.error(`❌ ${t('CONVERSION_FAILED')}:`, error);
      throw error;
    }
  }

  const defaultTemplatePath = path.join(__dirname, '../../templates/oa_template.docx');

  // 检查模板文件是否存在
  if (!OATemplateReader.exists(defaultTemplatePath)) {
    console.warn(`⚠️ ${t('TEMPLATE_NOT_FOUND')}`);
    // 降级到普通DOCX转换
    const { docxTool } = await import('./docx');
    return docxTool({ markdown });
  }

  try {
    // 使用缓存的读取器和映射器（根据配置启用/禁用缓存）
    const cacheConfig = configManager.getCacheConfig();
    let reader = cacheConfig.enabled ? cachedReader : null;
    let mapper = cacheConfig.enabled ? cachedMapper : null;

    if (!reader) {
      console.log(`📋 ${t('TEMPLATE_LOADING')}`);
      reader = await createOATemplateReader(defaultTemplatePath);
      if (cacheConfig.enabled) {
        cachedReader = reader;
      }
    }

    if (!mapper) {
      console.log(`🎨 ${t('STYLE_MAPPING')}`);
      mapper = await createOAStyleMapper(reader, {
        enableLogging: config.logging.level !== 'silent'
      });
      if (cacheConfig.enabled) {
        cachedMapper = mapper;
      }
    }

    console.log(`📄 ${t('MARKDOWN_CONVERTING')}`);
    const parseStartTime = Date.now();
    const elements = await parseMarkdownToParagraphs(sanitizedMarkdown, mapper);
    const parseTime = Date.now() - parseStartTime;
    console.log(`   解析耗时: ${parseTime}ms`);

    // 获取页面设置
    const pageSettings = reader.getPageSettings();

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'bullet-list',
            levels: [
              {
                level: 0,
                format: 'bullet',
                text: '•',
                alignment: 'left',
                style: {
                  paragraph: {
                    indent: {
                      left: DOCX_CONSTANTS.LIST_INDENT_LEFT,
                      hanging: DOCX_CONSTANTS.LIST_INDENT_HANGING
                    },
                    spacing: { after: DOCX_CONSTANTS.CODE_LINE_SPACING }
                  }
                }
              }
            ]
          },
          {
            reference: 'numbered-list',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: 'left',
                style: {
                  paragraph: {
                    indent: {
                      left: DOCX_CONSTANTS.LIST_INDENT_LEFT,
                      hanging: DOCX_CONSTANTS.LIST_INDENT_HANGING
                    },
                    spacing: { after: DOCX_CONSTANTS.CODE_LINE_SPACING }
                  }
                }
              }
            ]
          }
        ]
      },
      sections: [
        {
          properties: pageSettings
            ? {
                page: {
                  size: {
                    width: pageSettings.width * DOCX_CONSTANTS.TWIPS_CONVERSION.MM_MULTIPLIER, // mm转twips
                    height: pageSettings.height * DOCX_CONSTANTS.TWIPS_CONVERSION.MM_MULTIPLIER
                  },
                  margin: {
                    top: pageSettings.margins.top * DOCX_CONSTANTS.TWIPS_CONVERSION.MM_MULTIPLIER,
                    right:
                      pageSettings.margins.right * DOCX_CONSTANTS.TWIPS_CONVERSION.MM_MULTIPLIER,
                    bottom:
                      pageSettings.margins.bottom * DOCX_CONSTANTS.TWIPS_CONVERSION.MM_MULTIPLIER,
                    left: pageSettings.margins.left * DOCX_CONSTANTS.TWIPS_CONVERSION.MM_MULTIPLIER
                  }
                }
              }
            : {},
          children: elements
        }
      ]
    });

    console.log(`💾 ${t('DOCX_GENERATING')}`);
    const docBuffer = await Packer.toBuffer(doc);

    // 将模板的 styles.xml 覆盖到新生成的文档中，确保使用模板样式定义
    const newZip = new PizZip(docBuffer);

    // 读取模板的 styles.xml（必须存在）
    const templateBin = fs.readFileSync(defaultTemplatePath);
    const templateZip = new PizZip(templateBin);
    const templateStyles = templateZip.file('word/styles.xml')?.asText();

    if (!templateStyles) {
      console.warn('⚠️ 模板缺少 word/styles.xml，将直接使用生成样式');
    } else {
      newZip.file('word/styles.xml', templateStyles);
    }

    // 重新导出最终 DOCX（包含模板样式 + 生成的正文/媒体/关系）
    const finalBuffer = newZip.generate({ type: 'nodebuffer' });
    const filename = ContentSecurityFilter.sanitizeFileName(`markdown-to-oa-${Date.now()}.docx`);

    // 检查测试模式配置
    const testConfig = configManager.getTestConfig();
    if (testConfig.shouldSaveLocally) {
      // 测试模式：根据配置处理
      const testOutputDir = testConfig.outputPath;
      const testOutputPath = path.join(__dirname, testOutputDir, `test-output-${Date.now()}.docx`);

      // 确保输出目录存在
      const fs = require('fs');
      const outputDir = path.dirname(testOutputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(testOutputPath, finalBuffer);
      console.log(`📁 ${t('TEST_MODE_SAVED', { path: testOutputPath })}`);

      // 清理旧文件（如果配置了文件数量限制）
      if (!testConfig.keepFiles) {
        await cleanupTestFiles(outputDir, testConfig.maxFiles);
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ ${t('CONVERSION_SUCCESS', { time: totalTime })}`);
      return { url: `file://${testOutputPath}` };
    } else {
      // 正常模式：上传到服务器
      const result = await uploadFile({
        buffer: Buffer.from(finalBuffer),
        defaultFilename: filename
      });

      if (!result.accessUrl) {
        return Promise.reject(t('UPLOAD_FAILED'));
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ ${t('CONVERSION_SUCCESS', { time: totalTime })}`);
      return { url: result.accessUrl };
    }
  } catch (error) {
    console.error(`❌ ${t('CONVERSION_FAILED')}:`, error);
    console.warn(`⚠️ ${t('FALLBACK_TO_NORMAL')}`);

    // 降级到普通DOCX转换
    const { docxTool } = await import('./docx');
    return docxTool({ markdown });
  }
}
