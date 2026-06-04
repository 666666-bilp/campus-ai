const router = require('express').Router();
const ctrl = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/upload', authenticate, upload.single('file'), ctrl.upload);
router.get('/', authenticate, ctrl.getAll);
router.get('/search', authenticate, ctrl.search);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/:id/extract', authenticate, upload.single('file'), ctrl.extractText);
router.post('/:id/summarize', authenticate, ctrl.summarize);
router.post('/:id/references', authenticate, ctrl.generateReferences);
router.delete('/:id', authenticate, ctrl.delete);

module.exports = router;
