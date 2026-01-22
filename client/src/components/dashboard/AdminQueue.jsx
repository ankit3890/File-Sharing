import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, HardDrive, CheckCircle, Eye, Download, File, Folder, User, Check, X } from 'lucide-react';
import api from '../../utils/api';
import ConfirmModal from '../ConfirmModal';
import PromptModal from '../PromptModal';
import { useVirtualizer } from '@tanstack/react-virtual';
import '../../pages/Dashboard/dashboard.css';

const AdminQueue = ({ pendingAttendance, storageAlerts, recentFiles, onRefresh }) => {
    const [confirmState, setConfirmState] = useState({ isOpen: false, id: null, status: '', title: '', message: '' });
    const [promptState, setPromptState] = useState({ isOpen: false, id: null, status: '', title: '', message: '' });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const parentRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Guard against undefined recentFiles (API delay safety)
    if (!recentFiles) {
        return <div className="empty-state">Loading recent files...</div>;
    }

    // Virtualization for system-wide recent files
    const rowVirtualizer = useVirtualizer({
        count: recentFiles?.length || 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => isMobile ? 120 : 70,
        overscan: 5,
    });
    
    // Helper to format time ago
    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now - past;
        const diffInSeconds = Math.floor(diffInMs / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${diffInDays}d ago`;
    };

    const handleActionClick = (att, status) => {
        if (status === 'approved') {
            setConfirmState({
                isOpen: true,
                id: att._id,
                status: 'approved',
                title: 'Confirm Approval',
                message: `Are you sure you want to approve attendance for ${att.userId?.userId || 'this user'} on ${att.date}?`
            });
        } else {
            setPromptState({
                isOpen: true,
                id: att._id,
                status: 'rejected',
                title: 'Reject Attendance',
                message: `Provide a reason for rejecting ${att.userId?.userId || 'this user'}'s attendance:`
            });
        }
    };

    const submitStatusUpdate = async (id, status, remark = '') => {
        try {
            await api.put(`/attendance/${id}/status`, { status, adminRemark: remark });
            onRefresh();
            setConfirmState(prev => ({ ...prev, isOpen: false }));
            setPromptState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error('Attendance Action Error', error);
        }
    };

    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return { color: '#ec4899', icon: File }; 
        if (['pdf'].includes(ext)) return { color: '#ef4444', icon: File }; 
        if (['doc', 'docx'].includes(ext)) return { color: '#3b82f6', icon: File }; 
        if (['xls', 'xlsx', 'csv'].includes(ext)) return { color: '#06b6d4', icon: File }; 
        if (['mp4', 'mov', 'avi'].includes(ext)) return { color: '#8b5cf6', icon: File }; 
        return { color: '#94a3b8', icon: File }; 
    };

    return (
        <div className="glass admin-queue-container" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'white' }}>
                    <AlertTriangle size={20} className="text-yellow-400" /> Action Queue
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '2rem', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                    {pendingAttendance.length + storageAlerts.length} URGENT
                </span>
            </div>
            
            {/* 1. Pending Attendance */}
            <section>
                <h4 className="section-title">
                    Pending Attendance ({pendingAttendance.length})
                </h4>
                {pendingAttendance.length === 0 ? (
                    <div className="empty-state success">
                        <CheckCircle size={18} />
                        <span>All attendance requests processed.</span>
                    </div>
                ) : (
                    <div className="admin-list">
                        {pendingAttendance.map(att => (
                            <div key={att._id} className="admin-card">
                                <div className="card-top">
                                    <div className="user-info">
                                        <div className="avatar-mini"><User size={14} /></div>
                                        <div>
                                            <p className="user-name">{att.userId?.userId || 'Unknown'}</p>
                                            <p className="card-sub">{att.date}</p>
                                        </div>
                                    </div>
                                    <div className="action-btns">
                                        <button onClick={() => handleActionClick(att, 'approved')} className="btn-approve">
                                            Approve
                                        </button>
                                        <button onClick={() => handleActionClick(att, 'rejected')} className="btn-reject">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 2. Storage Alerts */}
            <section>
                 <h4 className="section-title">
                    Storage Critical ({storageAlerts.length})
                </h4>
                {storageAlerts.length === 0 ? (
                    <div className="empty-state success">
                        <CheckCircle size={18} />
                        <span>All users within storage limits.</span>
                    </div>
                ) : (
                    <div className="admin-list">
                        {storageAlerts.map(user => (
                            <div key={user._id} className="admin-card alert-row">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="icon-box-alert"><HardDrive size={20} /></div>
                                        <div>
                                            <p className="user-name alert">{user.userId}</p>
                                            <p className="card-sub alert">{user.percent}% Storage Exhausted</p>
                                        </div>
                                    </div>
                                    <span className="storage-value">
                                        {(user.storageUsed / 1024 / 1024).toFixed(0)} MB
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 3. Global Recent Files (Virtualized) */}
            <section style={{ display: 'flex', flexDirection: 'column', height: recentFiles?.length > 0 ? '450px' : 'auto' }}>
                 <h4 className="section-title">
                    System-wide Recent Files
                </h4>
                {(!recentFiles || recentFiles.length === 0) ? (
                    <div className="empty-state">No recent activity found.</div>
                ) : (
                    <div 
                        ref={parentRef} 
                        className="admin-list-virtual"
                        style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
                    >
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map(virtualRow => {
                                const file = recentFiles[virtualRow.index];
                                const { color, icon: IconComponent } = getFileIcon(file.originalName);
                                
                                return (
                                    <div 
                                        key={file._id}
                                        style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                            padding: '0.4rem 0'
                                        }}
                                    >
                                        <div className="admin-card file-card">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                                    <div style={{ padding: '0.6rem', background: `${color}15`, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <IconComponent size={20} style={{ color: color }} />
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p className="file-name">{file.originalName}</p>
                                                        <div className="file-sub-info">
                                                            <div className="meta-item"><User size={10} /> {file.uploader?.userId?.split('@')[0] || 'System'}</div>
                                                            <div className="meta-item"><Folder size={10} /> {file.project?.name || 'Global'}</div>
                                                            <div className="meta-item time"><Clock size={10} /> {formatTimeAgo(file.uploadedAt)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="file-right">
                                                    <span className="file-size">{(file.size / 1048576).toFixed(1)}MB</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* Modals */}
            <ConfirmModal 
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => submitStatusUpdate(confirmState.id, 'approved')}
                title={confirmState.title}
                message={confirmState.message}
                confirmText="✅ Approve"
                variant="success"
            />

            <PromptModal 
                isOpen={promptState.isOpen}
                onClose={() => setPromptState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={(remark) => submitStatusUpdate(promptState.id, 'rejected', remark)}
                title={promptState.title}
                message={promptState.message}
                placeholder="Enter admin remark (optional)"
                confirmText="❌ Reject"
            />
        </div>
    );
};

export default AdminQueue;
