const express = require('express');
const router = express.Router();
const { getLogs, getStats, impersonateUser, clearLogs } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.get('/logs', protect, admin, getLogs);
router.delete('/logs', protect, admin, clearLogs);
router.get('/stats', protect, admin, getStats);
router.post('/impersonate', protect, admin, impersonateUser);

module.exports = router;
