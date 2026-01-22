import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import UploadModal from '../components/UploadModal';
import FilePreviewModal from '../components/FilePreviewModal';
import MembersPanel from '../components/MembersPanel';
import EditFileModal from '../components/EditFileModal';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import { File, Trash2, Eye, Download, Edit2, UploadCloud, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

const ProjectView = () => {
    const { id } = useParams();
    const { user, refreshUser } = useAuth();
    
    // --- State ---
    const [project, setProject] = useState(null);
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fileSearch, setFileSearch] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [editDesc, setEditDesc] = useState('');
    const [editName, setEditName] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [fileToEdit, setFileToEdit] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const viewedFilesKey = `viewedFiles_${id}`;
    const [viewedFiles, setViewedFiles] = useState(() => {
        const saved = localStorage.getItem(viewedFilesKey);
        return saved ? JSON.parse(saved) : [];
    });
    const [dragActive, setDragActive] = useState(false);
    const [droppedFile, setDroppedFile] = useState(null);

    // --- Refs ---
    const parentRef = useRef(null);

    // --- Memoized Logic ---
    const visibleFiles = useMemo(() => {
        if (!Array.isArray(files)) return [];
        return files.filter(f => {
            const isDeletedVisible = !f.deletedByAdmin || user?.role === 'admin';
            const matchesSearch = (f.originalName || '').toLowerCase().includes(fileSearch.toLowerCase());
            const matchesMember = selectedMember ? (f.uploader?._id === selectedMember._id) : true;
            return isDeletedVisible && matchesSearch && matchesMember;
        });
    }, [files, fileSearch, selectedMember, user?.role]);

    const rowVirtualizer = useVirtualizer({
        count: visibleFiles.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80,
        overscan: 5,
    });

    // --- Effects ---
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    // --- Handlers ---
    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const [projectRes, filesRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/files/project/${id}`)
            ]);
            setProject(projectRes.data);
            setFiles(filesRes.data?.files || filesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch project data:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveProjectDesc = async () => {
        try {
            const res = await api.put(`/projects/${project._id}`, { name: editName, description: editDesc });
            setProject(prev => ({ ...prev, ...res.data }));
            setIsEditingProject(false);
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to update project details';
            setAlertState({ isOpen: true, title: 'Update Failed', message: msg, type: 'error' });
        }
    };

    const confirmDelete = async () => {
        if (!fileToDelete) return;
        try {
            await api.delete(`/files/${fileToDelete._id}`);
            await fetchProjectData();
            refreshUser();
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Delete Failed', message: 'Failed to delete file', type: 'error' });
        } finally {
            setFileToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const handleDownload = async (fileId) => {
        try {
            const res = await api.get(`/files/${fileId}/download_token`);
            const { token } = res.data;
            window.location.href = `${api.defaults.baseURL}/files/download/${token}`;
            markAsViewed(fileId);
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Download Failed', message: 'Could not download file.', type: 'error' });
        }
    };

    const markAsViewed = (fileId) => {
        if (!viewedFiles.includes(fileId)) {
            const newViewed = [...viewedFiles, fileId];
            setViewedFiles(newViewed);
            localStorage.setItem(viewedFilesKey, JSON.stringify(newViewed));
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            setDroppedFile(e.dataTransfer.files[0]);
            setIsUploadOpen(true);
        }
    };

    // --- Helpers ---
    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return { color: '#f59e0b', icon: File }; // Image (Yellowish) - Using File generic for now, could actally differentiate
        if (['pdf'].includes(ext)) return { color: '#ef4444', icon: File }; // PDF (Red) - Use File generic but colored
        if (['doc', 'docx'].includes(ext)) return { color: '#ffffff', icon: File }; // Doc (White)
        if (['xls', 'xlsx', 'csv'].includes(ext)) return { color: '#10b981', icon: File }; // Sheet (Green)
        if (['mp4', 'mov', 'avi'].includes(ext)) return { color: '#8b5cf6', icon: File }; // Video (Purple)
        if (['zip', 'rar', '7z'].includes(ext)) return { color: '#64748b', icon: File }; // Archive (Gray)
        return { color: '#94a3b8', icon: File }; // Default
    };

    // --- Early Returns ---
    if (loading) return <div className="p-8 text-center text-white">Loading Project...</div>;
    if (!project) return <div className="p-8 text-center text-white">Project not found</div>;

    return (
        <div 
            style={{ 
                padding: '1rem', 
                height: isMobile ? 'auto' : 'calc(100vh - 100px)', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: isMobile ? 'visible' : 'hidden', 
                position: 'relative',
                color: 'white'
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {dragActive && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.05)', border: '2px dashed #52525b', zIndex: 100, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1e293b', padding: '1rem 2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <UploadCloud size={32} color="#ffffff" />
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Drop to Upload</span>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{project.name}</h1>
                        {user?.role === 'admin' && !isEditingProject && (
                            <button onClick={() => { setEditName(project.name); setEditDesc(project.description); setIsEditingProject(true); }} className="btn-icon"><Edit2 size={18} /></button>
                        )}
                    </div>
                    {isEditingProject ? (
                        <div style={{ marginTop: '0.5rem', width: isMobile ? '100%' : '400px' }}>
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" style={{ marginBottom: '0.5rem' }} />
                            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="input-field" rows={3} />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={saveProjectDesc} className="btn-primary-sm">Save</button>
                                <button onClick={() => setIsEditingProject(false)} className="btn-secondary-sm">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: '#94a3b8' }}>{project.description || 'No description'}</p>
                    )}
                </div>
                <button 
                    onClick={() => user.storageUsed >= user.storageLimit ? setAlertState({ isOpen: true, title: 'Limit Reached', message: 'Storage full.', type: 'error' }) : setIsUploadOpen(true)}  
                    className="btn-primary"
                >
                    <UploadCloud size={20} /> Upload File
                </button>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: isMobile ? 'column' : undefined, gridTemplateColumns: isMobile ? undefined : '3fr 1fr', gap: '1.5rem', flex: 1, overflow: isMobile ? 'visible' : 'hidden' }}>
                
                {/* File List Container */}
                <div ref={parentRef} className="glass" style={{ borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    
                    {/* Header: Search & Filter */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(20, 20, 20, 0.4)' }}>
                         <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                placeholder="Search files..." 
                                value={fileSearch} 
                                onChange={(e) => setFileSearch(e.target.value)} 
                                className="search-input" 
                                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', height: '40px' }}
                            />
                        </div>
                        {selectedMember && (
                            <div className="filter-badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                                <span>{selectedMember.userId}</span>
                                <button onClick={() => setSelectedMember(null)} style={{ color: '#94a3b8' }}><X size={14} /></button>
                            </div>
                        )}
                    </div>

                    {/* Table Header Row */}
                    {!isMobile && (
                        <div className="table-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, auto) 2fr 1fr 1fr 1fr', gap: '1rem', padding: '1rem 1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#64748b', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <span>Type</span>
                            <span>Name</span>
                            <span>Size / Date</span>
                            <span>Uploader</span>
                            <span style={{ textAlign: 'right' }}>Actions</span>
                        </div>
                    )}
                    
                    {/* File List Content */}
                    <div style={{ flex: 1, overflowY: isMobile ? 'visible' : 'auto', position: 'relative' }}>
                        {visibleFiles.length === 0 ? (
                            <div className="empty-state" style={{ padding: '4rem', color: '#475569' }}>
                                <File size={48} strokeWidth={1} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#94a3b8' }}>No files found</p>
                                <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const file = visibleFiles[virtualRow.index];
                                    const isNew = (new Date() - new Date(file.uploadedAt)) < 86400000 && !viewedFiles.includes(file._id);
                                    const { color, icon: IconComponent } = getFileIcon(file.originalName);

                                    return (
                                        <div key={virtualRow.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}>
                                            <motion.div 
                                                className="file-row" 
                                                style={{ 
                                                    display: 'grid',
                                                    gridTemplateColumns: isMobile ? 'auto 1fr auto' : 'minmax(40px, auto) 2fr 1fr 1fr 1fr',
                                                    gap: '1rem',
                                                    padding: '1rem 1.5rem',
                                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                                    alignItems: 'center',
                                                    height: '100%',
                                                    opacity: file.deletedByAdmin ? 0.6 : 1, 
                                                    background: file.deletedByAdmin ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                                    transition: 'background 0.2s'
                                                }}
                                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <IconComponent size={20} style={{ color: color }} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <p className="file-name" onDoubleClick={() => { setFileToEdit(file); setIsEditModalOpen(true); }} style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '0.9rem' }}>{file.originalName}</p>
                                                        {isNew && <span className="badge-new">NEW</span>}
                                                        {file.deletedByAdmin && <span className="badge-deleted">DELETED</span>}
                                                    </div>
                                                    <p className="file-desc" style={{ fontSize: '0.8rem', color: '#64748b' }}>{file.description || 'Uploaded via Web'}</p>
                                                </div>
                                                {!isMobile && (
                                                    <div className="file-meta">
                                                        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '500' }}>{(file.size / 1048576).toFixed(2)} MB</p>
                                                        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(file.uploadedAt).toLocaleDateString()}</p>
                                                    </div>
                                                )}
                                                {!isMobile && <div className="uploader-name" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{file.uploader?.userId || 'Unknown'}</div>}
                                                <div className="actions-cell">
                                                    {!file.deletedByAdmin && (
                                                        <>
                                                            <button onClick={() => { setSelectedFile(file); markAsViewed(file._id); }} className="btn-icon" title="View"><Eye size={18} /></button>
                                                            <button onClick={() => handleDownload(file._id)} className="btn-icon" title="Download"><Download size={18} /></button>
                                                        </>
                                                    )}
                                                    {(user?.role === 'admin' || user?._id === file.uploader?._id) && !file.deletedByAdmin && (
                                                        <>
                                                            <button onClick={() => { setFileToEdit(file); setIsEditModalOpen(true); }} className="btn-icon" title="Edit"><Edit2 size={18} /></button>
                                                            <button onClick={() => { setFileToDelete(file); setIsDeleteModalOpen(true); }} className="btn-icon-danger" title="Delete"><Trash2 size={18} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <MembersPanel members={project.members} onMemberSelect={m => setSelectedMember(selectedMember?._id === m._id ? null : m)} selectedMemberId={selectedMember?._id} />
            </div>

            {/* Modals */}
            <UploadModal isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); setDroppedFile(null); }} projectId={id} onUploadComplete={() => { fetchProjectData(); refreshUser(); }} initialFile={droppedFile} />
            <EditFileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} file={fileToEdit} onSave={async (fId, desc) => { await api.put(`/files/${fId}`, { description: desc }); fetchProjectData(); }} />
            {selectedFile && <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />}
            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete File?" message="This cannot be undone." isDanger={true} />
            <AlertModal isOpen={alertState.isOpen} onClose={() => setAlertState(p => ({ ...p, isOpen: false }))} {...alertState} />
            
            <style>{`
                .glass { background: rgba(20, 20, 20, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
                .input-field { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.5rem; border-radius: 0.5rem; }
                .search-input { width: 100%; padding: 0.6rem 0.6rem 0.6rem 2.5rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; outline: none; }
                .search-input:focus { border-color: rgba(59, 130, 246, 0.5); }
                .table-header { padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.05); display: grid; grid-template-columns: ${isMobile ? 'auto 1fr auto' : 'minmax(40px, auto) 2fr 1fr 1fr 1fr'}; gap: 1rem; color: #64748b; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                .file-row { display: grid; grid-template-columns: ${isMobile ? 'auto 1fr auto' : 'minmax(40px, auto) 2fr 1fr 1fr 1fr'}; gap: 1rem; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.02); align-items: center; height: 100%; transition: background 0.2s; }
                .file-row:hover { background: rgba(255,255,255,0.02) !important; }
                .btn-primary { display: flex; alignItems: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.75rem; background: #ffffff; border: none; color: black; cursor: pointer; font-weight: 600; transition: background 0.2s; }
                .btn-primary:hover { background: #e4e4e7; }
                .btn-primary-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; border-radius: 0.25rem; background: #ffffff; border: none; color: black; font-weight: 600; cursor: pointer; }
                .btn-secondary-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; background: transparent; border: 1px solid #64748b; color: #94a3b8; border-radius: 0.25rem; cursor: pointer; }
                .btn-icon, .btn-icon-danger { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 6px; border-radius: 6px; transition: all 0.2s; }
                .btn-icon:hover { color: white; background: rgba(255,255,255,0.1); }
                .btn-icon-danger:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                .file-name { font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; color: #f1f5f9; }
                .file-desc { font-size: 0.8rem; color: #94a3b8; margin-top: 0.1rem; }
                .file-meta p { font-size: 0.85rem; color: #cbd5e1; }
                .uploader-name { font-size: 0.9rem; color: #cbd5e1; }
                .badge-new { font-size: 0.65rem; background: #ffffff; color: black; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: bold; letter-spacing: 0.05em; }
                .badge-deleted { font-size: 0.65rem; background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: bold; }
                .actions-cell { display: flex; gap: 0.25rem; justify-content: flex-end; }
                .filter-badge { display: flex; align-items: center; gap: 0.5rem; background: rgba(59, 130, 246, 0.2); padding: 0.4rem 0.8rem; border-radius: 2rem; border: 1px solid rgba(59, 130, 246, 0.4); font-size: 0.85rem; color: #93c5fd; }
                .empty-state { padding: 3rem; text-align: center; color: #64748b; display: flex; flex-direction: column; alignItems: center; gap: 1rem; }
            `}</style>
        </div>
    );
};

export default ProjectView;