const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, PageBreak, Footer, PageNumber,
  NumberFormat, TableOfContents, TabStopPosition, TabStopType,
  BorderStyle, convertMillimetersToTwip, LineRuleType,
} = require('docx');

// 高校毕业论文排版常量
const FONT_BODY = 'SimSun';       // 宋体 — 正文
const FONT_HEADING = 'SimHei';    // 黑体 — 标题
const FONT_ENGLISH = 'Times New Roman';

const SIZE_COVER_TITLE = 36;  // 小二号 18pt (half-points)
const SIZE_H1 = 32;           // 三号 16pt
const SIZE_H2 = 28;           // 四号 14pt
const SIZE_H3 = 24;           // 小四号 12pt
const SIZE_BODY = 24;         // 小四号 12pt
const SIZE_COVER_INFO = 28;   // 四号 14pt — 封面信息

const LINE_HEIGHT_15 = 360;   // 1.5倍行距 (240=单倍)
const LINE_HEIGHT_20 = 480;   // 2倍行距

// 页边距 (毫米 → twip)
const MARGIN_TOP = convertMillimetersToTwip(25);
const MARGIN_BOTTOM = convertMillimetersToTwip(25);
const MARGIN_LEFT = convertMillimetersToTwip(30);
const MARGIN_RIGHT = convertMillimetersToTwip(25);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bodyParagraph(text, options = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
    indent: { firstLine: convertMillimetersToTwip(7.5) },
    ...options,
    children: [
      new TextRun({
        text: text || '',
        font: { ascii: FONT_ENGLISH, eastAsia: FONT_BODY },
        size: SIZE_BODY,
        ...options.runOptions,
      }),
    ],
  });
}

