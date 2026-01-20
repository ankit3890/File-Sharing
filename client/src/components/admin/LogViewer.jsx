import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Trash2 } from 'lucide-react';
import AlertModal from '../AlertModal';
import ConfirmModal from '../ConfirmModal';

const LogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    
    // Modals
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        try {
            const res = await api.get(`/admin/logs?page=${page}`);
            setLogs(res.data.logs);
            setPages(res.data.pages);
        } catch (error) {
            console.error(error);
        }
    };

    const confirmClearLogs = async () => {
        try {
            await api.delete('/admin/logs');
            fetchLogs();
            setAlertState({ isOpen: true, title: 'Success', message: 'Audit logs cleared', type: 'success' });
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to clear logs', type: 'error' });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>System Logs</h3>
                <button onClick={() => setIsConfirmOpen(true)} className="btn" style={{ background: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trash2 size={16} /> Clear Logs
                </button>
            </div>
             <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                            <th style={{ padding: '0.75rem' }}>Time</th>
                            <th style={{ padding: '0.75rem' }}>Action</th>
                            <th style={{ padding: '0.75rem' }}>Actor</th>
                            <th style={{ padding: '0.75rem' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log._id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#60a5fa' }}>{log.action}</td>
                                <td style={{ padding: '0.75rem' }}>{log.actor?.userId || 'Unknown'}</td>
                                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn" style={{ background: '#334155' }}>Prev</button>
                <span style={{ display: 'flex', alignItems: 'center' }}>Page {page} of {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn" style={{ background: '#334155' }}>Next</button>
            </div>

            <AlertModal 
                isOpen={alertState.isOpen} 
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmClearLogs}
                title="Clear All Logs?"
                message="Are you sure you want to clear ALL audit logs? This action is permanent and cannot be undone."
                confirmText="Clear Logs"
                isDanger={true}
            />
        </div>
    );
};

export default LogViewer;
