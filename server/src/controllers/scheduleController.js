const { success, error } = require('../utils/response');
const aiService = require('../services/aiService');
const Schedule = require('../models/Schedule');

/**
 * Create a new schedule manually.
 * POST /api/schedule
 */
const create = async (req, res, next) => {
  try {
    const schedule = await Schedule.create({
      ...req.body,
      userId: req.user._id,
    });

    success(res, schedule, '课表创建成功', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get the most recent schedule for the current user.
 * GET /api/schedule/current
 */
const getCurrent = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ userId: req.user._id }).sort(
      '-createdAt'
    );

    success(res, schedule || { courses: [] });
  } catch (err) {
    next(err);
  }
};

/**
 * Import courses by parsing raw academic-affairs text via AI.
 * POST /api/schedule/import
 */
const importFromText = async (req, res, next) => {
  try {
    const { text, semester } = req.body;

    if (!text) {
      return error(res, '请粘贴教务文本', 400);
    }

    const result = await aiService.parseSchedule(text);
    if (!result.success) {
      return error(res, '课表解析失败: ' + (result.error || '未知错误'), 500);
    }

    const { semester: parsedSemester, courses } = result.data;
    let schedule = await Schedule.findOne({ userId: req.user._id }).sort(
      '-createdAt'
    );

    if (schedule) {
      schedule.courses = courses || [];
      schedule.rawImportText = text;
      schedule.semester = semester || parsedSemester || schedule.semester;
      await schedule.save();
    } else {
      schedule = await Schedule.create({
        userId: req.user._id,
        semester: semester || parsedSemester || '',
        courses: courses || [],
        rawImportText: text,
      });
    }

    success(res, schedule, '课表导入成功');
  } catch (err) {
    next(err);
  }
};

/**
 * Add a single course to the current schedule.
 * POST /api/schedule/course
 */
const addCourse = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ userId: req.user._id }).sort(
      '-createdAt'
    );

    if (!schedule) {
      return error(res, '请先创建课表', 404);
    }

    schedule.courses.push(req.body);
    await schedule.save();

    success(res, schedule, '课程添加成功');
  } catch (err) {
    next(err);
  }
};

/**
 * Update a single course within the current schedule.
 * PUT /api/schedule/course/:courseId
 */
const updateCourse = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ userId: req.user._id }).sort(
      '-createdAt'
    );

    if (!schedule) {
      return error(res, '请先创建课表', 404);
    }

    const course = schedule.courses.id(req.params.courseId);
    if (!course) {
      return error(res, '课程不存在', 404);
    }

    Object.assign(course, req.body);
    await schedule.save();

    success(res, schedule, '课程更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a single course from the current schedule.
 * DELETE /api/schedule/course/:courseId
 */
const deleteCourse = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ userId: req.user._id }).sort(
      '-createdAt'
    );

    if (!schedule) {
      return error(res, '请先创建课表', 404);
    }

    const course = schedule.courses.id(req.params.courseId);
    if (!course) {
      return error(res, '课程不存在', 404);
    }

    course.deleteOne();
    await schedule.save();

    success(res, schedule, '课程删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * Get courses filtered by day of week (1-7).
 * GET /api/schedule/day/:day
 */
const getCoursesByDay = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ userId: req.user._id }).sort(
      '-createdAt'
    );
    const day = parseInt(req.params.day, 10);

    const courses = schedule
      ? schedule.courses.filter((c) => c.dayOfWeek === day)
      : [];

    success(res, courses);
  } catch (err) {
    next(err);
  }
};

/**
 * Return the current schedule data for wallpaper generation.
 * The frontend is responsible for rendering via html2canvas.
 * GET /api/schedule/wallpaper
 */
const generateWallpaper = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ userId: req.user._id }).sort(
      '-createdAt'
    );

    if (!schedule) {
      return error(res, '请先创建课表', 404);
    }

    success(res, { schedule });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  getCurrent,
  importFromText,
  addCourse,
  updateCourse,
  deleteCourse,
  getCoursesByDay,
  generateWallpaper,
};
