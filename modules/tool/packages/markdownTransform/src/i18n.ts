/**
 * 国际化支持模块 - 提供多语言错误信息和用户提示
 */

/**
 * 支持的语言类型
 */
export type SupportedLanguage = 'zh-CN' | 'en' | 'zh-TW' | 'ja' | 'ko';

/**
 * 错误信息键值类型
 */
export type MessageKey =
  | 'TEMPLATE_NOT_FOUND'
  | 'TEMPLATE_LOAD_FAILED'
  | 'INVALID_MARKDOWN_CONTENT'
  | 'MARKDOWN_TOO_LARGE'
  | 'TOO_MANY_IMAGES'
  | 'TOO_MANY_TABLES'
  | 'UNSAFE_URL_BLOCKED'
  | 'IMAGE_LOAD_FAILED'
  | 'CONVERSION_FAILED'
  | 'UPLOAD_FAILED'
  | 'STYLE_MAPPING_FAILED'
  | 'SENSITIVE_CONTENT_DETECTED'
  | 'INVALID_URL_FORMAT'
  | 'UNSUPPORTED_PROTOCOL'
  | 'BLACKLISTED_DOMAIN'
  | 'UNTRUSTED_DOMAIN_WARNING'
  | 'TEMPLATE_LOADING'
  | 'STYLE_MAPPING'
  | 'MARKDOWN_CONVERTING'
  | 'DOCX_GENERATING'
  | 'CONVERSION_SUCCESS'
  | 'TEST_MODE_SAVED'
  | 'FALLBACK_TO_NORMAL';

/**
 * 多语言消息映射
 */
