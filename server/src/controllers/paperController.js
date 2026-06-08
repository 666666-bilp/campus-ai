const Paper = require('../models/Paper');
const aiService = require('../services/aiService');
const { callAI, streamAI } = require('../config/ai');
const { success, error, paginated, created } = require('../utils/response');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a prompt-compatible messages array for the AI.
 */
function buildMessages(systemPrompt, userPrompt) {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * Parse JSON from an AI response, stripping markdown fences when present.
 * Returns the parsed object or null on failure.
 */
function safeParseJSON(text) {
  if (!text) return null;
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
  } catch {
    return null;
  }
}

/**
 * Verify that the paper with the given id belongs to the authenticated user.
 * Returns the document or null. Does NOT send a response — callers handle that.
 */
async function findOwnedPaper(paperId, userId) {
  return Paper.findOne({ _id: paperId, userId });
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * POST /api/papers
 * Create a new paper draft.
 */
async function create(req, res, next) {
  try {
    const { title, topic, paperType, wordCount, major } = req.body;

    if (!title || !title.trim()) {
      return error(res, 'Paper title is required.', 400);
    }
    if (!topic || !topic.trim()) {
      return error(res, 'Paper topic is required.', 400);
    }
    if (!major || !major.trim()) {
      return error(res, 'Major/field is required.', 400);
    }

    const paper = await Paper.create({
      userId: req.user._id,
      title: title.trim(),
      topic: topic.trim(),
      paperType: paperType || '课程论文',
      wordCount: wordCount || 3000,
      major: major.trim(),
    });

    return created(res, paper, 'Paper created successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/papers
 * List all papers for the authenticated user, most recently updated first.
 */
async function getAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [papers, total] = await Promise.all([
      Paper.find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Paper.countDocuments({ userId: req.user._id }),
    ]);

    return paginated(res, papers, page, limit, total);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/papers/:id
 * Retrieve a single paper by ID (owner only).
 */
async function getOne(req, res, next) {
  try {
    const paper = await findOwnedPaper(req.params.id, req.user._id);

    if (!paper) {
      return error(res, 'Paper not found.', 404);
    }

    return success(res, paper, 'Paper retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/papers/:id
 * Update a paper. Accepts both top-level fields (title, topic, etc.)
 * and nested content fields (content.abstract, content.keywords, …).
 */
async function update(req, res, next) {
  try {
    const paper = await findOwnedPaper(req.params.id, req.user._id);

    if (!paper) {
      return error(res, 'Paper not found.', 404);
    }

    const {
      title,
      topic,
      paperType,
      wordCount,
      major,
      fullText,
      // Nested content fields
      abstract,
      keywords,
      introduction,
      body,
      conclusion,
      references,
    } = req.body;

    // --- Top-level simple fields ---
    if (title !== undefined) paper.title = title;
    if (topic !== undefined) paper.topic = topic;
    if (paperType !== undefined) paper.paperType = paperType;
    if (wordCount !== undefined) paper.wordCount = wordCount;
    if (major !== undefined) paper.major = major;
    if (fullText !== undefined) paper.fullText = fullText;

    // --- Nested content fields ---
    if (abstract !== undefined) paper.content.abstract = abstract;
    if (keywords !== undefined) paper.content.keywords = keywords;
    if (introduction !== undefined) paper.content.introduction = introduction;
    if (body !== undefined) paper.content.body = body;
    if (conclusion !== undefined) paper.content.conclusion = conclusion;
    if (references !== undefined) paper.content.references = references;

    // Bump version on every update
    paper.version += 1;

    await paper.save();

    return success(res, paper, 'Paper updated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/papers/:id
 * Delete a paper permanently.
 */
async function deleteOne(req, res, next) {
  try {
    const paper = await Paper.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!paper) {
      return error(res, 'Paper not found.', 404);
    }

    return success(res, null, 'Paper deleted successfully.');
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// AI generation helpers
// ---------------------------------------------------------------------------

/**
 * Parse the full text returned by the AI into structured content sections.
 * Attempts to split on common academic paper headings.
 */
function parseContentFromFullText(fullText) {
  const content = {
    abstract: '',
    keywords: [],
    introduction: '',
    body: [],
    conclusion: '',
    references: [],
  };

  if (!fullText) return content;

  // Extract abstract (heuristic: first paragraph after "摘要" or "Abstract")
  const abstractMatch = fullText.match(/(?:摘要|Abstract)[：:]\s*([\s\S]*?)(?=\n\s*(?:关键词|Keywords|绪论|引言|第[一二三四五六七八九十\d]+章|Introduction|1\.|一、))/i);
  if (abstractMatch) {
    content.abstract = abstractMatch[1].trim().slice(0, 2000);
  }

  // Extract keywords
  const kwMatch = fullText.match(/(?:关键词|Keywords)[：:]\s*([^\n]+)/i);
  if (kwMatch) {
    content.keywords = kwMatch[1].split(/[,;，；]/).map(k => k.trim()).filter(Boolean);
  }

  // Extract introduction (heuristic: first substantive section)
  const introMatch = fullText.match(/(?:绪论|引言|Introduction)\s*\n([\s\S]*?)(?=\n\s*(?:第[一二三四五六七八九十\d]+章|\d+[\.\、]|##\s|Conclusion|结论))/i);
  if (introMatch) {
    content.introduction = introMatch[1].trim().slice(0, 5000);
  }

  // Extract body as a single section (AI typically returns structured content)
  const bodySection = {
    sectionTitle: '正文',
    sectionContent: fullText.slice(0, 50000),
    subsections: [],
  };
  content.body = [bodySection];

  // Extract conclusion
  const concMatch = fullText.match(/(?:结论|Conclusion|总结)[：:\s]*\n([\s\S]*?)(?=\n\s*(?:参考文献|References|致谢|Acknowledgments|$))/i);
  if (concMatch) {
    content.conclusion = concMatch[1].trim().slice(0, 5000);
  }

  return content;
}

// ---------------------------------------------------------------------------
// AI generation endpoints
// ---------------------------------------------------------------------------

/**
 * POST /api/papers/:id/generate-outline
 * Generate a structured chapter outline via AI and save it to the paper.
 */
async function generateOutline(req, res, next) {
  try {
    const paper = await findOwnedPaper(req.params.id, req.user._id);

    if (!paper) {
      return error(res, 'Paper not found.', 404);
    }

    const outlineResult = await aiService.generatePaperOutline(
      paper.topic,
      paper.major,
      paper.paperType
    );

    if (!outlineResult.success) {
      return error(res, 'Failed to generate outline: ' + (outlineResult.error || 'Unknown error'), 500);
    }

    const outline = outlineResult.data;

    // Map the AI outline structure into paper.content.body
    // Expected outline shape: { title, sections: [{ heading, subsections, description }] }
    const body = [];
    if (outline.sections && Array.isArray(outline.sections)) {
      for (const section of outline.sections) {
        const subsections = [];
        if (section.subsections && Array.isArray(section.subsections)) {
          for (const sub of section.subsections) {
            subsections.push({ title: typeof sub === 'string' ? sub : (sub.title || sub), content: '' });
          }
        }
        body.push({
          sectionTitle: section.heading || 'Untitled Section',
          sectionContent: '',
          subsections,
        });
      }
    }

    paper.content.body = body;
    paper.version += 1;
    await paper.save();

    return success(res, paper, 'Outline generated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/papers/:id/generate-section
 * Generate a specific section (abstract, introduction, body section, conclusion, etc.)
 * using AI and save it into the appropriate content field.
 */
async function generateSection(req, res, next) {
  try {
    const { sectionName } = req.body;

    if (!sectionName) {
      return error(res, 'sectionName is required (e.g. "abstract", "introduction", "conclusion").', 400);
    }

    const paper = await findOwnedPaper(req.params.id, req.user._id);

    if (!paper) {
      return error(res, 'Paper not found.', 404);
    }

    // Build a contextual prompt that includes existing content for coherence
    const existingAbstract = paper.content.abstract || '';
    const existingIntroduction = paper.content.introduction || '';
    const existingBody = paper.content.body.map(b =>
      `${b.sectionTitle}\n${b.sectionContent}`
    ).join('\n\n');
    const existingConclusion = paper.content.conclusion || '';

    const contextSnippet = [
      existingAbstract ? `现有摘要：${existingAbstract.slice(0, 500)}` : '',
      existingIntroduction ? `现有绪论：${existingIntroduction.slice(0, 500)}` : '',
      existingBody ? `现有正文（部分）：${existingBody.slice(0, 1000)}` : '',
      existingConclusion ? `现有结论：${existingConclusion.slice(0, 500)}` : '',
    ].filter(Boolean).join('\n\n');

    const sectionPrompts = {
      abstract: `你是一名学术写作导师。请为以下论文撰写中文摘要（200-300字），要求：
- 简要说明研究背景与目的
- 概括研究方法与过程
- 总结主要发现与结论
- 语言精炼、学术严谨
论文题目：${paper.title}
专业：${paper.major}
类型：${paper.paperType}
${contextSnippet ? '已有内容参考：\n' + contextSnippet : ''}
请直接输出摘要正文，不要包含"摘要："标签。`,
      keywords: `请根据以下论文信息，提取5-8个中文学术关键词。
论文题目：${paper.title}
${existingAbstract ? '摘要：' + existingAbstract : ''}
输出格式：["关键词1", "关键词2", ...]
关键词应涵盖研究领域、核心概念、方法等。只输出JSON数组。`,
      introduction: `你是一名学术写作导师。请为以下论文撰写绪论部分（800-1000字），包含：
1. 研究背景与意义（为什么研究这个问题）
2. 国内外研究现状（前人做了什么、有什么不足）
3. 研究内容与方法（本文要做什么、怎么做）
4. 论文结构安排（各章节概要）
论文题目：${paper.title}
专业：${paper.major}
类型：${paper.paperType}
${contextSnippet ? '已有内容参考：\n' + contextSnippet : ''}
使用正式学术语言，直接输出绪论内容。`,
      conclusion: `你是一名学术写作导师。请为以下论文撰写结论部分（500-800字），包含：
1. 研究工作总结（完成了什么、得到什么结论）
2. 创新点或特色
3. 不足与局限性
4. 未来研究方向
论文题目：${paper.title}
专业：${paper.major}
${contextSnippet ? '已有内容参考：\n' + contextSnippet : ''}
直接输出结论内容。`,
    };

    const prompt = sectionPrompts[sectionName];
    if (!prompt) {
      // Generic section — treat as a body section
      const genericPrompt = `请为以下学术论文撰写"${sectionName}"部分（约500字）。\n论文题目：${paper.title}\n专业：${paper.major}\n类型：${paper.paperType}\n${contextSnippet ? '已有内容参考：\n' + contextSnippet : ''}\n请直接输出该章节内容。`;
      const messages = buildMessages(
        '你是一位专业的学术论文写作助手，擅长撰写各类学术论文章节。',
        genericPrompt
      );
      const result = await callAI(messages, { maxTokens: 1500 });

      const generatedText = (result.success && result.data) ? result.data : '';

      // Append or overwrite body
      paper.content.body.push({
        sectionTitle: sectionName,
        sectionContent: generatedText,
        subsections: [],
      });

      paper.version += 1;
      await paper.save();

      return success(res, paper, `Section "${sectionName}" generated successfully.`);
    }

    const systemPrompt = '你是一位专业的学术论文写作助手，严格按照要求输出内容。';
    const messages = buildMessages(systemPrompt, prompt);

    let maxTokens = 1500;
    if (sectionName === 'introduction') maxTokens = 2500;
    if (sectionName === 'conclusion') maxTokens = 1500;
    if (sectionName === 'abstract') maxTokens = 600;
    if (sectionName === 'keywords') maxTokens = 300;

    const result = await callAI(messages, { maxTokens });
    const generatedText = (result.success && result.data) ? result.data : '';

    if (!generatedText) {
      return error(res, 'AI generation returned no content. Please try again.', 500);
    }

    // Save to the appropriate field
    switch (sectionName) {
      case 'abstract':
        paper.content.abstract = generatedText.trim();
        break;
      case 'keywords': {
        const parsed = safeParseJSON(generatedText);
        paper.content.keywords = Array.isArray(parsed) ? parsed : generatedText.split(/[,;，；]/).map(k => k.trim()).filter(Boolean);
        break;
      }
      case 'introduction':
        paper.content.introduction = generatedText.trim();
        break;
      case 'conclusion':
        paper.content.conclusion = generatedText.trim();
        break;
      default:
        // Should not reach here given the earlier check, but handle gracefully
        paper.content.body.push({
          sectionTitle: sectionName,
          sectionContent: generatedText.trim(),
          subsections: [],
        });
        break;
    }

    paper.version += 1;
    await paper.save();

    return success(res, paper, `Section "${sectionName}" generated successfully.`);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/papers/:id/generate-full
 * Generate the full paper text via AI. Saves fullText and parses structured content.
 * Non-streaming: waits for full result, then returns.
 */
async function generateFull(req, res, next) {
  try {
    const paper = await findOwnedPaper(req.params.id, req.user._id);

    if (!paper) {
      return error(res, 'Paper not found.', 404);
    }

    // Mark as generating
    paper.status = 'generating';
    await paper.save();

    const systemPrompt = `你是一名资深的高校毕业论文指导教师。请严格按照以下标准，为一名大学${paper.major}专业的学生撰写一篇完整的学术论文。

# 论文类型
${paper.paperType}

# 格式要求（必须严格遵守）

## 论文结构（按顺序）
1. **中文摘要**（200-300字）：概括研究背景、目的、方法、主要内容和结论
2. **中文关键词**（3-8个）：用分号分隔
3. **英文摘要（Abstract）**：与中文摘要对应，英文撰写
4. **英文关键词（Keywords）**：与中文关键词对应
5. **绪论**：阐述研究背景与意义、国内外研究现状、研究内容与方法、论文结构安排
6. **相关理论与技术基础**：介绍论文涉及的核心概念、理论框架或技术栈
7. **主体章节**（2-3章）：根据论文类型组织，如系统设计与实现、实验设计与数据分析、案例分析与讨论等
8. **结论**：总结研究工作、指出创新点与不足、展望未来方向
9. **致谢**：对指导老师、同学、家人等的致谢
10. **参考文献**：列出5-10篇参考文献（GB/T 7714格式）

## 写作规范
- 使用学术语言，客观严谨，避免口语化
- 正文字数约${paper.wordCount}字
- 使用 Markdown 格式输出（# 标题、## 章节、### 小节）
- 每个章节要有实质性内容，不可空洞
- 参考文献格式示例：[1] 作者. 题名[J]. 刊名, 年, 卷(期): 起止页码.`;

    const userPrompt = `请为以下论文题目撰写完整的毕业论文：\n题目：${paper.topic}\n专业：${paper.major}\n类型：${paper.paperType}\n目标字数：${paper.wordCount}字\n\n请严格按照系统提示中的格式要求生成。`;

    const messages = buildMessages(systemPrompt, userPrompt);

    const result = await callAI(messages, {
      maxTokens: Math.min(paper.wordCount * 3, 16000),
    });

    if (!result.success) {
      paper.status = 'draft';
      await paper.save();
      return error(res, `AI generation failed: ${result.error}`, 500);
    }

    const fullText = result.data || '';

    paper.fullText = fullText;
    paper.status = 'completed';

    // Parse structured content from the full text
    const parsed = parseContentFromFullText(fullText);

    if (parsed.abstract) paper.content.abstract = parsed.abstract;
    if (parsed.keywords && parsed.keywords.length) paper.content.keywords = parsed.keywords;
    if (parsed.introduction) paper.content.introduction = parsed.introduction;
    if (parsed.body && parsed.body.length) paper.content.body = parsed.body;
    if (parsed.conclusion) paper.content.conclusion = parsed.conclusion;

    paper.version += 1;
    await paper.save();

    // Increment user stats
    try {
      await req.user.incrementPapersGenerated(1);
      await req.user.addWordsProcessed(fullText.length);
    } catch (_) {
      // Non-critical — log but do not fail
      console.error('Failed to update user generation stats:', _.message);
    }

    return success(res, paper, 'Full paper generated successfully.');
  } catch (err) {
    // Best-effort: revert status on error
    try {
      const paper = await findOwnedPaper(req.params.id, req.user._id);
      if (paper && paper.status === 'generating') {
        paper.status = 'draft';
        await paper.save();
      }
    } catch (_) {
      // ignore
    }
    next(err);
  }
}

/**
 * GET /api/papers/:id/stream-generate
 * Stream the full paper generation via Server-Sent Events (SSE).
 */
async function streamGenerate(req, res, next) {
  try {
    const paper = await findOwnedPaper(req.params.id, req.user._id);

    if (!paper) {
      return error(res, 'Paper not found.', 404);
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Optionally flush headers immediately
    res.flushHeaders();

    // Mark generating
    paper.status = 'generating';
    await paper.save();

    let fullText = '';

    const systemPrompt = `你是一名资深的高校毕业论文指导教师。请严格按照以下标准，为一名大学${paper.major}专业的学生撰写一篇完整的学术论文。

# 论文类型
${paper.paperType}

# 格式要求（必须严格遵守）

## 论文结构（按顺序）
1. **中文摘要**（200-300字）：概括研究背景、目的、方法、主要内容和结论
2. **中文关键词**（3-8个）：用分号分隔
3. **英文摘要（Abstract）**：与中文摘要对应，英文撰写
4. **英文关键词（Keywords）**：与中文关键词对应
5. **绪论**：阐述研究背景与意义、国内外研究现状、研究内容与方法、论文结构安排
6. **相关理论与技术基础**：介绍论文涉及的核心概念、理论框架或技术栈
7. **主体章节**（2-3章）：根据论文类型组织，如系统设计与实现、实验设计与数据分析、案例分析与讨论等
8. **结论**：总结研究工作、指出创新点与不足、展望未来方向
9. **致谢**：对指导老师、同学、家人等的致谢
10. **参考文献**：列出5-10篇参考文献（GB/T 7714格式）

## 写作规范
- 使用学术语言，客观严谨，避免口语化
- 正文字数约${paper.wordCount}字
- 使用 Markdown 格式输出（# 标题、## 章节、### 小节）
- 每个章节要有实质性内容，不可空洞
- 参考文献格式示例：[1] 作者. 题名[J]. 刊名, 年, 卷(期): 起止页码.`;

    const userPrompt = `请为以下论文题目撰写完整的毕业论文：\n题目：${paper.topic}\n专业：${paper.major}\n类型：${paper.paperType}\n目标字数：${paper.wordCount}字\n\n请严格按照系统提示中的格式要求生成。`;

    const messages = buildMessages(systemPrompt, userPrompt);

    const stream = streamAI(messages, {
      maxTokens: Math.min(paper.wordCount * 3, 16000),
    });

    for await (const chunk of stream) {
      if (chunk) {
        fullText += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    }

    // Signal completion
    res.write('data: [DONE]\n\n');

    // Save the complete paper
    paper.fullText = fullText;
    paper.status = 'completed';

    const parsed = parseContentFromFullText(fullText);
    if (parsed.abstract) paper.content.abstract = parsed.abstract;
    if (parsed.keywords && parsed.keywords.length) paper.content.keywords = parsed.keywords;
    if (parsed.introduction) paper.content.introduction = parsed.introduction;
    if (parsed.body && parsed.body.length) paper.content.body = parsed.body;
    if (parsed.conclusion) paper.content.conclusion = parsed.conclusion;

    paper.version += 1;
    await paper.save();

    // Update user stats
    try {
      await req.user.incrementPapersGenerated(1);
      await req.user.addWordsProcessed(fullText.length);
    } catch (_) {
      console.error('Failed to update user generation stats:', _.message);
    }

    res.end();
  } catch (err) {
    // Attempt to revert status
    try {
      const paper = await findOwnedPaper(req.params.id, req.user._id);
      if (paper && paper.status === 'generating') {
        paper.status = 'draft';
        await paper.save();
      }
    } catch (_) {
      // ignore
    }

    // If headers were already sent, write an error event; otherwise pass to Express error handler
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}

/**
 * GET /api/papers/:id/export/:format
 * Export the paper as a downloadable file (txt or md).
 */
async function exportPaper(req, res, next) {
  try {
    const paper = await findOwnedPaper(req.params.id, req.user._id);

    if (!paper) {
      return error(res, 'Paper not found.', 404);
    }

    const format = (req.params.format || 'md').toLowerCase();

    if (!['txt', 'md', 'docx'].includes(format)) {
      return error(res, 'Unsupported export format. Use "txt", "md" or "docx".', 400);
    }

    // DOCX export — generate formatted Word document
    if (format === 'docx') {
      try {
        const { generateWordDocument } = require('../services/wordExport');
        const docxBuffer = await generateWordDocument(paper);

        const sanitizedTitle = paper.title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(sanitizedTitle)}.docx"`);
        res.setHeader('Content-Length', docxBuffer.length);
        return res.send(docxBuffer);
      } catch (docxErr) {
        console.error('DOCX generation error:', docxErr.message);
        return error(res, 'Word文档生成失败，请先生成论文全文。', 500);
      }
    }

    // Text / Markdown export
    let body = paper.fullText;
    if (!body || body.trim().length === 0) {
      const parts = [];

      if (paper.content.abstract) {
        parts.push(`摘要\n\n${paper.content.abstract}`);
      }

      if (paper.content.keywords && paper.content.keywords.length) {
        parts.push(`\n关键词：${paper.content.keywords.join('；')}`);
      }

      if (paper.content.introduction) {
        parts.push(`\n\n绪论/引言\n\n${paper.content.introduction}`);
      }

      if (paper.content.body && paper.content.body.length) {
        for (const section of paper.content.body) {
          parts.push(`\n\n${section.sectionTitle}\n\n${section.sectionContent}`);
          if (section.subsections && section.subsections.length) {
            for (const sub of section.subsections) {
              parts.push(`\n${sub.title}\n${sub.content}`);
            }
          }
        }
      }

      if (paper.content.conclusion) {
        parts.push(`\n\n结论\n\n${paper.content.conclusion}`);
      }

      if (paper.content.references && paper.content.references.length) {
        parts.push('\n\n参考文献\n');
        for (const ref of paper.content.references) {
          parts.push(ref.text);
        }
      }

      body = parts.join('\n');
    }

    // Sanitize filename: replace characters unsafe for file systems
    const sanitizedTitle = paper.title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100);
    const filename = `${sanitizedTitle}.${format === 'txt' ? 'txt' : 'md'}`;

    const contentType = format === 'txt'
      ? 'text/plain; charset=utf-8'
      : 'text/markdown; charset=utf-8';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', Buffer.byteLength(body, 'utf-8'));

    return res.send(body);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getAll,
  getOne,
  update,
  delete: deleteOne,
  generateOutline,
  generateSection,
  generateFull,
  streamGenerate,
  exportPaper,
};
