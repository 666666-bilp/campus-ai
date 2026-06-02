const router = require('express').Router();
const ctrl = require('../controllers/paperController');
const { authenticate } = require('../middleware/auth');
const { paperRules, validate } = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/', authenticate, paperRules, validate, ctrl.create);
router.get('/', authenticate, ctrl.getAll);
router.post('/:id/outline', authenticate, ctrl.generateOutline);
router.post('/:id/section', authenticate, ctrl.generateSection);
router.post('/:id/generate', authenticate, aiLimiter, ctrl.generateFull);
router.get('/:id/stream', authenticate, ctrl.streamGenerate);
router.get('/:id', authenticate, ctrl.getOne);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.delete);
router.get('/:id/export/:format', authenticate, ctrl.exportPaper);

module.exports = router;
