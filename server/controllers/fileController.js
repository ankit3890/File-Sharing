const File = require('../models/File');
const User = require('../models/User');
const Project = require('../models/Project');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Encryption Settings
const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.ADMIN_SECRET || 'fallback_secret';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET).digest();

console.log('--- ENCRYPTION SETUP ---');
console.log('Secret used:', SECRET === 'fallback_secret' ? 'FALLBACK' : 'ENV_VAR');
console.log('Key Hash:', crypto.createHash('md5').update(ENCRYPTION_KEY).digest('hex'));
console.log('------------------------'); 

// @desc    Upload File
// @route   POST /api/files
// @access  Private
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { projectId, description } = req.body;
        const fileSize = req.file.size;

        // 1. Check Project Membership
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!project.members.includes(req.user._id) && req.user.role !== 'admin') {
             return res.status(403).json({ message: 'Not a member of this project' });
        }

        // 2. Check User Storage Limit (100MB = 100 * 1024 * 1024)
        const STORAGE_LIMIT = 100 * 1024 * 1024;
        // Optimization: Could cache storageUsed in User model (which we do)
        // Refresh it? Nah, trust DB.
        const user = await User.findById(req.user._id);
        if (user.storageUsed + fileSize > STORAGE_LIMIT) {
            return res.status(400).json({ message: 'Storage limit exceeded (100MB)' });
        }

        // 3. Encrypt and Save
        const iv = crypto.randomBytes(16);
        const filename = `${Date.now()}-${req.file.originalname}`;
        const filePath = path.join(__dirname, '../uploads', filename + '.enc');


        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        console.log(`[UPLOAD] Encrypting ${filename} | IV: ${iv.toString('hex')} | KeyHash: ${crypto.createHash('md5').update(ENCRYPTION_KEY).digest('hex')}`);
        
        // We have buffer in req.file.buffer (memory storage)
        const encryptedBuffer = Buffer.concat([
            cipher.update(req.file.buffer),
            cipher.final()
        ]);

        console.log(`[UPLOAD] Writing ${encryptedBuffer.length} bytes to ${filePath}`);
        fs.writeFileSync(filePath, encryptedBuffer);

        // 4. Update Database
        const newFile = await File.create({
            filename: filename, // stored filename
            originalName: req.file.originalname,
            path: filePath,
            size: fileSize,
            mimetype: req.file.mimetype,
            iv: iv.toString('hex'),
            uploader: req.user._id,
            project: projectId,
            description: description || ''
        });

        // Update User Storage
        user.storageUsed += fileSize;
        await user.save();

         if (req.logAction) {
            await req.logAction({
                action: 'UPLOAD_FILE',
                file: newFile._id,
                project: projectId,
                details: `Uploaded ${req.file.originalname} (${(fileSize/1024/1024).toFixed(2)} MB)`
            });
        }

        res.status(201).json(newFile);

    } catch (error) {
        next(error);
    }
};

// @desc    Generate Download Token
// @route   GET /api/files/:id/download_token
// @access  Private
const getDownloadToken = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Check Permissions
        // Admin OR Project Member
        const project = await Project.findById(file.project);
        if (req.user.role !== 'admin' && !project.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Generate Short-lived Token (1 minute)
        const token = jwt.sign(
            { fileId: file._id, userId: req.user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1m' }
        );

        res.json({ token });

    } catch (error) {
        next(error);
    }
};

// @desc    Download/Preview File (Stream)
// @route   GET /api/files/download/:token
// @access  Public (protected by token)
const downloadFile = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { preview } = req.query; // ?preview=true for inline

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).send('Invalid or expired download token');
        }

        const file = await File.findById(decoded.fileId);
        if (!file) return res.status(404).send('File not found');

        // Check file existence on disk
        if (!fs.existsSync(file.path)) {
            return res.status(404).send('File missing on disk');
        }

        const iv = Buffer.from(file.iv, 'hex');
        console.log(`[DOWNLOAD] Decrypting ${file.filename} | IV: ${file.iv} | KeyHash: ${crypto.createHash('md5').update(ENCRYPTION_KEY).digest('hex')}`);
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

        const input = fs.createReadStream(file.path);
        
        // Headers
        res.setHeader('Content-Type', file.mimetype);
        if (preview) {
             res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
        } else {
             res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        }

        // Pipe: Input (File) -> Decipher -> Res (HTTP)
        input.on('error', (err) => {
             console.error('Stream Input Error:', err);
             if (!res.headersSent) res.status(500).end();
        });

        decipher.on('error', (err) => {
             console.error('Stream Decryption Error:', err); // Likely wrong key
             if (!res.headersSent) res.status(500).send('Decryption failed');
        });

        res.on('error', (err) => {
             console.error('Stream Response Error:', err);
        });

        input.pipe(decipher).pipe(res);

    } catch (error) {
        // Handling stream errors is tricky after headers sent, but basic try/catch helps
        console.error('Download error:', error);
        if (!res.headersSent) res.status(500).send('Server Error during download');
    }
};


// @desc    Get Files for Project (or All for Admin?)
// @route   GET /api/files/project/:projectId
// @access  Private
const getProjectFiles = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);
        
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (req.user.role !== 'admin' && !project.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this project' });
        }

        const files = await File.find({ project: projectId }).populate('uploader', 'userId');
        res.json(files);

    } catch (error) {
        next(error);
    }
};

// @desc    Delete File
// @route   DELETE /api/files/:id
// @access  Private (Owner or Admin)
const deleteFile = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Permission: Admin OR Uploader
        if (req.user.role !== 'admin' && file.uploader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this file' });
        }

        if (req.user.role === 'admin' && file.uploader.toString() !== req.user._id.toString()) {
            // Soft Delete for Admin (so users know it was deleted by admin)
            file.deletedByAdmin = true;
            // Optionally, we could remove the file from disk? Or keep it?
            // "Show Deleted by Admin label". Usually implies the entry stays. 
            // If we keep the entry, we should probably Keep the file? Or delete the file content but keep metadata?
            // "Show label" -> Metadata must exist.
            // Let's keep the file on disk for safety unless explicitly asked to purge.
            // Actually, if it's "Deleted", usually access is revoked.
            // Let's keep it simple: Mark metadata. File content remains but maybe inaccessible?
            // Prompt says: "Show 'Deleted by Admin' label". 
            // I will just mark it.
            await file.save();
             if (req.logAction) {
                await req.logAction({
                    action: 'DELETE_FILE_ADMIN',
                    file: file._id,
                    project: file.project,
                    details: `Admin marked ${file.originalName} as deleted`
                });
            }
             res.json({ message: 'File marked as deleted by admin' });
        } else {
             // Hard Delete for Owner (or Admin deleting own file)
            // Delete from Disk
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            // Decrement Storage for Uploader
            const uploader = await User.findById(file.uploader);
            if (uploader) {
                uploader.storageUsed = Math.max(0, uploader.storageUsed - file.size);
                await uploader.save();
            }

             if (req.logAction) {
                await req.logAction({
                    action: 'DELETE_FILE',
                    file: file._id,
                    project: file.project,
                    details: `Deleted ${file.originalName}`
                });
            }

            await file.deleteOne();
            res.json({ message: 'File deleted' });
        }

    } catch (error) {
        next(error);
    }
};

// @desc    Update File Metadata (Description)
// @route   PUT /api/files/:id
// @access  Private (Owner or Admin)
const updateFile = async (req, res, next) => {
    try {
        const { description } = req.body;
        const file = await File.findById(req.params.id);
        
        if (!file) return res.status(404).json({ message: 'File not found' });

        if (req.user.role !== 'admin' && file.uploader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        file.description = description;
        file.isEdited = true;
        await file.save();

         if (req.logAction) {
            await req.logAction({
                action: 'EDIT_FILE',
                file: file._id,
                project: file.project,
                details: `Updated description for ${file.originalName}`
            });
        }

        res.json(file);
    } catch (error) {
        next(error);
    }
};

// @desc    Preview File (Stream inline) 
// @route   GET /api/files/:id/preview
// @access  Private
const getPreview = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Check Permissions
        const project = await Project.findById(file.project);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        if (req.user.role !== 'admin' && !project.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check file existence on disk
        if (!fs.existsSync(file.path)) {
            return res.status(404).send('File missing on disk');
        }

        const iv = Buffer.from(file.iv, 'hex');
        console.log(`[PREVIEW] Decrypting ${file.filename} | IV: ${file.iv} | KeyHash: ${crypto.createHash('md5').update(ENCRYPTION_KEY).digest('hex')}`);
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        const input = fs.createReadStream(file.path);
        
        res.setHeader('Content-Type', file.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);

        input.on('error', (err) => {
             console.error('Preview Input Error:', err);
             if (!res.headersSent) res.status(500).end();
        });

        decipher.on('error', (err) => {
             console.error('Preview Decryption Error:', err);
             if (!res.headersSent) res.status(500).send('File corrupt or decryption failed');
        });

        res.on('error', (err) => {
             console.error('Preview Response Error:', err);
        });

        input.pipe(decipher).pipe(res);

    } catch (error) {
        // console.error('Preview error:', error);
        if (!res.headersSent) res.status(500).send('Server Error during preview');
    }
};

// @desc    Get All Files for Current User
// @route   GET /api/files/mine
// @access  Private
const getUserFiles = async (req, res, next) => {
    try {
        console.log(`[getUserFiles] Fetching files for user: ${req.user._id}`);
        const files = await File.find({ uploader: req.user._id }).sort({ uploadedAt: -1 }).populate('uploader', 'userId');
        console.log(`[getUserFiles] Found ${files.length} files`);
        res.json(files);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete All Files for Current User (Password Protected)
// @route   DELETE /api/files/mine
// @access  Private
const deleteAllUserFiles = async (req, res, next) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        // Verify Password
        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const files = await File.find({ uploader: req.user._id });

        // Delete from Disk and Database
        for (const file of files) {
            if (fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    console.error(`Failed to delete file ${file.path}:`, err);
                }
            }
            await file.deleteOne();
        }

        // Reset Storage
        user.storageUsed = 0;
        await user.save();

        if (req.logAction) {
            await req.logAction({
                action: 'BULK_DELETE',
                details: `User deleted all their files (${files.length} files)`
            });
        }

        res.json({ message: `Successfully deleted ${files.length} files` });

    } catch (error) {
        next(error);
    }
};

module.exports = { uploadFile, getDownloadToken, downloadFile, getProjectFiles, deleteFile, updateFile, getPreview, getUserFiles, deleteAllUserFiles };

