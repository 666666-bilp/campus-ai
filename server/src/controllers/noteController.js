const { success, error, paginated } = require('../utils/response');
const aiService = require('../services/aiService');
const Note = require('../models/Note');

/**
 * Create a new note.
 * POST /api/notes
 */
const create = async (req, res, next) => {
  try {
    const note = await Note.create({
      ...req.body,
      userId: req.user._id,
    });

    success(res, note, '笔记创建成功', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all notes for the current user with pagination, folder filter, and
 * search.
 * GET /api/notes
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      folder,
      search,
      sort = '-updatedAt',
    } = req.query;

    const query = { userId: req.user._id };

    if (folder) {
      query.folder = folder;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select(
          'title folder tags isPinned wordCount createdAt updatedAt'
        ),
      Note.countDocuments(query),
    ]);

    paginated(res, notes, Number(page), Number(limit), total);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single note by id.
 * GET /api/notes/:id
 */
const getOne = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return error(res, '笔记不存在', 404);
    }

    success(res, note);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a note.
 * PUT /api/notes/:id
 */
const update = async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!note) {
      return error(res, '笔记不存在', 404);
    }

    success(res, note, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle the pin status of a note.
 * PATCH /api/notes/:id/pin
 */
const togglePin = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return error(res, '笔记不存在', 404);
    }

    note.isPinned = !note.isPinned;
    await note.save();

    success(res, note);
  } catch (err) {
    next(err);
  }
};

/**
 * Generate an AI summary for a note's content.
 * POST /api/notes/:id/summarize
 */
const summarize = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return error(res, '笔记不存在', 404);
    }

    const result = await aiService.generateNoteSummary(note.content);
    const summary = (result.success && result.data) ? result.data : (result.error || '');
    note.aiSummary = summary;
    await note.save();

    success(res, { summary });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a note.
 * DELETE /api/notes/:id
 */
const remove = async (req, res, next) => {
  try {
    await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * Get all distinct folder names for the current user.
 * GET /api/notes/folders
 */
const getFolders = async (req, res, next) => {
  try {
    const folders = await Note.distinct('folder', {
      userId: req.user._id,
    });

    success(res, folders);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  togglePin,
  summarize,
  delete: remove,
  getFolders,
};
