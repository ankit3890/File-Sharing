const express = require('express');
const router = express.Router();
const { loginUser, changePassword, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const logger = require('../middleware/logger');

router.post('/login', logger, loginUser);
router.put('/change-password', protect, logger, changePassword);
router.get('/me', protect, getMe);

module.exports = router;
