const express = require('express');
const router = express.Router();
const { getLogs, getStats, impersonateUser, clearLogs } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');
const logger = require('../middleware/logger');

router.get('/logs', protect, admin, getLogs);
router.delete('/logs', protect, admin, logger, clearLogs);
router.get('/stats', protect, admin, getStats);
router.post('/impersonate', protect, admin, logger, impersonateUser);

module.exports = router;
