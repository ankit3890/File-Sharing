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

// User Routes
router.post('/mark', protect, markAttendance);
router.get('/my', protect, getUserAttendance);

// Admin Routes
router.get('/all', protect, admin, getAllAttendance);
router.put('/:id/status', protect, admin, updateAttendanceStatus);
router.get('/report/download', protect, admin, downloadReport);

module.exports = router;