const MESSAGES: Record<SupportedLanguage, Record<MessageKey, string>> = {
  'zh-CN': {
    TEMPLATE_NOT_FOUND: '未找到 oa_template.docx 文件，使用普通格式生成 DOCX 文件',
    TEMPLATE_LOAD_FAILED: 'OA模板加载失败',
    INVALID_MARKDOWN_CONTENT: '无效的 Markdown 内容：必须是非空字符串',
    MARKDOWN_TOO_LARGE: 'Markdown 内容过大。最大限制：{maxSize}MB',
    TOO_MANY_IMAGES: '图片数量过多。最大允许：{maxCount}',
    TOO_MANY_TABLES: '表格数量过多。最大允许：{maxCount}',
    UNSAFE_URL_BLOCKED: '图片已阻止：不安全的URL',
    IMAGE_LOAD_FAILED: '图片加载失败：{src}',
    CONVERSION_FAILED: 'OA格式转换失败',
    UPLOAD_FAILED: '上传失败：返回结果中没有访问URL',
    STYLE_MAPPING_FAILED: '样式映射失败：{elementType} - 未找到匹配样式，将使用回退样式',
    SENSITIVE_CONTENT_DETECTED: '检测到潜在敏感内容：{patterns}',
    INVALID_URL_FORMAT: '无效的URL格式：{url}',
    UNSUPPORTED_PROTOCOL: '已阻止不支持的协议URL：{protocol}',
    BLACKLISTED_DOMAIN: '已阻止来自黑名单域名的URL：{domain}',
    UNTRUSTED_DOMAIN_WARNING: '来自不受信任域名的URL：{hostname} （允许但建议谨慎）',
    TEMPLATE_LOADING: '正在加载OA模板...',
    STYLE_MAPPING: '正在创建样式映射...',
    MARKDOWN_CONVERTING: '正在转换Markdown内容...',
    DOCX_GENERATING: '正在生成DOCX文件...',
    CONVERSION_SUCCESS: 'OA格式DOCX文件生成完成，总耗时：{time}ms',
    TEST_MODE_SAVED: '测试模式：文件已保存到 {path}',
    FALLBACK_TO_NORMAL: '降级到普通格式生成 DOCX 文件'
  },

  en: {
    TEMPLATE_NOT_FOUND: 'oa_template.docx file not found, generating DOCX in normal format',
    TEMPLATE_LOAD_FAILED: 'Failed to load OA template',
    INVALID_MARKDOWN_CONTENT: 'Invalid markdown content: must be a non-empty string',
    MARKDOWN_TOO_LARGE: 'Markdown content too large. Maximum size: {maxSize}MB',
    TOO_MANY_IMAGES: 'Too many images. Maximum allowed: {maxCount}',
    TOO_MANY_TABLES: 'Too many tables. Maximum allowed: {maxCount}',
    UNSAFE_URL_BLOCKED: 'Image blocked: Unsafe URL',
    IMAGE_LOAD_FAILED: 'Failed to load image: {src}',
    CONVERSION_FAILED: 'OA format conversion failed',
    UPLOAD_FAILED: 'Upload failed: No access URL in result',
    STYLE_MAPPING_FAILED:
      'Style mapping failed: {elementType} - No matching style found, using fallback',
    SENSITIVE_CONTENT_DETECTED: 'Detected potentially sensitive content: {patterns}',
    INVALID_URL_FORMAT: 'Invalid URL format: {url}',
    UNSUPPORTED_PROTOCOL: 'Blocked URL with unsupported protocol: {protocol}',
    BLACKLISTED_DOMAIN: 'Blocked URL from blacklisted domain: {domain}',
    UNTRUSTED_DOMAIN_WARNING: 'URL from untrusted domain: {hostname} (allowed but use caution)',
    TEMPLATE_LOADING: 'Loading OA template...',
    STYLE_MAPPING: 'Creating style mapping...',
    MARKDOWN_CONVERTING: 'Converting Markdown content...',
    DOCX_GENERATING: 'Generating DOCX file...',
    CONVERSION_SUCCESS: 'OA format DOCX file generated successfully, total time: {time}ms',
    TEST_MODE_SAVED: 'Test mode: File saved to {path}',
    FALLBACK_TO_NORMAL: 'Falling back to normal format DOCX generation'
  },

  'zh-TW': {
    TEMPLATE_NOT_FOUND: '未找到 oa_template.docx 檔案，使用普通格式生成 DOCX 檔案',
    TEMPLATE_LOAD_FAILED: 'OA模板載入失敗',
    INVALID_MARKDOWN_CONTENT: '無效的 Markdown 內容：必須是非空字符串',
    MARKDOWN_TOO_LARGE: 'Markdown 內容過大。最大限制：{maxSize}MB',
    TOO_MANY_IMAGES: '圖片數量過多。最大允許：{maxCount}',
    TOO_MANY_TABLES: '表格數量過多。最大允許：{maxCount}',
    UNSAFE_URL_BLOCKED: '圖片已阻止：不安全的URL',
    IMAGE_LOAD_FAILED: '圖片載入失敗：{src}',
    CONVERSION_FAILED: 'OA格式轉換失敗',
    UPLOAD_FAILED: '上傳失敗：返回結果中沒有訪問URL',
    STYLE_MAPPING_FAILED: '樣式映射失敗：{elementType} - 未找到匹配樣式，將使用回退樣式',
    SENSITIVE_CONTENT_DETECTED: '檢測到潛在敏感內容：{patterns}',
    INVALID_URL_FORMAT: '無效的URL格式：{url}',
    UNSUPPORTED_PROTOCOL: '已阻止不支持的協議URL：{protocol}',
    BLACKLISTED_DOMAIN: '已阻止來自黑名單域名的URL：{domain}',
    UNTRUSTED_DOMAIN_WARNING: '來自不受信任域名的URL：{hostname} （允許但建議謹慎）',
    TEMPLATE_LOADING: '正在載入OA模板...',
    STYLE_MAPPING: '正在創建樣式映射...',
    MARKDOWN_CONVERTING: '正在轉換Markdown內容...',
    DOCX_GENERATING: '正在生成DOCX檔案...',
    CONVERSION_SUCCESS: 'OA格式DOCX檔案生成完成，總耗時：{time}ms',
    TEST_MODE_SAVED: '測試模式：檔案已保存到 {path}',
    FALLBACK_TO_NORMAL: '降級到普通格式生成 DOCX 檔案'
  },

  ja: {
    TEMPLATE_NOT_FOUND:
      'oa_template.docxファイルが見つかりません。通常フォーマットでDOCXを生成します',
    TEMPLATE_LOAD_FAILED: 'OAテンプレートの読み込みに失敗しました',
    INVALID_MARKDOWN_CONTENT: '無効なMarkdownコンテンツ：空でない文字列である必要があります',
    MARKDOWN_TOO_LARGE: 'Markdownコンテンツが大きすぎます。最大制限：{maxSize}MB',
    TOO_MANY_IMAGES: '画像が多すぎます。最大許可数：{maxCount}',
    TOO_MANY_TABLES: 'テーブルが多すぎます。最大許可数：{maxCount}',
    UNSAFE_URL_BLOCKED: '画像をブロック：安全でないURL',
    IMAGE_LOAD_FAILED: '画像の読み込みに失敗：{src}',
    CONVERSION_FAILED: 'OAフォーマット変換に失敗しました',
    UPLOAD_FAILED: 'アップロードに失敗：結果にアクセスURLがありません',
    STYLE_MAPPING_FAILED:
      'スタイルマッピングに失敗：{elementType} - 一致するスタイルが見つかりません、フォールバックを使用します',
    SENSITIVE_CONTENT_DETECTED: '潜在的に機密のコンテンツを検出：{patterns}',
    INVALID_URL_FORMAT: '無効なURL形式：{url}',
    UNSUPPORTED_PROTOCOL: 'サポートされていないプロトコルのURLをブロック：{protocol}',
    BLACKLISTED_DOMAIN: 'ブラックリストドメインからのURLをブロック：{domain}',
    UNTRUSTED_DOMAIN_WARNING:
      '信頼できないドメインからのURL：{hostname} （許可されていますが注意してください）',
    TEMPLATE_LOADING: 'OAテンプレートを読み込み中...',
    STYLE_MAPPING: 'スタイルマッピングを作成中...',
    MARKDOWN_CONVERTING: 'Markdownコンテンツを変換中...',
    DOCX_GENERATING: 'DOCXファイルを生成中...',
    CONVERSION_SUCCESS: 'OAフォーマットDOCXファイルの生成が完了しました、合計時間：{time}ms',
    TEST_MODE_SAVED: 'テストモード：ファイルは {path} に保存されました',
    FALLBACK_TO_NORMAL: '通常フォーマットのDOCX生成にフォールバック'
  },

  ko: {
    TEMPLATE_NOT_FOUND: 'oa_template.docx 파일을 찾을 수 없습니다. 일반 형식으로 DOCX를 생성합니다',
    TEMPLATE_LOAD_FAILED: 'OA 템플릿 로드 실패',
    INVALID_MARKDOWN_CONTENT: '잘못된 Markdown 콘텐츠: 비어있지 않은 문자열이어야 합니다',
    MARKDOWN_TOO_LARGE: 'Markdown 콘텐츠가 너무 큽니다. 최대 제한: {maxSize}MB',
    TOO_MANY_IMAGES: '이미지가 너무 많습니다. 최대 허용: {maxCount}',
    TOO_MANY_TABLES: '테이블이 너무 많습니다. 최대 허용: {maxCount}',
    UNSAFE_URL_BLOCKED: '이미지 차단됨: 안전하지 않은 URL',
    IMAGE_LOAD_FAILED: '이미지 로드 실패: {src}',
    CONVERSION_FAILED: 'OA 형식 변환 실패',
    UPLOAD_FAILED: '업로드 실패: 결과에 액세스 URL이 없음',
    STYLE_MAPPING_FAILED:
      '스타일 매핑 실패: {elementType} - 일치하는 스타일을 찾을 수 없음, 폴백 사용',
    SENSITIVE_CONTENT_DETECTED: '잠재적으로 민감한 콘텐츠 감지: {patterns}',
    INVALID_URL_FORMAT: '잘못된 URL 형식: {url}',
    UNSUPPORTED_PROTOCOL: '지원되지 않는 프로토콜 URL 차단: {protocol}',
    BLACKLISTED_DOMAIN: '블랙리스트 도메인의 URL 차단: {domain}',
    UNTRUSTED_DOMAIN_WARNING: '신뢰할 수 없는 도메인의 URL: {hostname} (허용되지만 주의 필요)',
    TEMPLATE_LOADING: 'OA 템플릿 로드 중...',
    STYLE_MAPPING: '스타일 매핑 생성 중...',
    MARKDOWN_CONVERTING: 'Markdown 콘텐츠 변환 중...',
    DOCX_GENERATING: 'DOCX 파일 생성 중...',
    CONVERSION_SUCCESS: 'OA 형식 DOCX 파일 생성 완료, 총 시간: {time}ms',
    TEST_MODE_SAVED: '테스트 모드: 파일이 {path}에 저장됨',
    FALLBACK_TO_NORMAL: '일반 형식 DOCX 생성으로 폴백'
  }
};

