const router = require('express').Router();
const ctrl = require('../controllers/examController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/generate', authenticate, upload.single('file'), ctrl.generateQuestions);
router.get('/', authenticate, ctrl.getAll);
router.get('/wrong-book', authenticate, ctrl.getWrongBook);
router.get('/:id', authenticate, ctrl.getOne);
router.delete('/:id', authenticate, ctrl.delete);
router.post('/:id/submit', authenticate, ctrl.submitAnswer);
router.post('/wrong-book/:questionId', authenticate, ctrl.addToWrongBook);
router.delete('/wrong-book/:questionId', authenticate, ctrl.removeFromWrongBook);

module.exports = router;
