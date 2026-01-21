import React, { useState, useEffect, useRef, useMemo } from 'react';
import { File, Eye, Download, Edit2, Trash2, Clock, MoreVertical, Folder } from 'lucide-react';
import api from '../../utils/api';
import EditFileModal from '../EditFileModal';
import ConfirmModal from '../ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

const RecentFiles = ({ files, onRefresh }) => {
    const { user } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [fileToEdit, setFileToEdit] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [activeMenu, setActiveMenu] = useState(null); 
    
    const parentRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Virtualization Setup
    const rowVirtualizer = useVirtualizer({
        count: files.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => isMobile ? 130 : 70,
        overscan: 5,
    });

    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return { color: '#ec4899', icon: File }; 
        if (['pdf'].includes(ext)) return { color: '#ef4444', icon: File }; 
        if (['doc', 'docx'].includes(ext)) return { color: '#3b82f6', icon: File }; 
        if (['xls', 'xlsx', 'csv'].includes(ext)) return { color: '#06b6d4', icon: File }; 
        if (['mp4', 'mov', 'avi'].includes(ext)) return { color: '#8b5cf6', icon: File }; 
        if (['zip', 'rar', '7z'].includes(ext)) return { color: '#64748b', icon: File }; 
        return { color: '#94a3b8', icon: File }; 
    };
    
    const handleDownload = async (file) => {
        try {
            const res = await api.get(`/files/${file._id}/download_token`);
            window.location.href = `${api.defaults.baseURL}/files/download/${res.data.token}`;
            setActiveMenu(null);
        } catch (error) {
            alert('Download failed');
        }
    };

    const handlePreview = async (file) => {
        try {
            const res = await api.get(`/files/${file._id}/download_token`);
            const previewUrl = `${api.defaults.baseURL}/files/download/${res.data.token}?preview=true`;
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
            setActiveMenu(null);
        } catch (error) {
            console.error('Preview failed', error);
            alert('Could not open preview');
        }
    };

    const confirmDelete = async () => {
        if (!fileToDelete) return;
        try {
            await api.delete(`/files/${fileToDelete._id}`);
            if (onRefresh) onRefresh();
        } catch (error) {
            alert('Delete failed');
        } finally {
            setFileToDelete(null);
            setIsDeleteModalOpen(false);
            setActiveMenu(null);
        }
    };

    if (!files || files.length === 0) {
        return (
            <div className="glass" style={{ padding: '3rem', borderRadius: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>No recent files found in your workspace.</p>
            </div>
        );
    }

    return (
        <div className="glass" style={{ borderRadius: '1rem', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '600px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <File size={20} style={{ color: '#10b981' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Recent Files</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, background: 'rgba(255,255,255,0.03)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                    {files.length} TOTAL
                </span>
            </div>

            {!isMobile && (
                <div className="table-header">
                    <span>Type</span>
                    <span>Name</span>
                    <span>Project</span>
                    <span>Size / Date</span>
                    <span>Uploader</span>
                    <span style={{ textAlign: 'right' }}>Actions</span>
                </div>
            )}

            <div 
                ref={parentRef} 
                style={{ height: '100%', overflowY: 'auto', position: 'relative' }}
            >
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map(virtualRow => {
                        const file = files[virtualRow.index];
                        const { color, icon: IconComponent } = getFileIcon(file.originalName);
                        const isNew = (new Date() - new Date(file.uploadedAt)) < 86400000;
                        const canManage = user?.role === 'admin' || user?._id === file.uploader?._id;

                        if (isMobile) {
                            return (
                                <div 
                                    key={file._id}
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                        padding: '0.75rem 1rem'
                                    }}
                                >
                                    <div className="mobile-file-card">
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                            <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IconComponent size={24} style={{ color: color }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <p className="file-name" style={{ fontSize: '1rem' }}>{file.originalName}</p>
                                                    {isNew && <span className="badge-new">NEW</span>}
                                                </div>
                                                <p className="file-desc" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{file.description || 'No description'}</p>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                                                        <Clock size={12} /> {new Date(file.uploadedAt).toLocaleDateString()}
                                                    </div>
                                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>•</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{(file.size / 1048576).toFixed(2)} MB</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    <Folder size={12} /> {file.project?.name || 'Personal'}
                                                </div>
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <button 
                                                    onClick={() => setActiveMenu(activeMenu === file._id ? null : file._id)}
                                                    className="btn-icon" 
                                                    style={{ padding: '0.5rem' }}
                                                >
                                                    <MoreVertical size={20} />
                                                </button>
                                                <AnimatePresence>
                                                    {activeMenu === file._id && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            className="overflow-menu"
                                                        >
                                                            <button onClick={() => handlePreview(file)}><Eye size={16} /> Preview</button>
                                                            <button onClick={() => handleDownload(file)}><Download size={16} /> Download</button>
                                                            {canManage && (
                                                                <>
                                                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.25rem 0' }} />
                                                                    <button onClick={() => { setFileToEdit(file); setIsEditModalOpen(true); }}><Edit2 size={16} /> Edit</button>
                                                                    <button onClick={() => { setFileToDelete(file); setIsDeleteModalOpen(true); }} style={{ color: '#ef4444' }}><Trash2 size={16} /> Delete</button>
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={file._id}
                                className="file-row"
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <IconComponent size={24} style={{ color: color }} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <p className="file-name">{file.originalName}</p>
                                        {isNew && <span className="badge-new">NEW</span>}
                                    </div>
                                    <p className="file-desc">{file.description || 'Uploaded via Web'}</p>
                                </div>
                                <div style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500 }}>
                                    {file.project?.name || 'Unassigned'}
                                </div>
                                <div className="file-meta">
                                    <p>{(file.size / 1048576).toFixed(2)} MB</p>
                                    <p style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(file.uploadedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="uploader-name">{file.uploader?.userId || 'Unknown'}</div>
                                <div className="actions-cell">
                                    <button onClick={() => handlePreview(file)} className="btn-icon" title="Preview"><Eye size={18} /></button>
                                    <button onClick={() => handleDownload(file)} className="btn-icon" title="Download"><Download size={18} /></button>
                                    {canManage && (
                                        <>
                                            <button onClick={() => { setFileToEdit(file); setIsEditModalOpen(true); }} className="btn-icon" title="Edit"><Edit2 size={18} /></button>
                                            <button onClick={() => { setFileToDelete(file); setIsDeleteModalOpen(true); }} className="btn-icon-danger" title="Delete"><Trash2 size={18} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            {fileToEdit && (
                <EditFileModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    file={fileToEdit} 
                    onSave={async (fId, desc) => { 
                        await api.put(`/files/${fId}`, { description: desc }); 
                        if (onRefresh) onRefresh(); 
                    }} 
                />
            )}
            
            <ConfirmModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={confirmDelete} 
                title="Delete File?" 
                message="Are you sure you want to delete this file? This action cannot be undone." 
                variant="danger" 
                confirmText="Delete File"
            />

            <style>{`
                .table-header { padding: 0.75rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: grid; grid-template-columns: minmax(40px, auto) 1.5fr 1fr 1fr 0.8fr 1fr; gap: 1rem; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(0,0,0,0.1); }
                .file-row { display: grid; grid-template-columns: minmax(40px, auto) 1.5fr 1fr 1fr 0.8fr 1fr; gap: 1rem; padding: 0.75rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); align-items: center; transition: background 0.2s; }
                .file-row:hover { background: rgba(255,255,255,0.02); }
                .file-name { font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #f1f5f9; }
                .file-desc { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
                .file-meta p { font-size: 0.85rem; color: #cbd5e1; margin: 0; }
                .uploader-name { font-size: 0.85rem; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .badge-new { font-size: 0.6rem; background: #3b82f6; color: white; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 800; letter-spacing: 0.025em; }
                .actions-cell { display: flex; gap: 0.1rem; justify-content: flex-end; }
                .btn-icon, .btn-icon-danger { background: none; border: none; color: #64748b; cursor: pointer; padding: 8px; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                .btn-icon:hover { color: white; background: rgba(255,255,255,0.08); }
                .btn-icon-danger:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                
                .mobile-file-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 1rem; padding: 1rem; transition: all 0.2s ease; }
                .mobile-file-card:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
                
                .overflow-menu {
                    position: absolute; right: 0; top: 100%; z-index: 50; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 0.5rem; min-width: 140px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
                }
                .overflow-menu button {
                    width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border: none; background: none; color: #cbd5e1; cursor: pointer; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 500;
                }
                .overflow-menu button:hover { background: rgba(255,255,255,0.05); color: white; }
            `}</style>
        </div>
    );
};

export default RecentFiles;
