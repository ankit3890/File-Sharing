import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HardDrive, Trash2, Eye, File } from 'lucide-react';
import api from '../utils/api';
import FilePreviewModal from '../components/FilePreviewModal';
import PasswordConfirmationModal from '../components/PasswordConfirmationModal';

const ManageSpace = () => {
    const { user, refreshUser } = useAuth();
    const [files, setFiles] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedFile, setSelectedFile] = React.useState(null); // For preview
    const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);

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

    const handleDelete = async (fileId) => {
        if (!window.confirm('Delete this file?')) return;
        try {
            await api.delete(`/files/${fileId}`);
            fetchFiles();
            refreshUser();
        } catch (error) {
            alert('Failed to delete file');
        }
    };

    const handleBulkDelete = async (password) => {
        await api.delete('/files/mine', { data: { password } });
        setIsPasswordModalOpen(false);
        fetchFiles();
        refreshUser();
    };

    // Assuming 100MB limit
    const limit = 100 * 1024 * 1024;
    const used = user?.storageUsed || 0;
    const percentage = Math.min(100, (used / limit) * 100);

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Manage Storage</h2>
            
            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '600px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}>
                        <HardDrive size={32} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Storage Usage</h3>
                        <p style={{ color: '#94a3b8' }}>{(used / 1024 / 1024).toFixed(2)} MB of 100 MB used</p>
                    </div>
                </div>

                <div style={{ height: '1.5rem', background: '#334155', borderRadius: '1rem', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: percentage > 90 ? '#ef4444' : '#3b82f6', transition: 'width 0.5s ease' }}></div>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    {percentage > 90 
                        ? "Warning: You are running low on storage. Please delete files to free up space." 
                        : "You have plenty of space available."}
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>My Files ({files.length})</h3>
                {files.length > 0 && (
                    <button 
                        onClick={() => setIsPasswordModalOpen(true)}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Trash2 size={16} /> Delete All Files
                    </button>
                )}
            </div>

            <div className="glass" style={{ borderRadius: '0.5rem', overflow: 'hidden', overflowX: 'auto' }}>
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
                                    <button onClick={() => handleDelete(file._id)} title="Delete" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No files found.</td>
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
        </div>
    );
};

export default ManageSpace;
