const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/auth');

// User Dashboard Routes
router.get('/user-summary', protect, dashboardController.getUserSummary);
router.get('/user-activity', protect, dashboardController.getUserActivity);
router.get('/user-recent-files', protect, dashboardController.getUserRecentFiles);

// Admin Dashboard Routes
router.get('/admin-summary', protect, admin, dashboardController.getAdminSummary);
router.get('/admin-queue', protect, admin, dashboardController.getAdminQueue);
// router.get('/admin-storage', protect, admin, dashboardController.getAdminStorage); // Using queue for now

module.exports = router;
