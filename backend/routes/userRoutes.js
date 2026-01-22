const express = require('express');
const router = express.Router();
const { registerUser, getUsers, deleteUser, updateProfile } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');
const logger = require('../middleware/logger');

router.put('/profile', protect, updateProfile);

router.route('/')
    .post(protect, admin, logger, registerUser)
    .get(protect, admin, getUsers);

router.route('/:id')
    .delete(protect, admin, logger, deleteUser);

module.exports = router;
