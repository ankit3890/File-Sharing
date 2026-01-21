import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { Trash2, Layers, Folder, Settings } from 'lucide-react';
import AlertModal from '../AlertModal';
import ConfirmModal from '../ConfirmModal';
import SkeletonLoader from '../SkeletonLoader';

const LogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [projects, setProjects] = useState([]);

    const [selectedProject, setSelectedProject] = useState('all');
    const [logScope, setLogScope] = useState('all'); // all | project | system

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        total: 0,
        project: 0,
        system: 0
    });

    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    /* ================= INITIAL LOAD ================= */
    useEffect(() => {
        fetchProjects();
        fetchStats();
    }, []);

    /* ================= LOG FETCH ================= */
    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line
    }, [page, selectedProject, logScope]);

    /* ================= API CALLS ================= */

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');

            // Defensive: support multiple backend shapes
            const projectList =
                res.data?.projects ||
                res.data ||
                [];

            setProjects(Array.isArray(projectList) ? projectList : []);
        } catch (err) {
            console.error('Failed to load projects', err);
            setProjects([]);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');

            setStats({
                total: res.data?.logs?.total ?? 0,
                project: res.data?.logs?.project ?? 0,
                system: res.data?.logs?.system ?? 0
            });
        } catch (err) {
            console.error('Failed to load log stats', err);
            setStats({ total: 0, project: 0, system: 0 });
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page,
                scope: logScope
            });

            if (logScope === 'project' && selectedProject !== 'all') {
                params.append('projectId', selectedProject);
            }

            const res = await api.get(`/admin/logs?${params.toString()}`);

            setLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
            setPages(res.data?.pages || 1);
        } catch (err) {
            console.error('Failed to load logs', err);
            setLogs([]);
            setPages(1);
            setAlertState({
                isOpen: true,
                title: 'Error',
                message: 'Failed to load audit logs',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmClearLogs = async () => {
        try {
            await api.delete('/admin/logs');
            fetchLogs();
            fetchStats();
            setAlertState({
                isOpen: true,
                title: 'Success',
                message: 'Audit logs cleared successfully',
                type: 'success'
            });
        } catch {
            setAlertState({
                isOpen: true,
                title: 'Error',
                message: 'Failed to clear logs',
                type: 'error'
            });
        }
    };

    /* ================= UI HELPERS ================= */

    const Card = ({ icon: Icon, label, value, active, onClick, color }) => (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={onClick}
            className="glass"
            style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                borderTop: `4px solid ${color}`,
                cursor: 'pointer',
                flex: 1,
                border: active
                    ? `1px solid ${color}60`
                    : '1px solid rgba(255,255,255,0.05)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ color, fontSize: '0.85rem' }}>{label}</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{value}</h3>
                </div>
                <Icon size={22} color={color} />
            </div>
            {active && (
                <small style={{ color }}>Currently viewing</small>
            )}
        </motion.div>
    );

    /* ================= RENDER ================= */

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Audit Logs</h3>
                <button
                    onClick={() => setIsConfirmOpen(true)}
                    className="btn"
                    style={{ background: '#ef4444' }}
                >
                    <Trash2 size={16} /> Clear Logs
                </button>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <Card
                    icon={Layers}
                    label="All Logs"
                    value={stats.total}
                    active={logScope === 'all'}
                    color="#3b82f6"
                    onClick={() => {
                        setPage(1);
                        setLogScope('all');
                    }}
                />
                <Card
                    icon={Folder}
                    label="Project Logs"
                    value={stats.project}
                    active={logScope === 'project'}
                    color="#10b981"
                    onClick={() => {
                        setPage(1);
                        setLogScope('project');
                    }}
                />
                <Card
                    icon={Settings}
                    label="System Logs"
                    value={stats.system}
                    active={logScope === 'system'}
                    color="#8b5cf6"
                    onClick={() => {
                        setPage(1);
                        setLogScope('system');
                    }}
                />
            </div>

            {/* Project Filter */}
            {logScope === 'project' && (
                <select
                    value={selectedProject}
                    onChange={(e) => {
                        setPage(1);
                        setSelectedProject(e.target.value);
                    }}
                    style={{
                        padding: '0.6rem 1rem',
                        marginBottom: '1rem',
                        background: '#1e293b',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        cursor: 'pointer',
                        minWidth: '200px'
                    }}
                >
                    <option value="all">All Projects</option>
                    {Array.isArray(projects) &&
                        projects.map(p => (
                            <option key={p._id} value={p._id}>
                                {p.name}
                            </option>
                        ))}
                </select>
            )}

            {/* Logs Table */}
            {loading ? (
                <SkeletonLoader />
            ) : (
                <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actor</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                            No logs found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log, index) => (
                                        <motion.tr 
                                            key={log._id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                        >
                                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                                {new Date(log.timestamp).toLocaleString(undefined, {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'medium'
                                                })}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <span style={{ 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '99px', 
                                                    background: log.action.includes('DELETE') ? 'rgba(239,68,68,0.1)' : log.action.includes('CREATE') ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                                                    color: log.action.includes('DELETE') ? '#ef4444' : log.action.includes('CREATE') ? '#10b981' : '#3b82f6',
                                                    border: `1px solid ${log.action.includes('DELETE') ? '#ef4444' : log.action.includes('CREATE') ? '#10b981' : '#3b82f6'}30`
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                                {log.actor?.userId || 'System'}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                                {log.project?.name || '—'}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#94a3b8', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {log.details || '-'}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn">
                    Prev
                </button>
                <span>Page {page} of {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn">
                    Next
                </button>
            </div>

            {/* Modals */}
            <AlertModal {...alertState} onClose={() => setAlertState(s => ({ ...s, isOpen: false }))} />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmClearLogs}
                title="Clear All Logs?"
                message="This will permanently delete all audit logs."
                confirmText="Clear Logs"
                isDanger
            />
        </div>
    );
};

export default LogViewer;
