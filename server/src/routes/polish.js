const router = require('express').Router();
const ctrl = require('../controllers/polishController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/', authenticate, aiLimiter, ctrl.polishText);
router.get('/history', authenticate, ctrl.getHistory);

module.exports = router;
