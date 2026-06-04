const router = require('express').Router();
const ctrl = require('../controllers/experimentController');
const { authenticate } = require('../middleware/auth');

router.post('/generate', authenticate, ctrl.generate);
router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.delete);
router.post('/chart', authenticate, ctrl.generateChart);
router.post('/fit', authenticate, ctrl.fitData);

module.exports = router;
