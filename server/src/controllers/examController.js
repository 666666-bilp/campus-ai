const { success, error, paginated } = require('../utils/response');
const aiService = require('../services/aiService');
const ExamQuestion = require('../models/ExamQuestion');

const VALID_TYPES = ['single', 'multiple', 'judge', 'essay'];
const TYPE_ALIASES = {
  true_false: 'judge', 'true/false': 'judge', tf: 'judge', bool: 'judge', boolean: 'judge',
  fill_blank: 'essay', 'fill-in-the-blank': 'essay', fill: 'essay', blank: 'essay',
  short_answer: 'essay', short: 'essay',
  choice: 'single', multi: 'multiple',
};

function normalizeQuestions(questions) {
  return questions.map(q => {
    const rawType = (q.type || '').toLowerCase().trim();
    if (VALID_TYPES.includes(rawType)) return q;
    const mapped = TYPE_ALIASES[rawType] || 'single';
    return { ...q, type: mapped };
  });
}

/**
 * Generate exam questions from text content via AI.
 * POST /api/exam/generate
 */
const generateQuestions = async (req, res, next) => {
  try {
    const { subject, text } = req.body;

    if (!subject || !text) {
      return error(res, '请提供科目和内容', 400);
    }

    const result = await aiService.extractExamQuestions(text, subject);
    if (!result.success) {
      return error(res, 'Failed to generate questions: ' + (result.error || 'Unknown error'), 500);
    }
    const questions = result.data || [];

    const exam = await ExamQuestion.create({
      userId: req.user._id,
      subject,
      questions: normalizeQuestions(questions),
    });

    success(res, exam, '题目生成成功', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Save exam questions directly (no AI generation).
 * POST /api/exam
 */
const create = async (req, res, next) => {
  try {
    const { subject, questions } = req.body;

    if (!subject || !questions || !Array.isArray(questions) || questions.length === 0) {
      return error(res, '请提供科目和题目列表', 400);
    }

    const exam = await ExamQuestion.create({
      userId: req.user._id,
      subject,
      questions: normalizeQuestions(questions),
    });

    success(res, exam, '题库保存成功', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all exam question sets for the current user with pagination.
 * GET /api/exam
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, subject } = req.query;
    const query = { userId: req.user._id };

    if (subject) {
      query.subject = subject;
    }

    const [exams, total] = await Promise.all([
      ExamQuestion.find(query)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      ExamQuestion.countDocuments(query),
    ]);

    paginated(res, exams, Number(page), Number(limit), total);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single exam question set by id.
 * GET /api/exam/:id
 */
const getOne = async (req, res, next) => {
  try {
    const exam = await ExamQuestion.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!exam) {
      return error(res, '题库不存在', 404);
    }

    success(res, exam);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an exam question set.
 * DELETE /api/exam/:id
 */
const remove = async (req, res, next) => {
  try {
    await ExamQuestion.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * Add a question to the wrong book by question ID.
 * POST /api/exam/wrong-book/:questionId
 * Searches all user's exam sets to find the question.
 */
const addToWrongBook = async (req, res, next) => {
  try {
    const questionId = req.params.questionId;

    if (!questionId) {
      return error(res, '请提供题目ID', 400);
    }

    // Find the exam that contains this question
    const exam = await ExamQuestion.findOne({
      userId: req.user._id,
      'questions._id': questionId,
    });

    if (!exam) {
      return error(res, '题目不存在', 404);
    }

    // Verify the question exists in this exam
    const question = exam.questions.id(questionId);
    if (!question) {
      return error(res, '题目不存在', 404);
    }

    // Check if already in wrong book — update count, otherwise push
    const existingEntry = exam.wrongBook.find(
      (w) => w.questionId && w.questionId.toString() === questionId
    );

    if (existingEntry) {
      existingEntry.wrongCount += 1;
      existingEntry.lastWrongTime = new Date();
    } else {
      exam.wrongBook.push({
        questionId,
        wrongCount: 1,
        lastWrongTime: new Date(),
      });
    }

    await exam.save();

    success(res, exam.wrongBook, '已加入错题本');
  } catch (err) {
    next(err);
  }
};

/**
 * Get all wrong book entries across all exams for the current user.
 * GET /api/exam/wrong-book
 */
const getWrongBook = async (req, res, next) => {
  try {
    const exams = await ExamQuestion.find({
      userId: req.user._id,
      'wrongBook.0': { $exists: true },
    });

    // Build a flat list of wrong-book entries with full question details
    const entries = [];

    for (const exam of exams) {
      for (const wrongEntry of exam.wrongBook) {
        const question = exam.questions.id(wrongEntry.questionId);
        if (question) {
          entries.push({
            _id: wrongEntry._id,
            examId: exam._id,
            subject: exam.subject,
            questionId: wrongEntry.questionId,
            type: question.type,
            stem: question.stem,
            options: question.options,
            answer: question.answer,
            analysis: question.analysis,
            wrongCount: wrongEntry.wrongCount,
            lastWrongTime: wrongEntry.lastWrongTime,
          });
        }
      }
    }

    success(res, entries);
  } catch (err) {
    next(err);
  }
};

/**
 * Remove a question from the wrong book by question ID.
 * DELETE /api/exam/wrong-book/:questionId
 * Searches all user's exam sets to find and remove the wrong-book entry.
 */
const removeFromWrongBook = async (req, res, next) => {
  try {
    const questionId = req.params.questionId;

    if (!questionId) {
      return error(res, '请提供题目ID', 400);
    }

    // Find the exam that contains this question in wrong book
    const exam = await ExamQuestion.findOne({
      userId: req.user._id,
      'wrongBook.questionId': questionId,
    });

    if (!exam) {
      return error(res, '错题记录不存在', 404);
    }

    // Find and remove the wrong book entry
    const wrongEntry = exam.wrongBook.find(
      (w) => w.questionId && w.questionId.toString() === questionId
    );

    if (!wrongEntry) {
      return error(res, '错题记录不存在', 404);
    }

    exam.wrongBook.pull(wrongEntry._id);
    await exam.save();

    success(res, null, '已从错题本移除');
  } catch (err) {
    next(err);
  }
};

/**
 * Submit answers for an exam, grade them, and add wrong answers to the
 * wrong book automatically.
 * POST /api/exam/:id/submit
 * Body: { answers: [{ questionId, answer }] }
 */
const submitAnswer = async (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return error(res, '请提供答案数据', 400);
    }

    const exam = await ExamQuestion.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!exam) {
      return error(res, '题库不存在', 404);
    }

    const results = [];
    let correctCount = 0;

    for (const submitted of answers) {
      const question = exam.questions.id(submitted.questionId);

      if (!question) {
        results.push({
          questionId: submitted.questionId,
          status: 'not_found',
          userAnswer: submitted.answer,
          correctAnswer: null,
        });
        continue;
      }

      const isCorrect =
        submitted.answer &&
        submitted.answer.trim().toLowerCase() ===
          question.answer.trim().toLowerCase();

      if (isCorrect) {
        correctCount += 1;
        results.push({
          questionId: submitted.questionId,
          status: 'correct',
          userAnswer: submitted.answer,
          correctAnswer: question.answer,
          analysis: question.analysis,
        });
      } else {
        // Add to wrong book
        const existingEntry = exam.wrongBook.find(
          (w) =>
            w.questionId &&
            w.questionId.toString() === submitted.questionId
        );

        if (existingEntry) {
          existingEntry.wrongCount += 1;
          existingEntry.lastWrongTime = new Date();
        } else {
          exam.wrongBook.push({
            questionId: submitted.questionId,
            wrongCount: 1,
            lastWrongTime: new Date(),
          });
        }

        results.push({
          questionId: submitted.questionId,
          status: 'wrong',
          userAnswer: submitted.answer,
          correctAnswer: question.answer,
          analysis: question.analysis,
        });
      }
    }

    await exam.save();

    const totalQuestions = exam.questions.length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    success(res, {
      score: Math.round(score * 100) / 100,
      correctCount,
      totalQuestions,
      answeredCount: answers.length,
      results,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateQuestions,
  create,
  getAll,
  getOne,
  delete: remove,
  addToWrongBook,
  getWrongBook,
  removeFromWrongBook,
  submitAnswer,
};
