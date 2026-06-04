const router = require('express').Router();
const ctrl = require('../controllers/codeController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/', authenticate, ctrl.save);
router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.delete);
router.post('/:id/comments', authenticate, aiLimiter, ctrl.addComments);
router.post('/:id/format', authenticate, ctrl.format);
router.post('/:id/share', authenticate, ctrl.share);

module.exports = router;
