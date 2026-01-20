import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HardDrive, Trash2, Eye, File } from 'lucide-react';
import api from '../utils/api';
import FilePreviewModal from '../components/FilePreviewModal';
import PasswordConfirmationModal from '../components/PasswordConfirmationModal';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';

const ManageSpace = () => {
    const { user, refreshUser } = useAuth();
    const [files, setFiles] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedFile, setSelectedFile] = React.useState(null); // For preview
    const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);

    // Modals
    const [alertState, setAlertState] = React.useState({ isOpen: false, title: '', message: '', type: 'error' });
    const [confirmState, setConfirmState] = React.useState({ isOpen: false, fileId: null });

    React.useEffect(() => {
        refreshUser();
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await api.get('/files/mine');
            setFiles(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewLargeFiles = () => {
        const sortedFiles = [...files].sort((a, b) => b.size - a.size);
        setFiles(sortedFiles);
        // Add a small highlight effect or just scroll
        const table = document.getElementById('files-table');
        if (table) table.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteClick = (fileId) => {
        setConfirmState({ isOpen: true, fileId });
    };

    const confirmDelete = async () => {
        if (!confirmState.fileId) return;
        try {
            await api.delete(`/files/${confirmState.fileId}`);
            fetchFiles();
            refreshUser();
            setAlertState({ isOpen: true, title: 'Success', message: 'File deleted', type: 'success' });
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to delete file', type: 'error' });
        } finally {
            setConfirmState({ isOpen: false, fileId: null });
        }
    };

    const handleBulkDelete = async (password) => {
        try {
            await api.delete('/files/mine', { data: { password } });
            setIsPasswordModalOpen(false);
            fetchFiles();
            refreshUser();
            setAlertState({ isOpen: true, title: 'Success', message: 'All files deleted', type: 'success' });
        } catch (error) {
            // Password modal handles its own error usually, but generic catch
             setAlertState({ isOpen: true, title: 'Error', message: error.response?.data?.message || 'Failed to delete all files', type: 'error' });
        }
    };

    // Assuming 100MB limit
    const limit = 100 * 1024 * 1024;
    const used = user?.storageUsed || 0;
    const remaining = Math.max(0, limit - used);
    const percentage = Math.min(100, (used / limit) * 100);

    // Dynamic Color Logic
    const getStorageColor = () => {
        if (percentage >= 90) return '#ef4444'; // Red
        if (percentage >= 70) return '#eab308'; // Yellow
        return '#3b82f6'; // Blue
    };

    // Dynamic Message Logic
    const getStatusMessage = () => {
        if (percentage >= 100) return "Storage limit reached. Delete files to continue.";
        if (percentage >= 90) return "Storage almost full. Uploads may be blocked.";
        if (percentage >= 70) return "You’re running low on storage. Consider deleting old files.";
        return "You have plenty of space available.";
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Manage Storage</h2>
            
            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '600px', marginBottom: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: `rgba(${percentage >= 90 ? '239, 68, 68' : percentage >= 70 ? '234, 179, 8' : '59, 130, 246'}, 0.1)`, borderRadius: '50%' }}>
                        <HardDrive size={32} style={{ color: getStorageColor() }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Storage Usage</h3>
                        <p style={{ color: '#94a3b8' }}>{(used / 1024 / 1024).toFixed(2)} MB of 100 MB used</p>
                    </div>
                </div>

                <div 
                    style={{ height: '1rem', background: '#334155', borderRadius: '1rem', overflow: 'hidden', marginBottom: '0.75rem' }}
                    title={`Storage limit: 100 MB per user`}
                >
                    <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: getStorageColor(), 
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease' 
                    }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>{getStatusMessage()}</p>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{(remaining / 1024 / 1024).toFixed(2)} MB remaining</p>
                    </div>
                    <button 
                        onClick={handleViewLargeFiles}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)' }}
                    >
                        View Large Files
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>My Files ({files.length})</h3>
                    {user?.role === 'admin' && (
                        <p style={{ fontSize: '0.8rem', color: '#60a5fa', marginTop: '0.25rem' }}>Viewing storage for Admin account</p>
                    )}
                </div>
                {files.length > 0 && (
                    <button 
                        onClick={() => setIsPasswordModalOpen(true)}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Trash2 size={16} /> Delete All Files
                    </button>
                )}
            </div>

            <div id="files-table" className="glass" style={{ borderRadius: '0.5rem', overflow: 'hidden', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: '#94a3b8' }}>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Uploader</th>
                            <th style={{ padding: '1rem' }}>Size</th>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map(file => (
                            <tr key={file._id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <File size={16} className="text-blue-400" />
                                    <span>{file.originalName}</span>
                                </td>
                                <td style={{ padding: '1rem', color: '#cbd5e1' }}>{file.uploader?.userId || 'Unknown'}</td>
                                <td style={{ padding: '1rem', color: '#94a3b8' }}>{(file.size / 1024).toFixed(1)} KB</td>
                                <td style={{ padding: '1rem', color: '#94a3b8' }}>{new Date(file.uploadedAt).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setSelectedFile(file)} title="View" style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Eye size={18} /></button>
                                    <button onClick={() => handleDeleteClick(file._id)} title="Delete" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No files found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedFile && <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />}

            <PasswordConfirmationModal 
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Delete All Files?"
                message="This action cannot be undone. All your uploaded files will be permanently deleted. Please enter your password to confirm."
            />

            <AlertModal 
                isOpen={alertState.isOpen} 
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            <ConfirmModal 
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                title="Delete File?"
                message="Are you sure you want to delete this file? This action cannot be undone."
                confirmText="Delete File"
                isDanger={true}
            />
        </div>
    );
};

export default ManageSpace;
