const router = require('express').Router();
const ctrl = require('../controllers/latexController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/generate', authenticate, aiLimiter, ctrl.generate);
router.post('/render', authenticate, ctrl.render);

module.exports = router;
