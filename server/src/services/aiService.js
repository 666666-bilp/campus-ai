const { callAI } = require('../config/ai');

/**
 * Core AI service - all AI-powered features for the academic platform.
 * Each function calls callAI with carefully engineered prompts.
 * All functions return { success: boolean, data: any, error?: string }.
 */

// ==================== Paper Generation ====================

/**
 * Generate a formal academic abstract.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function generatePaperAbstract(topic, major, paperType) {
  const prompt = `You are an academic writing assistant. Write a concise, professional abstract for an academic paper.

Paper Topic: ${topic}
Major/Field: ${major}
Paper Type: ${paperType}

Requirements:
- Write in the same language as the topic
- 200-300 words
- Include: background context, research problem, methodology overview, key findings, implications
- Use formal academic language appropriate for the discipline
- Output ONLY the abstract text, no labels or prefixes`;

  return await callAI([{ role: 'user', content: prompt }], { temperature: 0.7, maxTokens: 1000 });
}

/**
 * Generate a structured paper outline.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function generatePaperOutline(topic, major, paperType) {
  const prompt = `You are an academic writing advisor. Create a detailed outline for an academic paper.

Topic: ${topic}
Major/Field: ${major}
Paper Type: ${paperType}

Return a JSON object with this structure:
{
  "title": "the paper title",
  "sections": [
    {
      "heading": "Section heading (e.g., 1. Introduction)",
      "subsections": ["subsection name 1", "subsection name 2"],
      "description": "Brief description of what this section will cover"
    }
  ],
  "estimatedWordCount": 3000
}

Include standard academic sections: Introduction, Literature Review, Methodology, Results/Analysis, Discussion, Conclusion.
Adapt sections based on paper type.
Output ONLY valid JSON, no markdown fences, no other text.`;

  const result = await callAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.5, maxTokens: 3000 }
  );

  if (result.success) {
    try {
      const cleaned = result.data.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed };
    } catch (e) {
      return { success: true, data: { title: topic, sections: [], estimatedWordCount: 3000 } };
    }
  }
  return result;
}

/**
 * Generate a single section of a paper.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function generatePaperSection(topic, major, paperType, section, context) {
  const contextBlock = context
    ? `\nPrevious section context for continuity:\n"""\n${context.slice(0, 800)}\n"""`
    : '';

  const prompt = `You are an academic writing expert. Write the following section of a paper.

Topic: ${topic}
Major/Field: ${major}
Paper Type: ${paperType}
Section: ${section}${contextBlock}

Requirements:
- Write comprehensive, well-structured academic content for this section
- Use proper academic tone and terminology for ${major}
- Include appropriate theoretical references and citations where relevant
- Use markdown formatting for headings and emphasis
- Maintain logical flow and coherence
- Output ONLY the section content, no labels or prefixes`;

  return await callAI([{ role: 'user', content: prompt }], { temperature: 0.7, maxTokens: 4000 });
}

/**
 * Orchestrate full paper generation (non-streaming).
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function generateFullPaper(topic, major, paperType, wordCount) {
  try {
    // Step 1: Generate outline
    const outlineResult = await generatePaperOutline(topic, major, paperType);
    if (!outlineResult.success) return outlineResult;

    const outline = outlineResult.data;
    const sectionContents = [];
    let previousContext = '';

    // Step 2: Generate each section sequentially with context
    for (const sec of (outline.sections || [])) {
      const sectionResult = await generatePaperSection(
        topic, major, paperType, sec.heading, previousContext
      );
      if (sectionResult.success && sectionResult.data) {
        sectionContents.push(`## ${sec.heading}\n\n${sectionResult.data}`);
        previousContext = sectionResult.data.slice(0, 800);
      }
    }

    // Step 3: Generate abstract
    const abstractResult = await generatePaperAbstract(topic, major, paperType);
    const abstractText = abstractResult.success ? abstractResult.data : '';

    // Step 4: Assemble
    const fullText = `# ${outline.title || topic}\n\n## Abstract\n\n${abstractText}\n\n---\n\n${sectionContents.join('\n\n---\n\n')}`;

    return {
      success: true,
      data: {
        title: outline.title || topic,
        abstract: abstractText,
        outline,
        sections: sectionContents,
        fullText,
        wordCount: fullText.length,
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==================== Text Polish ====================

/**
 * Polish/rewrite/grammar-check text with specified mode and action.
 * @param {string} text - The text to polish.
 * @param {'liberal'|'science'|'business'} mode - Writing style mode.
 * @param {'rewrite'|'polish'|'grammar'} action - Type of editing action.
 * @returns {Promise<{success: boolean, data?: {original: string, polished: string, changes: Array}, error?: string}>}
 */
