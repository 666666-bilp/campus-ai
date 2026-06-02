const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.get('/profile', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, ctrl.updateProfile);
router.get('/stats', authenticate, ctrl.getStats);
router.delete('/account', authenticate, ctrl.deleteAccount);

module.exports = router;
