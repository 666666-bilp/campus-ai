const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, PageBreak, Footer, PageNumber,
  TableOfContents, convertMillimetersToTwip, LineRuleType,
} = require('docx');

// ==================== 排版常量 ====================

const FONT_BODY = 'SimSun';
const FONT_HEADING = 'SimHei';
const FONT_ENGLISH = 'Times New Roman';

const SIZE_COVER_TITLE = 36;   // 小二号 18pt
const SIZE_H1 = 32;            // 三号 16pt
const SIZE_H2 = 28;            // 四号 14pt
const SIZE_H3 = 24;            // 小四号 12pt
const SIZE_BODY = 24;          // 小四号 12pt
const SIZE_COVER_INFO = 28;    // 四号 14pt
const SIZE_REF = 21;           // 五号 10.5pt

const LINE_HEIGHT_15 = 360;
const LINE_HEIGHT_20 = 480;

const MARGIN_TOP = convertMillimetersToTwip(25);
const MARGIN_BOTTOM = convertMillimetersToTwip(25);
const MARGIN_LEFT = convertMillimetersToTwip(30);
const MARGIN_RIGHT = convertMillimetersToTwip(25);

const FIRST_LINE_INDENT = convertMillimetersToTwip(7.5);

// ==================== Markdown → Word 转换核心 ====================

/**
 * 解析一行中的内联 Markdown：**粗体**、*斜体*
 * 返回 TextRun 数组
 */
function parseInlineRuns(text) {
  if (!text) return [new TextRun({ text: '', font: { ascii: FONT_ENGLISH, eastAsia: FONT_BODY }, size: SIZE_BODY })];

  const runs = [];
  // 匹配 **粗体** 或 *斜体*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIdx = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    // 匹配前的普通文本
    if (m.index > lastIdx) {
      runs.push(makeRun(text.slice(lastIdx, m.index), false, false));
    }
    if (m[1]) {
      // **粗体**
      runs.push(makeRun(m[2], true, false));
    } else if (m[3]) {
      // *斜体*
      runs.push(makeRun(m[4], false, true));
    }
    lastIdx = m.index + m[0].length;
  }

  // 剩余文本
  if (lastIdx < text.length) {
    runs.push(makeRun(text.slice(lastIdx), false, false));
  }

  return runs.length > 0 ? runs : [makeRun(text, false, false)];
}

function makeRun(text, bold, italics) {
  return new TextRun({
    text,
    font: { ascii: FONT_ENGLISH, eastAsia: FONT_BODY },
    size: SIZE_BODY,
    bold,
    italics,
  });
}

function makeRefRun(text) {
  return new TextRun({
    text,
    font: { ascii: FONT_ENGLISH, eastAsia: FONT_BODY },
    size: SIZE_REF,
  });
}

function makeHeadingRun(text, size) {
  return new TextRun({
    text,
    font: { ascii: FONT_ENGLISH, eastAsia: FONT_HEADING },
    size,
    bold: true,
  });
}

/** 检测一行是否是 Markdown 标题，返回 { level: 1|2|3, text: string } 或 null */
function matchHeading(line) {
  const m = line.match(/^#{1,3}\s+(.+)/);
  if (!m) return null;
  return { level: m[0].startsWith('###') ? 3 : m[0].startsWith('##') ? 2 : 1, text: m[1].trim() };
}

/** 检测一行是否是 Markdown 无序列表 */
function matchBullet(line) {
  const m = line.match(/^[\-\*]\s+(.+)/);
  return m ? m[1].trim() : null;
}

/** 检测一行是否是数字编号列表（含中文数字） */
function matchNumbered(line) {
  const m = line.match(/^(\d+[\.\)、]\s*|（[一二三四五六七八九十]+）|\(?\d+\))\s*(.+)/);
  return m ? { prefix: m[1], text: m[2].trim() } : null;
}

/**
 * 将内容文本（可能是 markdown 或纯文本）按行解析为 Word Paragraph 数组。
 * 处理标题、列表、粗体等。
 */
