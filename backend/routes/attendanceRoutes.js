const express = require('express');
const router = express.Router();
const { 
    markAttendance, 
    getUserAttendance, 
    getAllAttendance, 
    updateAttendanceStatus, 
    downloadReport 
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/auth');
const logger = require('../middleware/logger');

// User Routes
router.post('/mark', protect, logger, markAttendance);
router.get('/my', protect, getUserAttendance);

// Admin Routes
router.get('/all', protect, admin, getAllAttendance);
router.put('/:id/status', protect, admin, logger, updateAttendanceStatus);
router.get('/report/download', protect, admin, logger, downloadReport);

module.exports = router;
