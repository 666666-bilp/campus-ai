const router = require('express').Router();
const ctrl = require('../controllers/noteController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/', authenticate, ctrl.create);
router.get('/', authenticate, ctrl.getAll);
router.get('/folders', authenticate, ctrl.getFolders);
router.get('/:id', authenticate, ctrl.getOne);
router.put('/:id', authenticate, ctrl.update);
router.patch('/:id/pin', authenticate, ctrl.togglePin);
router.post('/:id/summarize', authenticate, aiLimiter, ctrl.summarize);
router.delete('/:id', authenticate, ctrl.delete);

module.exports = router;