function contentToParagraphs(contentText, options = {}) {
  if (!contentText || !contentText.trim()) return [];
  const lines = contentText.split('\n');
  const paragraphs = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i].trim();

    // 跳过空行
    if (!line) {
      // 如果上一段不是空行，加一个段间距
      if (paragraphs.length > 0 && !(paragraphs[paragraphs.length - 1] instanceof Paragraph === false)) {
        // 不额外插入空段落，靠段落 spacing 控制
      }
      i++;
      continue;
    }

    // 去除行内 ## 标记（AI 有时在正文中使用）
    line = line.replace(/^#{1,3}\s+/g, '');

    // 标题检测
    const heading = matchHeading(lines[i]);
    if (heading && heading.text.length < 50) {
      const level = options.headingLevel || heading.level;
      const size = level === 1 ? SIZE_H1 : level === 2 ? SIZE_H2 : SIZE_H3;
      const hLevel = level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      paragraphs.push(new Paragraph({
        alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 200, after: 100, line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
        heading: hLevel,
        children: [makeHeadingRun(heading.text, size)],
      }));
      i++;
      continue;
    }

    // 无序列表 — 去掉圆点，改为普通正文段落
    const bulletText = matchBullet(lines[i]);
    if (bulletText) {
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
        indent: { firstLine: FIRST_LINE_INDENT },
        children: parseInlineRuns(bulletText),
      }));
      i++;
      continue;
    }

    // 数字编号列表 — 保留编号，正文样式
    const numbered = matchNumbered(line);
    if (numbered) {
      const fullText = `${numbered.prefix} ${numbered.text}`;
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
        indent: { firstLine: FIRST_LINE_INDENT },
        children: parseInlineRuns(fullText),
      }));
      i++;
      continue;
    }

    // 普通段落 — 收集连续的非特殊行，合并为一个段落
    let paraLines = [line];
    i++;
    while (i < lines.length) {
      const nl = lines[i].trim();
      if (!nl || matchHeading(lines[i]) || matchBullet(lines[i]) || matchNumbered(nl)) break;
      paraLines.push(nl);
      i++;
    }

    // 拼接段落文本，将行内 ** 和 * 保留用于 inline 解析
    const paraText = paraLines.join(' ');
    if (paraText.trim()) {
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
        indent: { firstLine: FIRST_LINE_INDENT },
        children: parseInlineRuns(paraText),
      }));
    }
  }

  return paragraphs;
}

// ==================== 辅助函数 ====================

function emptyLine() {
  return new Paragraph({ spacing: { line: LINE_HEIGHT_15 }, children: [] });
}

function centeredParagraph(text, size, font, bold = false) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_HEIGHT_20, lineRule: LineRuleType.AUTO },
    children: [
      new TextRun({
        text,
        font: { ascii: FONT_ENGLISH, eastAsia: font || FONT_BODY },
        size,
        bold,
      }),
    ],
  });
}

/** 用于分隔 `## 章节名` 的大标题 */
function sectionHeading(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100, line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
    heading: HeadingLevel.HEADING_1,
    children: [makeHeadingRun(text, SIZE_H1)],
  });
}