async function polishText(text, mode, action) {
  const modeMap = {
    liberal: 'liberal arts / humanities - elegant, nuanced, flowing prose',
    science: 'scientific / technical - precise, objective, data-driven',
    business: 'business / professional - clear, direct, results-oriented',
  };

  const actionMap = {
    rewrite: 'Fully rewrite the text while preserving meaning. Restructure sentences for better flow and impact.',
    polish: 'Lightly polish - fix awkward phrasing, improve word choice, enhance transitions. Keep structure largely intact.',
    grammar: 'ONLY fix grammar, spelling, and punctuation errors. Do NOT change style or wording.',
  };

  const prompt = `You are a professional text editor. ${actionMap[action]}

CRITICAL: The output language MUST match the original text's language.
- If the original is in Chinese (中文), the "polished" field and all "suggestion"/"reason" fields MUST be in Chinese.
- If the original is in English, output in English.

Writing style context: ${modeMap[mode]}

Original text:
"""
${text}
"""

Return a JSON object:
{
  "original": "the exact original text",
  "polished": "the fully improved/edited text (same language as original)",
  "changes": [
    {
      "type": "grammar" | "style" | "clarity" | "structure",
      "original": "the original text fragment",
      "suggestion": "the revised version (same language as original)",
      "reason": "brief explanation (same language as original)"
    }
  ]
}

List at least 3 meaningful changes. Output ONLY valid JSON, no markdown fences.`;

  const result = await callAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.5, maxTokens: 4000 }
  );

  if (result.success) {
    try {
      const cleaned = result.data.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed };
    } catch (e) {
      return {
        success: true,
        data: { original: text, polished: result.data, changes: [] },
      };
    }
  }
  return result;
}

// ==================== Document ====================

/**
 * Summarize a document and extract keywords.
 * @returns {Promise<{success: boolean, data?: {summary: string, keywords: string[]}, error?: string}>}
 */
async function summarizeDocument(text) {
  const truncated = text.slice(0, 15000);
  const prompt = `You are an academic document analyst. Analyze this document:

"""
${truncated}
"""

Return a JSON object:
{
  "summary": "A concise 150-300 word summary capturing the main thesis, key arguments, methodology, findings, and conclusions",
  "keywords": ["keyword1", "keyword2", ...]
}

Extract 5-10 keywords that best represent the document's topics and themes.
Output ONLY valid JSON, no markdown fences.`;

  const result = await callAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.4, maxTokens: 2000 }
  );

  if (result.success) {
    try {
      const cleaned = result.data.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed };
    } catch (e) {
      return { success: true, data: { summary: result.data, keywords: [] } };
    }
  }
  return result;
}

/**
 * Generate formatted references from source descriptions.
 * @param {string[]} texts - Array of source descriptions.
 * @param {'gb7714'|'ieee'|'cnki'} format - Citation format.
 * @returns {Promise<{success: boolean, data?: Array<{format: string, text: string}>, error?: string}>}
 */
async function generateReferences(texts, format) {
  const formatDescriptions = {
    gb7714: 'GB/T 7714-2015 (Chinese national bibliography standard)',
    ieee: 'IEEE citation format (international engineering standard)',
    cnki: 'CNKI / China National Knowledge Infrastructure reference format',
  };

  const textsStr = Array.isArray(texts) ? texts.join('\n---\n') : String(texts);
  const prompt = `You are a citation formatting expert. Format these sources in ${formatDescriptions[format] || format}:

${textsStr.slice(0, 8000)}

Return a JSON object:
{
  "references": [
    { "format": "${format}", "text": "the properly formatted reference" }
  ]
}

Make reasonable assumptions for missing fields (author, year, etc.). Output ONLY valid JSON.`;

  const result = await callAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.3, maxTokens: 3000 }
  );

  if (result.success) {
    try {
      const cleaned = result.data.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed.references || [] };
    } catch (e) {
      return { success: true, data: [] };
    }
  }
  return result;
}

// ==================== Exam ====================