function headingParagraph(text, level, size) {
  return new Paragraph({
    alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: 200, after: 100, line: LINE_HEIGHT_15, lineRule: LineRuleType.AUTO },
    heading: level <= 3 ? (level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3) : undefined,
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

function emptyLine() {
  return new Paragraph({ spacing: { line: LINE_HEIGHT_15 }, children: [] });
}

// 居中段落
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

// ---------------------------------------------------------------------------
// Markdown fullText → sections parser
// ---------------------------------------------------------------------------

function parseFullText(fullText) {
  if (!fullText) return { sections: [] };
  const lines = fullText.split('\n');
  const sections = [];
  let currentHeading = null;
  let currentContent = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    const h3Match = line.match(/^###\s+(.+)/);
    const h1Match = line.match(/^#\s+(.+)/);

    const match = h2Match || h1Match || h3Match;
    if (match) {
      if (currentHeading || currentContent.some(l => l.trim())) {
        sections.push({ heading: currentHeading || '正文', content: currentContent.join('\n').trim() });
      }
      currentHeading = match[1];
      currentContent = [];
      // h3 sections push content under parent h2
    } else {
      currentContent.push(line);
    }
  }
  if (currentHeading || currentContent.some(l => l.trim())) {
    sections.push({ heading: currentHeading || '正文', content: currentContent.join('\n').trim() });
  }
  return { sections };
}

function findSection(sections, ...keywords) {
  for (const kw of keywords) {
    for (const s of sections) {
      if (s.heading && s.heading.includes(kw)) return s.content;
    }
  }
  return '';
}

function findNonEmptySection(sections, ...keywords) {
  for (const kw of keywords) {
    for (const s of sections) {
      if (s.heading && s.heading.includes(kw) && s.content.trim()) return s.content;
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// Main document generator
// ---------------------------------------------------------------------------

async function generateWordDocument(paper) {
  const fullText = paper.fullText || '';
  const { sections } = parseFullText(fullText);

  // Extract content from structured fields or parsed markdown
  const abstractCN = paper.content?.abstract || findSection(sections, '摘要');
  const keywordsCN = paper.content?.keywords?.length
    ? paper.content.keywords.join('；')
    : findSection(sections, '关键词');
  const abstractEN = findNonEmptySection(sections, 'Abstract');
  const keywordsEN = findSection(sections, 'Keywords');
  const introduction = paper.content?.introduction || findSection(sections, '绪论', '引言', 'Introduction');
  const conclusion = paper.content?.conclusion || findSection(sections, '结论', 'Conclusion', '总结');
  const acknowledgments = findSection(sections, '致谢', 'Acknowledgments');
  const referencesSection = findSection(sections, '参考文献', 'References');

  // Build body chapters from structured content or parsed sections
  let bodySections = [];
  if (paper.content?.body?.length) {
    bodySections = paper.content.body.map(b => ({
      heading: b.sectionTitle,
      content: b.sectionContent || b.subsections?.map(s => `${s.title}\n${s.content}`).join('\n\n') || '',
    }));
  } else {
    // Filter out meta sections from body
    const metaKeywords = ['摘要', 'Abstract', '关键词', 'Keywords', '绪论', '引言', 'Introduction',
      '结论', 'Conclusion', '总结', '致谢', 'Acknowledgments', '参考文献', 'References'];
    bodySections = sections.filter(s => {
      if (!s.heading) return true;
      return !metaKeywords.some(kw => s.heading.includes(kw));
    });
  }

  // Cover page
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

  // Main content sections
  const mainChildren = [];

  // Chinese Abstract
  mainChildren.push(headingParagraph('摘  要', 1, SIZE_H1));
  mainChildren.push(bodyParagraph(abstractCN || '（请先生成论文全文，AI 将自动生成摘要）'));
  mainChildren.push(emptyLine());
  const kwLine = keywordsCN ? `关键词：${keywordsCN}` : '关键词：';
  mainChildren.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_HEIGHT_15 },
    indent: { firstLine: convertMillimetersToTwip(7.5) },
    children: [
      new TextRun({ text: kwLine, font: { ascii: FONT_ENGLISH, eastAsia: FONT_BODY }, size: SIZE_BODY, bold: false }),
    ],
  }));
  mainChildren.push(emptyLine());

  // English Abstract
  if (abstractEN) {
    mainChildren.push(headingParagraph('Abstract', 1, SIZE_H1));
    mainChildren.push(bodyParagraph(abstractEN));
    mainChildren.push(emptyLine());
    if (keywordsEN) {
      mainChildren.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LINE_HEIGHT_15 },
        indent: { firstLine: convertMillimetersToTwip(7.5) },
        children: [
          new TextRun({ text: `Keywords: ${keywordsEN}`, font: FONT_ENGLISH, size: SIZE_BODY }),
        ],
      }));
    }
    mainChildren.push(emptyLine());
  }

  // Table of Contents
  mainChildren.push(headingParagraph('目  录', 1, SIZE_H1));
  mainChildren.push(new TableOfContents('目录', {
    headingLevelRange: '1-3',
    hyperlink: true,
  }));
  mainChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // Introduction
  if (introduction) {
    mainChildren.push(headingParagraph('绪  论', 1, SIZE_H1));
    for (const para of introduction.split('\n\n')) {
      const trimmed = para.trim();
      if (trimmed) mainChildren.push(bodyParagraph(trimmed));
    }
    mainChildren.push(emptyLine());
  }

  // Body chapters
  for (let i = 0; i < bodySections.length; i++) {
    const section = bodySections[i];
    if (!section.heading && !section.content) continue;
    const isMainChapter = section.heading && (
      section.heading.includes('第') ||
      /^\d+[\.\、]/.test(section.heading) ||
      /^[一二三四五六七八九十]/.test(section.heading)
    );

    if (section.heading) {
      mainChildren.push(headingParagraph(section.heading, isMainChapter ? 1 : 2, isMainChapter ? SIZE_H1 : SIZE_H2));
    }
    if (section.content) {
      for (const para of section.content.split('\n\n')) {
        const trimmed = para.trim();
        if (trimmed) mainChildren.push(bodyParagraph(trimmed));
      }
    }
    // Subsections
    if (section.subsections) {
      for (const sub of section.subsections) {
        if (sub.title) {
          mainChildren.push(headingParagraph(sub.title, 3, SIZE_H3));
        }
        if (sub.content) {
          for (const para of sub.content.split('\n\n')) {
            const trimmed = para.trim();
            if (trimmed) mainChildren.push(bodyParagraph(trimmed));
          }
        }
      }
    }
    mainChildren.push(emptyLine());
  }

  // Conclusion
  if (conclusion) {
    mainChildren.push(headingParagraph('结  论', 1, SIZE_H1));
    for (const para of conclusion.split('\n\n')) {
      const trimmed = para.trim();
      if (trimmed) mainChildren.push(bodyParagraph(trimmed));
    }
    mainChildren.push(emptyLine());
  }

  // Acknowledgments
  if (acknowledgments) {
    mainChildren.push(headingParagraph('致  谢', 1, SIZE_H1));
    for (const para of acknowledgments.split('\n\n')) {
      const trimmed = para.trim();
      if (trimmed) mainChildren.push(bodyParagraph(trimmed));
    }
    mainChildren.push(emptyLine());
  }

  // References
  if (referencesSection) {
    mainChildren.push(headingParagraph('参考文献', 1, SIZE_H1));
    const refLines = referencesSection.split('\n').filter(l => l.trim());
    for (const line of refLines) {
      const trimmed = line.trim();
      if (trimmed) {
        mainChildren.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: LINE_HEIGHT_15 },
          children: [
            new TextRun({
              text: trimmed,
              font: { ascii: FONT_ENGLISH, eastAsia: FONT_BODY },
              size: 21, // 五号
            }),
          ],
        }));
      }
    }
  } else if (paper.content?.references?.length) {
    mainChildren.push(headingParagraph('参考文献', 1, SIZE_H1));
    for (const ref of paper.content.references) {
      mainChildren.push(new Paragraph({
        spacing: { line: LINE_HEIGHT_15 },
        children: [
          new TextRun({
            text: (ref.text || ''),
            font: { ascii: FONT_ENGLISH, eastAsia: FONT_BODY },
            size: 21,
          }),
        ],
      }));
    }
  }

  // Assemble document with two sections (cover + main)
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
      // Cover section — no header/footer
      {
        properties: {
          page: {
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
          },
        },
        children: coverChildren,
      },
      // Main content section — with page numbers
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
                    size: 21,
                  }),
                ],
              }),
            ],
          }),
        },
        children: mainChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateWordDocument };
