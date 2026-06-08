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

// ==================== Markdown 解析 ====================

/** 匹配 Markdown 标题（支持 # ~ #### 四级标题），返回 { level: 1|2|3|4, text: string } */
function matchHeading(line) {
  const trimmed = line.trim();
  const m = trimmed.match(/^(#{1,4})\s+(.+)/);
  if (!m) return null;
  return { level: m[1].length, text: m[2].trim() };
}

/** 将全文档按 Markdown 标题拆分为章节 */
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

// ==================== 内联 Markdown → TextRun 转换 ====================

function makeRun(text, bold, italics, size = SIZE_BODY) {
  return new TextRun({
    text,
    font: { ascii: FONT_ENGLISH, eastAsia: bold ? FONT_HEADING : FONT_BODY },
    size,
    bold,
    italics,
  });
}

/** 解析 **粗体** *斜体* 为 TextRun 数组 */
function parseInlineRuns(text, options = {}) {
  if (!text) return [makeRun('', false, false, options.size || SIZE_BODY)];
  const size = options.size || SIZE_BODY;
  const runs = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIdx = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      runs.push(makeRun(text.slice(lastIdx, m.index), false, false, size));
    }
    if (m[1]) {
      runs.push(makeRun(m[2], true, false, size));   // **粗体**
    } else if (m[3]) {
      runs.push(makeRun(m[4], false, true, size));   // *斜体*
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    runs.push(makeRun(text.slice(lastIdx), false, false, size));
  }
  return runs.length > 0 ? runs : [makeRun(text, false, false, size)];
}

/** 匹配无序列表项 */
function isBullet(line) {
  return /^[\-\*]\s+/.test(line.trim());
}

/** 匹配数字编号列表项 */
function matchNumbered(line) {
  const trimmed = line.trim();
  const m = trimmed.match(/^(\d+[\.\)、]\s*|（[一二三四五六七八九十]+）)\s*(.+)/);
  return m ? { full: trimmed } : null;
}

// ==================== 内容 → 段落转换（不再检测标题） ====================

/**
 * 将内容文本转为 Word Paragraph 数组。
 * 内容中不应再包含 Markdown 标题（已被 parseAllSections 提取），
 * 但会清理残留的 # 标记、处理粗体斜体、处理列表。
 */
function contentToParagraphs(contentText) {
  if (!contentText || !contentText.trim()) return [];

  // 先清除所有行首的残余 # 标记（包括任意数量#）
  const cleaned = contentText.split('\n')
    .map(l => l.replace(/^#+\s+/, '').trimEnd())
    .join('\n');

  if (!cleaned.trim()) return [];

  const lines = cleaned.split('\n');
  const paragraphs = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行 → 跳过（段落间距由 spacing 控制）
    if (!line.trim()) {
      i++;
      continue;
    }

    // 残余的无序列表 → 去掉圆点符号，转正文
    if (isBullet(line)) {
      const text = line.replace(/^[\-\*]\s+/, '').trim();
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
        indent: { firstLine: FIRST_LINE_INDENT },
        children: parseInlineRuns(text),
      }));
      i++;
      continue;
    }

    // 数字列表 → 保留编号
    const num = matchNumbered(line);
    if (num) {
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
        indent: { firstLine: FIRST_LINE_INDENT },
        children: parseInlineRuns(num.full),
      }));
      i++;
      continue;
    }

    // 普通段落 — 收集连续行合并
    let paraLines = [line.trim()];
    i++;
    while (i < lines.length) {
      const nl = lines[i].trim();
      if (!nl || isBullet(lines[i]) || matchNumbered(nl)) break;
      paraLines.push(nl);
      i++;
    }
    const paraText = paraLines.join('');
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

// ==================== 辅助 ====================

function emptyLine() {
  return new Paragraph({ spacing: { line: LINE_HEIGHT_15 }, children: [] });
}

function centeredParagraph(text, size, font, bold = false) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_HEIGHT_20, lineRule: LineRuleType.AUTO },
    children: [
      new TextRun({
        text, font: { ascii: FONT_ENGLISH, eastAsia: font || FONT_BODY }, size, bold,
      }),
    ],
  });
}

/** 根据 markdown 标题级别创建 Word 标题段落 */
function createHeadingParagraph(text, level) {
  const sizeMap = { 1: SIZE_H1, 2: SIZE_H2, 3: SIZE_H3, 4: SIZE_BODY };
  const hLevelMap = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 };
  const size = sizeMap[level] || SIZE_BODY;
  const hLevel = hLevelMap[level] || HeadingLevel.HEADING_4;
  return new Paragraph({
    alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: level <= 2 ? 200 : 120, after: level <= 2 ? 100 : 60, line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
    heading: hLevel,
    children: [
      new TextRun({
        text,
        font: { ascii: FONT_ENGLISH, eastAsia: FONT_HEADING },
        size,
        bold: true,
      }),
    ],
  });
}

