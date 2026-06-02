const router = require('express').Router();
const ctrl = require('../controllers/englishController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/bilingual', authenticate, aiLimiter, ctrl.bilingualReading);
router.post('/oral/start', authenticate, ctrl.oralPracticeStart);
router.post('/oral/chat', authenticate, aiLimiter, ctrl.oralPracticeChat);
router.get('/oral/history', authenticate, ctrl.oralPracticeHistory);
router.post('/cet', authenticate, aiLimiter, ctrl.cetAnalysis);

module.exports = router;
