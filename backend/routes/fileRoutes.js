const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, getDownloadToken, downloadFile, getProjectFiles, deleteFile, updateFile, getPreview, getUserFiles, deleteAllUserFiles } = require('../controllers/fileController');
const { protect, admin } = require('../middleware/auth');
const logger = require('../middleware/logger');

// Multer Config: Memory Storage (we encrypt buffer before saving)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB app limit (Vercel Pro max is 15MB including overhead)
});

// Routes
router.post('/', protect, upload.single('file'), logger, uploadFile);
router.get('/mine', protect, getUserFiles);
router.delete('/mine', protect, logger, deleteAllUserFiles);
router.get('/project/:projectId', protect, getProjectFiles);
router.delete('/:id', protect, logger, deleteFile);
router.put('/:id', protect, logger, updateFile);

// Secure Download Flow
router.get('/:id/download_token', protect, getDownloadToken);
router.get('/download/:token', downloadFile); // Note: public access, validated by token
router.get('/:id/preview', protect, getPreview); // Direct authenticated preview

module.exports = router;