/**
 * 当前语言设置（默认为中文）
 */
let currentLanguage: SupportedLanguage = 'zh-CN';

/**
 * 国际化工具类
 */
export class I18n {
  /**
   * 设置当前语言
   * @param language 语言代码
   */
  static setLanguage(language: SupportedLanguage): void {
    currentLanguage = language;
  }

  /**
   * 获取当前语言
   * @returns 当前语言代码
   */
  static getCurrentLanguage(): SupportedLanguage {
    return currentLanguage;
  }

  /**
   * 获取消息文本
   * @param key 消息键
   * @param params 参数对象，用于替换消息中的占位符
   * @returns 格式化后的消息文本
   */
  static getMessage(key: MessageKey, params: Record<string, any> = {}): string {
    const messages = MESSAGES[currentLanguage];
    let message = messages[key] || messages['CONVERSION_FAILED'];

    // 替换占位符
    for (const [paramKey, paramValue] of Object.entries(params)) {
      message = message.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    }

    return message;
  }

  /**
   * 获取所有支持的语言
   * @returns 支持的语言列表
   */
  static getSupportedLanguages(): SupportedLanguage[] {
    return Object.keys(MESSAGES) as SupportedLanguage[];
  }

  /**
   * 检查是否支持指定语言
   * @param language 语言代码
   * @returns 是否支持
   */
  static isLanguageSupported(language: string): language is SupportedLanguage {
    return language in MESSAGES;
  }