/** 从 fullText 中提取指定章节内容（更鲁棒的匹配） */
function extractSectionContent(fullText, patterns) {
  if (!fullText) return '';
  const lines = fullText.split('\n');
  let inSection = false;
  let content = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // 检查是否匹配目标章节
    for (const pattern of patterns) {
      if (trimmed.match(new RegExp(`^#{1,3}\\s+.*${pattern}`)) || trimmed.match(new RegExp(`^.*${pattern}[：:]*$`))) {
        inSection = true;
        content = [];
        break;
      }
    }
    // 检查是否是下一个章节（结束当前章节）
    if (inSection && trimmed.match(/^#{1,3}\s+/) && !patterns.some(p => trimmed.includes(p))) {
      break;
    }
    if (inSection && trimmed && !trimmed.match(/^#{1,3}\s+/)) {
      content.push(line);
    }
  }
  return content.join('\n').trim();
}

/** 从 fullText 提取章节标题和内容 */
function parseAllSections(fullText) {
  if (!fullText) return [];
  const lines = fullText.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const h = matchHeading(line);
    if (h) {
      if (current) sections.push(current);
      current = { heading: h.text, level: h.level, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

// ==================== 主文档生成 ====================

async function generateWordDocument(paper) {
  const fullText = paper.fullText || '';
  const allSections = parseAllSections(fullText);

  function findContent(...keywords) {
    for (const kw of keywords) {
      for (const s of allSections) {
        if (s.heading.includes(kw)) return s.lines.join('\n').trim();
      }
    }
    return '';
  }

  const abstractCN = paper.content?.abstract || findContent('摘要');
  const keywordsCN = paper.content?.keywords?.length
    ? paper.content.keywords.join('；')
    : '';
  const abstractEN = findContent('Abstract');
  const keywordsEN = findContent('Keywords');
  const introduction = paper.content?.introduction || findContent('绪论', '引言', 'Introduction');
  const conclusion = paper.content?.conclusion || findContent('结论', '总结', 'Conclusion');
  const acknowledgments = findContent('致谢', 'Acknowledgments');
  const referencesRaw = findContent('参考文献', 'References');

  // 识别正文章节（排除摘要/绪论/结论/致谢/参考文献等）
  const metaSet = new Set(['摘要', 'Abstract', '关键词', 'Keywords', '绪论', '引言', 'Introduction',
    '结论', '总结', 'Conclusion', '致谢', 'Acknowledgments', '参考文献', 'References', '目录']);

  const bodySections = allSections.filter(s => {
    if (!s.heading) return false;
    return ![...metaSet].some(kw => s.heading.includes(kw));
  });

  // ---------- 封面 ----------
  const coverChildren = [];
  for (let i = 0; i < 6; i++) coverChildren.push(emptyLine());
  coverChildren.push(centeredParagraph('毕业论文', SIZE_COVER_TITLE, FONT_HEADING, true));
  coverChildren.push(emptyLine());
  coverChildren.push(centeredParagraph(paper.title || paper.topic || '', SIZE_COVER_TITLE, FONT_HEADING, true));
  coverChildren.push(emptyLine());
  coverChildren.push(emptyLine());
  coverChildren.push(centeredParagraph(`专　　　业：${paper.major || '___________'}`, SIZE_COVER_INFO, FONT_BODY));
  coverChildren.push(centeredParagraph(`论文类型：${paper.paperType || '毕业论文'}`, SIZE_COVER_INFO, FONT_BODY));
  coverChildren.push(centeredParagraph(`目标字数：${paper.wordCount || 0} 字`, SIZE_COVER_INFO, FONT_BODY));
  coverChildren.push(emptyLine());
  coverChildren.push(emptyLine());
  coverChildren.push(centeredParagraph(new Date().toISOString().slice(0, 10), SIZE_COVER_INFO, FONT_BODY));

  // ---------- 正文 ----------
  const main = [];

  // 中文摘要
  main.push(sectionHeading('摘  要'));
  main.push(...contentToParagraphs(abstractCN));
  main.push(emptyLine());
  if (keywordsCN) {
    main.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: LINE_HEIGHT_15 },
      indent: { firstLine: FIRST_LINE_INDENT },
      children: [makeRun(`关键词：${keywordsCN}`, true, false)],
    }));
    main.push(emptyLine());
  }

  // 英文摘要
  if (abstractEN) {
    main.push(sectionHeading('Abstract'));
    main.push(...contentToParagraphs(abstractEN));
    main.push(emptyLine());
    if (keywordsEN) {
      main.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LINE_HEIGHT_15 },
        indent: { firstLine: FIRST_LINE_INDENT },
        children: [new TextRun({ text: `Keywords: ${keywordsEN}`, font: FONT_ENGLISH, size: SIZE_BODY, bold: true })],
      }));
      main.push(emptyLine());
    }
  }

  // 目录
  main.push(sectionHeading('目  录'));
  main.push(new TableOfContents('目录', { headingLevelRange: '1-3', hyperlink: true }));
  main.push(new Paragraph({ children: [new PageBreak()] }));

  // 绪论
  if (introduction) {
    main.push(sectionHeading('绪  论'));
    main.push(...contentToParagraphs(introduction));
    main.push(emptyLine());
  }

  // 正文章节
  for (const sec of bodySections) {
    const isMainChapter = /^第[一二三四五六七八九十\d]+章|^[一二三四五六七八九十]、|^\d+[\.\、]/.test(sec.heading);
    main.push(sectionHeading(sec.heading));
    // 判断内部是否有子标题
    const subSections = parseAllSections(sec.lines.join('\n'));
    if (subSections.length > 1) {
      for (const sub of subSections) {
        if (sub.level === 1) {
          main.push(sectionHeading(sub.heading));
        } else {
          const size = sub.level === 2 ? SIZE_H2 : SIZE_H3;
          const hLevel = sub.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
          main.push(new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 150, after: 80, line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
            heading: hLevel,
            children: [makeHeadingRun(sub.heading, size)],
          }));
        }
        main.push(...contentToParagraphs(sub.lines.join('\n')));
      }
    } else {
      main.push(...contentToParagraphs(sec.lines.join('\n')));
    }
    main.push(emptyLine());
  }

  // 结论
  if (conclusion) {
    main.push(sectionHeading('结  论'));
    main.push(...contentToParagraphs(conclusion));
    main.push(emptyLine());
  }

  // 致谢
  if (acknowledgments) {
    main.push(sectionHeading('致  谢'));
    main.push(...contentToParagraphs(acknowledgments));
    main.push(emptyLine());
  }

  // 参考文献
  if (referencesRaw) {
    main.push(sectionHeading('参考文献'));
    const refLines = referencesRaw.split('\n').filter(l => l.trim());
    for (const line of refLines) {
      const cleaned = line.trim().replace(/^[\-\*\d+\.\)、\[\]]+\s*/, '');
      if (cleaned) {
        main.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: LINE_HEIGHT_15 },
          children: [makeRefRun(cleaned)],
        }));
      }
    }
  } else if (paper.content?.references?.length) {
    main.push(sectionHeading('参考文献'));
    for (const ref of paper.content.references) {
      if (ref.text) {
        main.push(new Paragraph({
          spacing: { line: LINE_HEIGHT_15 },
          children: [makeRefRun(ref.text)],
        }));
      }
    }
  }

  // ---------- 组装文档 ----------
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: { ascii: FONT_ENGLISH, eastAsia: FONT_BODY },
            size: SIZE_BODY,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
          },
        },
        children: coverChildren,
      },
      {
        properties: {
          page: {
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
            pageNumbers: { start: 1 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ['— ', PageNumber.CURRENT, ' —'],
                    font: { ascii: FONT_ENGLISH, eastAsia: FONT_BODY },
                    size: SIZE_REF,
                  }),
                ],
              }),
            ],
          }),
        },
        children: main,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateWordDocument };
