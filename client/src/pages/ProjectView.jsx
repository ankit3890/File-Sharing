import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import UploadModal from '../components/UploadModal';
import FilePreviewModal from '../components/FilePreviewModal';
import MembersPanel from '../components/MembersPanel';
import { File, MoreVertical, Trash2, Eye, Download, Edit2, UploadCloud, Clock, HardDrive, Shield, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const ProjectView = () => {
    const { id } = useParams();
    const { user, refreshUser } = useAuth();
    const [project, setProject] = useState(null);
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // New State for Search and Filters
    const [fileSearch, setFileSearch] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [editDesc, setEditDesc] = useState('');
    const [editName, setEditName] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleEditProject = () => {
        setEditName(project.name || '');
        setEditDesc(project.description || '');
        setIsEditingProject(true);
    };

    const saveProjectDesc = async () => {
        try {
            const res = await api.put(`/projects/${project._id}`, { name: editName, description: editDesc });
            setProject(prev => ({ ...prev, ...res.data }));
            setIsEditingProject(false);
        } catch (error) {
            console.error('Failed to update project:', error);
            const msg = error.response?.data?.message || 'Failed to update project details';
            alert(msg);
        }
    };

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const [projectRes, filesRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/files/project/${id}`)
            ]);
            setProject(projectRes.data);
            setFiles(filesRes.data);
        } catch (error) {
            console.error('Failed to fetch project data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = () => {
        fetchProjectData();
        refreshUser();
    };

    const handleDelete = async (fileId) => {
        if (window.confirm('Delete this file?')) {
            try {
                await api.delete(`/files/${fileId}`);
                fetchProjectData();
                refreshUser();
            } catch (error) {
                alert('Delete failed');
            }
        }
    };

    const handleEdit = async (file) => {
        const newDesc = prompt('Enter new description:', file.description);
        if (newDesc !== null && newDesc !== file.description) {
            try {
                await api.put(`/files/${file._id}`, { description: newDesc });
                fetchProjectData();
            } catch (error) {
                alert('Update failed');
            }
        }
    };

    const handleDownload = async (fileId, fileName) => {
        try {
            const res = await api.get(`/files/${fileId}/download_token`);
            const { token } = res.data;
            window.location.href = `/api/files/download/${token}`;
        } catch (error) {
            console.error('Download failed:', error);
            alert('Could not download file.');
        }
    };

    const handleMemberSelect = (member) => {
        if (selectedMember?._id === member._id) {
            setSelectedMember(null); // Deselect
        } else {
            setSelectedMember(member);
        }
    };

    // Filter Logic
    const visibleFiles = files.filter(f => {
        // 1. Soft Delete Check
        const isDeletedVisible = !f.deletedByAdmin || user.role === 'admin';
        // 2. Search Text Check
        const matchesSearch = f.originalName.toLowerCase().includes(fileSearch.toLowerCase());
        // 3. Member Filter Check
        const matchesMember = selectedMember ? (f.uploader?._id === selectedMember._id) : true;
        
        return isDeletedVisible && matchesSearch && matchesMember;
    });

    if (loading) return <div className="p-8 text-center">Loading Project...</div>;
    if (!project) return <div className="p-8 text-center">Project not found</div>;

    return (
        <div style={{ padding: '1rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                gap: isMobile ? '1rem' : 0,
                marginBottom: '1.5rem' 
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{project.name}</h1>
                        {user.role === 'admin' && (
                            <button 
                                onClick={handleEditProject} 
                                className="btn-icon" 
                                title="Edit Description"
                                style={{ color: '#94a3b8' }}
                            >
                                <Edit2 size={18} />
                            </button>
                        )}
                    </div>
                    {isEditingProject ? (
                        <div style={{ marginTop: '0.5rem' }}>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    background: 'rgba(0,0,0,0.2)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    color: 'white', 
                                    padding: '0.5rem', 
                                    borderRadius: '0.5rem',
                                    marginBottom: '0.5rem',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem'
                                }}
                                placeholder="Project Name"
                            />
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    background: 'rgba(0,0,0,0.2)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    color: 'white', 
                                    padding: '0.5rem', 
                                    borderRadius: '0.5rem',
                                    marginBottom: '0.5rem'
                                }}
                                rows={3}
                                placeholder="Description"
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={saveProjectDesc} className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.25rem', background: '#3b82f6', border: 'none', color: 'white' }}>Save</button>
                                <button onClick={() => setIsEditingProject(false)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid #64748b', color: '#94a3b8', borderRadius: '0.25rem' }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>{project.description || 'No description'}</p>
                    )}
                </div>
                <button 
                    onClick={() => setIsUploadOpen(true)} 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}
                >
                    <UploadCloud size={20} /> Upload File
                </button>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr', 
                gap: '1.5rem', 
                flex: 1, 
                overflow: isMobile ? 'auto' : 'hidden',
                gridTemplateRows: isMobile ? 'auto 1fr' : '1fr' 
            }}>
                
                {/* File List (Vertical) */}
                <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Search and Filter Bar */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                         <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                placeholder="Search files by name..." 
                                value={fileSearch}
                                onChange={(e) => setFileSearch(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.6rem 0.6rem 0.6rem 2.5rem', 
                                    borderRadius: '0.5rem', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    background: 'rgba(0,0,0,0.2)', 
                                    color: 'white' 
                                }}
                            />
                        </div>
                        {selectedMember && (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem', 
                                background: 'rgba(59, 130, 246, 0.2)', 
                                padding: '0.4rem 0.8rem', 
                                borderRadius: '2rem', 
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                fontSize: '0.85rem'
                            }}>
                                <span>Filtered by: <strong>{selectedMember.userId}</strong></span>
                                <button 
                                    onClick={() => setSelectedMember(null)}
                                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ 
                        padding: '0.75rem 1rem', 
                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? 'auto 1fr auto' : 'minmax(40px, auto) 2fr 1fr 1fr 1fr', 
                        gap: '1rem', 
                        color: '#94a3b8', 
                        fontSize: '0.85rem', 
                        fontWeight: 600 
                    }}>
                        <span>Type</span>
                        <span>Name</span>
                        {!isMobile && <span>Size / Date</span>}
                        {!isMobile && <span>Uploader</span>}
                        <span style={{ textAlign: 'right' }}>Actions</span>
                    </div>
                    
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {visibleFiles.length === 0 ? (
                            <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                {files.length === 0 ? 'No files uploaded yet.' : 'No matching files found.'}
                            </p>
                        ) : (
                            visibleFiles.map(file => (
                                <motion.div 
                                    key={file._id} 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: file.deletedByAdmin ? 0.6 : 1 }}
                                    className="file-row"
                                    style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: isMobile ? 'auto 1fr auto' : 'minmax(40px, auto) 2fr 1fr 1fr 1fr', 
                                        gap: '1rem', 
                                        padding: '1rem', 
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        alignItems: 'center',
                                        background: file.deletedByAdmin ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <File size={24} style={{ color: '#94a3b8' }} />
                                    </div>
                                    
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <p style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.originalName}>
                                                {file.originalName}
                                            </p>
                                            {file.deletedByAdmin && (
                                                <span style={{ fontSize: '0.65rem', background: '#ef4444', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>DELETED</span>
                                            )}
                                        </div>
                                        {file.description && <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{file.description}</p>}
                                        {isMobile && (
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                                                 {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {!isMobile && (
                                        <div>
                                            <p style={{ fontSize: '0.85rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(file.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                    )}

                                    {!isMobile && (
                                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                                            {file.uploader?.userId}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        {!file.deletedByAdmin && (
                                            <>
                                                <button onClick={() => setSelectedFile(file)} className="btn-icon" title="Preview"><Eye size={18} /></button>
                                                <button onClick={() => handleDownload(file._id, file.originalName)} className="btn-icon" title="Download"><Download size={18} /></button>
                                            </>
                                        )}
                                        
                                        {(user.role === 'admin' || (user._id === file.uploader?._id && !file.deletedByAdmin)) && (
                                            <>
                                                {!file.deletedByAdmin && (
                                                    <button onClick={() => handleEdit(file)} className="btn-icon" title="Edit"><Edit2 size={18} /></button>
                                                )}
                                                <button onClick={() => handleDelete(file._id)} className="btn-icon" style={{ color: '#ef4444' }} title="Delete"><Trash2 size={18} /></button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Members Sidebar */}
                <MembersPanel 
                    members={project.members} 
                    onMemberSelect={handleMemberSelect}
                    selectedMemberId={selectedMember?._id}
                />

            </div>

            <UploadModal 
                isOpen={isUploadOpen} 
                onClose={() => setIsUploadOpen(false)} 
                projectId={id} 
                onUploadComplete={handleUploadComplete} 
            />

            {selectedFile && <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />}
            
            <style>{`
                .file-row:hover { background: rgba(255,255,255,0.03) !important; }
                .btn-icon { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s; }
                .btn-icon:hover { color: white; background: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    );
};

export default ProjectView;