  /**
   * 根据环境或Accept-Language头自动检测语言
   * @param acceptLanguage Accept-Language头值（可选）
   * @returns 检测到的语言
   */
  static detectLanguage(acceptLanguage?: string): SupportedLanguage {
    // 优先使用环境变量
    const envLang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL;
    if (envLang) {
      if (envLang.includes('zh_CN') || envLang.includes('zh-CN')) return 'zh-CN';
      if (envLang.includes('zh_TW') || envLang.includes('zh-TW')) return 'zh-TW';
      if (envLang.includes('ja') || envLang.includes('jp')) return 'ja';
      if (envLang.includes('ko') || envLang.includes('kr')) return 'ko';
      if (envLang.includes('en')) return 'en';
    }

    // 使用Accept-Language头
    if (acceptLanguage) {
      const languages = acceptLanguage
        .split(',')
        .map((lang) => lang.split(';')[0].trim().toLowerCase());

      for (const lang of languages) {
        if (lang.includes('zh-cn')) return 'zh-CN';
        if (lang.includes('zh-tw')) return 'zh-TW';
        if (lang.includes('ja')) return 'ja';
        if (lang.includes('ko')) return 'ko';
        if (lang.includes('en')) return 'en';
      }
    }

    // 默认返回中文
    return 'zh-CN';
  }
}

/**
 * 便捷函数：获取国际化消息
 * @param key 消息键
 * @param params 参数对象
 * @returns 格式化后的消息
 */
export function t(key: MessageKey, params: Record<string, any> = {}): string {
  return I18n.getMessage(key, params);
}

/**
 * 便捷函数：设置语言
 * @param language 语言代码
 */
export function setLanguage(language: SupportedLanguage): void {
  I18n.setLanguage(language);
}

/**
 * 便捷函数：自动检测并设置语言
 * @param acceptLanguage Accept-Language头值（可选）
 */
export function autoDetectLanguage(acceptLanguage?: string): void {
  const detectedLang = I18n.detectLanguage(acceptLanguage);
  I18n.setLanguage(detectedLang);
}
