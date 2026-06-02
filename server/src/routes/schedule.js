const router = require('express').Router();
const ctrl = require('../controllers/scheduleController');
const { authenticate } = require('../middleware/auth');

router.post('/import', authenticate, ctrl.importFromText);
router.get('/', authenticate, ctrl.getCurrent);
router.post('/course', authenticate, ctrl.addCourse);
router.put('/course/:courseId', authenticate, ctrl.updateCourse);
router.delete('/course/:courseId', authenticate, ctrl.deleteCourse);
router.get('/day/:day', authenticate, ctrl.getCoursesByDay);
router.get('/wallpaper', authenticate, ctrl.generateWallpaper);

module.exports = router;
