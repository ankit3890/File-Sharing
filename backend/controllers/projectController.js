const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res, next) => {
    try {
        const { name } = req.body;
        const project = await Project.create({
            name,
            createdBy: req.user._id
        });

         if (req.logAction) {
            await req.logAction({
                action: 'CREATE_PROJECT',
                project: project._id,
                details: `Created project ${name}`
            });
        }

        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Get Projects (Admin sees all, User sees assigned)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
    try {
        if (req.user.role === 'admin') {
            const projects = await Project.find({}).populate('members', 'userId role');
            
            // Inject Admins into all projects
            const admins = await User.find({ role: 'admin' }).select('userId role');
            
            // Convert to plain object to modify easily
            const projectsData = projects.map(p => p.toObject());

            projectsData.forEach(project => {
                const memberIds = new Set(project.members.map(m => m._id.toString()));
                admins.forEach(admin => {
                    if (!memberIds.has(admin._id.toString())) {
                        project.members.push(admin.toObject());
                        memberIds.add(admin._id.toString());
                    }
                });
            });

            res.json(projectsData);
        } else {
            // For regular users, we also need to populate members if the frontend expects it
            // checking usage: the user dashboard typically just lists projects. 
            // But if we want consistency, let's leave it simple for now as the issue reported is for Admin View.
            const projects = await Project.find({ members: req.user._id });
            res.json(projects);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Add member to project
// @route   PUT /api/projects/:id/members
// @access  Private/Admin
const addMember = async (req, res, next) => {
    try {
        const { userId } = req.body; // User's DB ID
        const project = await Project.findById(req.params.id);
        const user = await User.findById(userId);

        if (project && user) {
            if (!project.members.includes(userId)) {
                project.members.push(userId);
                await project.save();
                
                // Add project to user's projects array too for easier lookup? 
                // Model has `projects` array in User.
                if (!user.projects.includes(project._id)) {
                    user.projects.push(project._id);
                    await user.save();
                }

                 if (req.logAction) {
                    await req.logAction({
                        action: 'ADD_MEMBER',
                        project: project._id,
                        targetUser: user._id,
                        details: `Added ${user.userId} to ${project.name}`
                    });
                }
            }
            res.json(project);
        } else {
            res.status(404).json({ message: 'Project or User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private/Admin
const removeMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        const user = await User.findById(req.params.userId);

        if (project && user) {
            project.members = project.members.filter(m => m.toString() !== req.params.userId);
            await project.save();

            user.projects = user.projects.filter(p => p.toString() !== req.params.id);
            await user.save();

             if (req.logAction) {
                await req.logAction({
                    action: 'REMOVE_MEMBER',
                    project: project._id,
                    targetUser: user._id,
                    details: `Removed ${user.userId} from ${project.name}`
                });
            }

            res.json(project);
        } else {
            res.status(404).json({ message: 'Project or User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update project (Name/Description)
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.name = name || project.name;
        project.description = description !== undefined ? description : project.description;
        
        await project.save();

         if (req.logAction) {
            await req.logAction({
                action: 'UPDATE_PROJECT',
                project: project._id,
                details: `Updated project ${project.name}`
            });
        }
        res.json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (project) {
            await project.deleteOne();
             if (req.logAction) {
                await req.logAction({
                    action: 'DELETE_PROJECT',
                    project: project._id,
                    details: `Deleted project ${project.name}`
                });
            }
            res.json({ message: 'Project removed' });
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get Single Project with Members
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id).populate('members', 'userId role lastActive');
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // User requested that admins should be default members of any project.
        // We fetch all admins and append them to the members list if they aren't already there.
        const admins = await User.find({ role: 'admin' }).select('userId role lastActive');
        
        const memberIds = new Set(project.members.map(m => m._id.toString()));
        
        admins.forEach(admin => {
            if (!memberIds.has(admin._id.toString())) {
                project.members.push(admin);
                memberIds.add(admin._id.toString());
            }
        });

        if (req.user.role !== 'admin' && !memberIds.has(req.user._id.toString())) {
             return res.status(403).json({ message: 'Not authorized for this project' });
        }
        res.json(project);
    } catch (error) {
        next(error);
    }
};

module.exports = { createProject, getProjects, addMember, removeMember, deleteProject, getProjectById, updateProject };
