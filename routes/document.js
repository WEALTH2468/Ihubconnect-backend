const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const multer = require('../middlewares/multer-config');
const documentCtrl = require('../controllers/document');

router.get('/folders/:folderId', auth, documentCtrl.getDocuments);
router.get('/all', auth, documentCtrl.getFoldersAndFiles);
router.post('/', auth, multer, documentCtrl.addDocument);
router.patch(
    '/:id',
    auth,
    multer,
    documentCtrl.updateDocument
);
router.delete(
    '/:id',
    auth,
    documentCtrl.deleteDocument
);

module.exports = router;