/**
 * Extract exam questions from course material text.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
async function extractExamQuestions(text, subject) {
  const truncated = text.slice(0, 15000);
  const prompt = `You are an exam question generator for "${subject}". Based on the following course material, generate diverse exam questions:

"""
${truncated}
"""

Return a JSON array of question objects:
[
  {
    "type": "single|multiple|judge|essay",
    "stem": "The question text",
    "options": ["A. option1", "B. option2", ...],
    "answer": "The correct answer(s)",
    "analysis": "Explanation of the correct answer",
    "source": "Reference to where in the material this is covered"
  }
]

Generate 8-15 questions covering different question types and difficulty levels.
Ensure questions test comprehension, not just recall.
For multiple choice: provide 4 options with one correct.
For essay: provide a model answer outline.
Output ONLY valid JSON array, no markdown fences.`;

  const result = await callAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.6, maxTokens: 4000 }
  );

  if (result.success) {
    try {
      const cleaned = result.data.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: Array.isArray(parsed) ? parsed : (parsed.questions || []) };
    } catch (e) {
      return { success: false, error: 'Failed to parse questions from AI response' };
    }
  }
  return result;
}

// ==================== Experiment ====================

/**
 * Generate a complete experiment report.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function generateExperimentReport(title, course, data) {
  const dataStr = data ? (typeof data === 'object' ? JSON.stringify(data) : String(data)) : '';

  const prompt = `You are a scientific experiment report writer. Generate a complete experiment report.

Experiment Title: ${title}
Course: ${course}
Data/Parameters: ${dataStr || 'None provided'}

Return a JSON object:
{
  "content": {
    "objective": "Clear statement of the experiment's purpose and goals",
    "theory": "Theoretical background, principles, formulas, and concepts",
    "equipment": "List of equipment, instruments, and materials with specifications",
    "procedure": "Numbered step-by-step experimental procedure",
    "data": "Recorded data in organized format (use markdown tables)",
    "analysis": "Data analysis, calculations, graphs description, error analysis",
    "conclusion": "Summary of findings, whether objectives were met, sources of error, suggestions"
  }
}

Write in the same language as the course name. Use proper scientific terminology.
Output ONLY valid JSON, no markdown fences.`;

  const result = await callAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.5, maxTokens: 4000 }
  );

  if (result.success) {
    try {
      const cleaned = result.data.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed.content || parsed };
    } catch (e) {
      return { success: true, data: { objective: '', theory: '', equipment: '', procedure: '', data: '', analysis: '', conclusion: '' } };
    }
  }
  return result;
}

// ==================== Oral Practice ====================

/**
 * Generate AI response for English oral practice.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function aiOralPractice(scenario, userMessage, history) {
  const messages = [
    {
      role: 'system',
      content: `You are a friendly English oral practice partner. Current scenario: ${scenario}.

Guidelines:
- Speak naturally in conversational English
- Gently correct grammar or pronunciation errors in a supportive way
- Keep responses concise (2-4 sentences)
- Ask follow-up questions to keep the conversation going
- Stay in character based on the scenario
- If the student struggles, offer simpler alternatives
- Occasionally suggest better ways to phrase what the student said`,
    },
  ];

  // Add recent history for context
  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-6)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  return await callAI(messages, { temperature: 0.8, maxTokens: 500 });
}

// ==================== Translation ====================

/**
 * Bilingual translation.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function translateText(text, targetLang) {
  const langNames = {
    zh: 'Chinese', en: 'English', ja: 'Japanese', ko: 'Korean',
    fr: 'French', de: 'German', es: 'Spanish',
  };

  const prompt = `You are a professional translator. Translate the following text to ${langNames[targetLang] || targetLang}.

Original text:
"""
${text}
"""

Return a JSON object:
{
  "original": "the exact original text",
  "translated": "accurate and natural translation",
  "sourceLang": "detected language name",
  "targetLang": "${targetLang}"
}

Preserve formatting, technical terms, and academic tone. Output ONLY valid JSON.`;

  const result = await callAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.3, maxTokens: 4000 }
  );

  if (result.success) {
    try {
      const cleaned = result.data.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed };
    } catch (e) {
      return {
        success: true,
        data: { original: text, translated: result.data, sourceLang: 'auto', targetLang },
      };
    }
  }
  return result;
}

// ==================== Notes ====================

/**
 * Generate an AI summary of note content.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function generateNoteSummary(content) {
  const plainText = content.replace(/<[^>]*>/g, '').slice(0, 8000);
  const prompt = `You are a study assistant. Summarize this note into key learning points:

"""
${plainText}
"""

Requirements:
- Extract 3-8 key points as bullet points
- Keep the summary concise and focused
- Maintain the original language
- Highlight the most important concepts or takeaways
- Output ONLY the summary text, no labels or prefixes`;

  return await callAI([{ role: 'user', content: prompt }], { temperature: 0.4, maxTokens: 800 });
}

// ==================== Schedule ====================

/**
 * Parse raw academic affairs text into structured courses.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function parseSchedule(text) {
  const prompt = `You are a Chinese university course schedule parser. Extract structured course data from this教务 system text:

"""
${text}
"""

Return a JSON object:
{
  "semester": "Detected semester (e.g., 2025-2026学年第1学期)",
  "courses": [
    {
      "name": "Course name",
      "teacher": "Teacher name",
      "location": "Classroom/building",
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "09:40",
      "weeks": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
      "color": "#3B82F6",
      "notes": "any additional notes"
    }
  ]
}

Day of week: 1=Monday through 7=Sunday.
Infer weeks from range patterns (e.g., "1-16周" means weeks 1-16).
Output ONLY valid JSON, no markdown fences.`;

  const result = await callAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.3, maxTokens: 4000 }
  );

  if (result.success) {
    try {
      const cleaned = result.data.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed };
    } catch (e) {
      return { success: false, error: 'Failed to parse schedule data: ' + e.message };
    }
  }
  return result;
}

// ==================== LaTeX ====================

/**
 * Generate LaTeX code from a description.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function generateLatex(description) {
  const prompt = `You are a LaTeX expert. Generate a LaTeX math expression based on this description:

${description}

Requirements:
- Output ONLY the raw LaTeX math expression, NOT a full document
- Do NOT include \\documentclass, \\usepackage, \\begin{document}, \\end{document}, or preamble
- For inline formulas: output just the math expression (e.g., E=mc^2)
- For display formulas: use \\[ ... \\] or $$ ... $$ delimiters
- Use appropriate commands from amsmath and amssymb
- Keep it clean and directly renderable in a math preview
- Output ONLY the LaTeX code, no markdown fences, no explanations`;

  return await callAI([{ role: 'user', content: prompt }], { temperature: 0.3, maxTokens: 4000 });
}

// ==================== Code ====================

/**
 * Add AI-generated educational comments to code.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function addCodeComments(code, language) {
  const prompt = `You are an expert programming educator. Add detailed, educational comments to this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Requirements:
- Add a header comment explaining the overall purpose and approach
- Add inline comments explaining WHAT each significant block does (not just restating the code)
- Explain complex algorithms, data structures, or patterns
- Use proper comment syntax for ${language}
- Do NOT modify the actual code logic, only add comments
- Output ONLY the commented code, no markdown fences`;

  return await callAI([{ role: 'user', content: prompt }], { temperature: 0.3, maxTokens: 4000 });
}

// ==================== Exam Explanation ====================

/**
 * Explain an exam question's answer in detail.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function explainExamQuestion(question) {
  const q = typeof question === 'object' ? question : { stem: String(question) };
  const optionsText = q.options ? q.options.join(', ') : '';
  const qText = [
    `Type: ${q.type || 'unknown'}`,
    `Question: ${q.stem || ''}`,
    optionsText ? `Options: ${optionsText}` : '',
    q.answer ? `Correct Answer: ${q.answer}` : '',
  ].filter(Boolean).join('\n');

  const prompt = `You are an expert academic tutor. Explain this exam question thoroughly:

${qText}

Provide:
1. What the question is testing (knowledge point analysis)
2. Step-by-step reasoning to arrive at the answer
3. Why the correct answer is correct
4. Why each wrong option is wrong (for multiple choice)
5. Common mistakes students make
6. Related concepts to review

Write in the same language as the question. Be thorough but clear.`;

  return await callAI([{ role: 'user', content: prompt }], { temperature: 0.5, maxTokens: 2000 });
}

// ==================== CET Analysis ====================

/**
 * Analyze CET-4/6 exam question and provide answer explanation.
 * @param {string} questionText - The exam question text.
 * @param {string} questionType - 'cet4' or 'cet6'.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function cetAnalysis(questionText, questionType) {
  const typeLabel = questionType === 'cet6' ? 'CET-6' : 'CET-4';
  const prompt = `You are an expert English exam tutor specializing in ${typeLabel} (College English Test). Analyze the following ${typeLabel} exam question:

"""
${questionText}
"""

Please provide:
1. The correct answer
2. Detailed explanation of why this answer is correct
3. Analysis of key grammar points, vocabulary, or reading strategies involved
4. Common traps or distractors in this question
5. Study tips for similar question types
6. Related vocabulary or grammar to review

Write in Chinese if the question is for Chinese students preparing for CET, otherwise English.
Be thorough and pedagogically helpful.`;

  return await callAI([{ role: 'user', content: prompt }], { temperature: 0.5, maxTokens: 1500 });
}

module.exports = {
  generatePaperAbstract,
  generatePaperOutline,
  generatePaperSection,
  generateFullPaper,
  polishText,
  summarizeDocument,
  extractExamQuestions,
  generateReferences,
  generateExperimentReport,
  aiOralPractice,
  translateText,
  generateNoteSummary,
  parseSchedule,
  generateLatex,
  addCodeComments,
  explainExamQuestion,
  cetAnalysis,
};