// ==================== 主文档生成 ====================

async function generateWordDocument(paper) {
  const fullText = paper.fullText || '';
  const allSections = parseAllSections(fullText);

  function findSection(...keywords) {
    for (const kw of keywords) {
      for (const s of allSections) {
        if (s.heading.includes(kw)) return s;
      }
    }
    return null;
  }

  // 特殊章节
  const secAbstract = findSection('摘要');
  const secAbstractEN = findSection('Abstract');
  const secIntro = findSection('绪论', '引言', 'Introduction');
  const secConclusion = findSection('结论', '总结', 'Conclusion');
  const secAck = findSection('致谢', 'Acknowledgments');
  const secRef = findSection('参考文献', 'References');

  // 关键词
  const keywordsCN = paper.content?.keywords?.length ? paper.content.keywords.join('；') : '';
  const keywordsEN = '';

  const metaSet = new Set(['摘要', 'Abstract', '关键词', 'Keywords', '绪论', '引言', 'Introduction',
    '结论', '总结', 'Conclusion', '致谢', 'Acknowledgments', '参考文献', 'References', '目录']);

  // 正文章节：排除特殊章节，按原顺序
  const bodySections = allSections.filter(s => ![...metaSet].some(kw => s.heading.includes(kw)));

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
  main.push(createHeadingParagraph('摘  要', 1));
  if (secAbstract) {
    main.push(...contentToParagraphs(secAbstract.lines.join('\n')));
  } else {
    main.push(...contentToParagraphs(paper.content?.abstract || ''));
  }
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
  if (secAbstractEN) {
    main.push(createHeadingParagraph('Abstract', 1));
    main.push(...contentToParagraphs(secAbstractEN.lines.join('\n')));
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
  main.push(createHeadingParagraph('目  录', 1));
  main.push(new TableOfContents('目录', { headingLevelRange: '1-3', hyperlink: true }));
  main.push(new Paragraph({ children: [new PageBreak()] }));

  // 绪论
  if (secIntro) {
    main.push(createHeadingParagraph('绪  论', 1));
    main.push(...contentToParagraphs(secIntro.lines.join('\n')));
    main.push(emptyLine());
  } else if (paper.content?.introduction) {
    main.push(createHeadingParagraph('绪  论', 1));
    main.push(...contentToParagraphs(paper.content.introduction));
    main.push(emptyLine());
  }

  // 正文章节 — 每个 section 使用其 markdown 级别作为标题级别
  for (const sec of bodySections) {
    const hLevel = Math.min(sec.level + 1, 3); // # → H2, ## → H3, ### → H3 (adjust mapping)
    // 映射：一级 markdown(#) → Word H1, 二级 markdown(##) → Word H2, 三级 markdown(###) → Word H3
    const wordLevel = sec.level;
    main.push(createHeadingParagraph(sec.heading, wordLevel));
    main.push(...contentToParagraphs(sec.lines.join('\n')));
    main.push(emptyLine());
  }

  // 结论
  if (secConclusion) {
    main.push(createHeadingParagraph('结  论', 1));
    main.push(...contentToParagraphs(secConclusion.lines.join('\n')));
    main.push(emptyLine());
  } else if (paper.content?.conclusion) {
    main.push(createHeadingParagraph('结  论', 1));
    main.push(...contentToParagraphs(paper.content.conclusion));
    main.push(emptyLine());
  }

  // 致谢
  if (secAck) {
    main.push(createHeadingParagraph('致  谢', 1));
    main.push(...contentToParagraphs(secAck.lines.join('\n')));
    main.push(emptyLine());
  }

  // 参考文献
  if (secRef) {
    main.push(createHeadingParagraph('参考文献', 1));
    const refLines = secRef.lines.join('\n').split('\n').filter(l => l.trim());
    for (const line of refLines) {
      const cleaned = line.trim().replace(/^[\-\*\d+\.\)、\[\]]+\s*/, '');
      if (cleaned) {
        main.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: LINE_HEIGHT_15 },
          children: [makeRun(cleaned, false, false, SIZE_REF)],
        }));
      }
    }
  } else if (paper.content?.references?.length) {
    main.push(createHeadingParagraph('参考文献', 1));
    for (const ref of paper.content.references) {
      if (ref.text) {
        main.push(new Paragraph({
          spacing: { line: LINE_HEIGHT_15 },
          children: [makeRun(ref.text, false, false, SIZE_REF)],
        }));
      }
    }
  }

  // ---------- 组装 ----------
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
