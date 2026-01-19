const express = require('express');
const router = express.Router();
const { createProject, getProjects, addMember, removeMember, deleteProject, getProjectById } = require('../controllers/projectController');
const { protect, admin } = require('../middleware/auth');
const logger = require('../middleware/logger');

router.route('/')
    .get(protect, getProjects)
    .post(protect, admin, logger, createProject);

router.route('/:id')
    .get(protect, getProjectById)
    .delete(protect, admin, logger, deleteProject);

router.route('/:id/members')
    .put(protect, admin, logger, addMember);

router.route('/:id/members/:userId')
    .delete(protect, admin, logger, removeMember);

module.exports = router;
