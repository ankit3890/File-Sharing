import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { Trash2, Layers, Folder, Settings, Clock, User, Info, MoreHorizontal } from 'lucide-react';
import AlertModal from '../AlertModal';
import ConfirmModal from '../ConfirmModal';
import SkeletonLoader from '../SkeletonLoader';
import { useVirtualizer } from '@tanstack/react-virtual';

const LogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [logScope, setLogScope] = useState('all');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    const [stats, setStats] = useState({ total: 0, project: 0, system: 0, attendance: 0 });
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const parentRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        fetchProjects();
        fetchStats();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line
    }, [page, selectedProject, logScope]);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data || []);
        } catch (err) {
            console.error('Failed to load projects', err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats({
                total: res.data?.logs?.total ?? 0,
                project: res.data?.logs?.project ?? 0,
                system: res.data?.logs?.system ?? 0,
                attendance: res.data?.logs?.attendance ?? 0
            });
        } catch (err) {
            console.error('Failed to load log stats', err);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, scope: logScope });
            if (logScope === 'project' && selectedProject !== 'all') params.append('projectId', selectedProject);
            const res = await api.get(`/admin/logs?${params.toString()}`);
            setLogs(res.data?.logs || []);
            setPages(res.data?.pages || 1);
        } catch (err) {
            console.error('Failed to load logs', err);
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to load audit logs', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const confirmClearLogs = async () => {
        try {
            await api.delete('/admin/logs');
            fetchLogs();
            fetchStats();
            setAlertState({ isOpen: true, title: 'Success', message: 'Audit logs cleared successfully', type: 'success' });
        } catch {
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to clear logs', type: 'error' });
        }
    };

    // Virtualization Setup
    const rowVirtualizer = useVirtualizer({
        count: parentRef.current ? logs.length : 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => isMobile ? 160 : 60,
        overscan: 5,
    });

    const LogCard = ({ icon: Icon, label, value, active, onClick, color }) => (
        <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`glass stat-card ${active ? 'active' : ''}`}
            style={{
                borderTop: `4px solid ${color}`,
                borderColor: active ? color : 'rgba(255,255,255,0.05)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ color: active ? color : '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginTop: '0.25rem' }}>{value}</h3>
                </div>
                <div style={{ background: `${color}15`, padding: '0.6rem', borderRadius: '0.75rem', color: color }}>
                    <Icon size={20} />
                </div>
            </div>
            {active && <div className="active-glow" style={{ background: color }} />}
        </motion.div>
    );

    return (
        <div className="log-viewer-view" style={{ color: 'white' }}>
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Audit Logs</h3>
                <button
                    onClick={() => setIsConfirmOpen(true)}
                    className="btn btn-danger-ghost"
                >
                    <Trash2 size={16} /> <span>Clear All</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="log-stats-grid">
                <LogCard icon={Layers} label="Master Log" value={stats.total} active={logScope === 'all'} color="#3b82f6" onClick={() => { setPage(1); setLogScope('all'); }} />
                <LogCard icon={Folder} label="Project Events" value={stats.project} active={logScope === 'project'} color="#10b981" onClick={() => { setPage(1); setLogScope('project'); }} />
                <LogCard icon={Clock} label="Attendance Hub" value={stats.attendance} active={logScope === 'attendance'} color="#eab308" onClick={() => { setPage(1); setLogScope('attendance'); }} />
                <LogCard icon={Settings} label="System Events" value={stats.system} active={logScope === 'system'} color="#8b5cf6" onClick={() => { setPage(1); setLogScope('system'); }} />
            </div>

            {/* Filters Row */}
            <div className="filter-shelf">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                    {logScope === 'project' && (
                        <select
                            value={selectedProject}
                            onChange={(e) => { setPage(1); setSelectedProject(e.target.value); }}
                            className="admin-select"
                        >
                            <option value="all">All Project Contexts</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    )}
                </div>
                
                <div className="pagination-controls">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-btn"><Clock size={14} /> Newer</button>
                    <span className="p-text">{page} / {pages}</span>
                    <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-btn">Older <Clock size={14} /></button>
                </div>
            </div>

            {/* Main Log Container */}
            <div className="glass admin-container">
                <div 
                    ref={parentRef} 
                    className="admin-scroll-area"
                    style={{ height: logs.length > 0 ? '600px' : 'auto', minHeight: '200px' }}
                >
                    {!isMobile && (
                        <div className="admin-table-header log-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                            <div>Timestamp</div>
                            <div>Action Entry</div>
                            <div>Actor</div>
                            <div>Scope</div>
                            <div>Context</div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ padding: '1rem' }}>
                             {Array.from({ length: 8 }).map((_, i) => (
                                isMobile ? (
                                    <div key={i} className="admin-card mobile-log-card" style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                                <div>
                                                    <div className="skeleton-line" style={{ width: '100px', height: '14px', marginBottom: '0.5rem' }} />
                                                    <div className="skeleton-line" style={{ width: '80px', height: '12px' }} />
                                                </div>
                                            </div>
                                            <div className="skeleton-line" style={{ width: '60px', height: '20px', borderRadius: '0.5rem' }} />
                                        </div>
                                        <div className="skeleton-line" style={{ width: '100%', height: '18px', borderRadius: '0.4rem' }} />
                                    </div>
                                ) : (
                                    <div key={i} className="admin-table-row log-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <div className="skeleton-line" style={{ width: '100px', height: '14px' }} />
                                        <div className="skeleton-line" style={{ width: '80px', height: '20px', borderRadius: '0.4rem' }} />
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                             <div className="skeleton-line" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                                             <div className="skeleton-line" style={{ width: '80px', height: '14px' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                             <div className="skeleton-line" style={{ width: '16px', height: '16px' }} />
                                             <div className="skeleton-line" style={{ width: '100px', height: '14px' }} />
                                        </div>
                                        <div className="skeleton-line" style={{ width: '90%', height: '14px' }} />
                                    </div>
                                )
                             ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <Info size={48} strokeWidth={1} style={{ opacity: 0.2 }} />
                            <p>No audit records found for the selected criteria.</p>
                        </div>
                    ) : (
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map(virtualRow => {
                                const log = logs[virtualRow.index];
                                const isCritical = log.action.includes('DELETE');
                                const isPositive = log.action.includes('CREATE') || log.action.includes('UPLOAD');

                                if (isMobile) {
                                    return (
                                        <div 
                                            key={log._id}
                                            style={{
                                                position: 'absolute', top: 0, left: 0, width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                                padding: '0.5rem 1rem'
                                            }}
                                        >
                                            <div className="admin-card mobile-log-card">
                                                <div className="card-top">
                                                    <div className="user-info">
                                                        <div className="avatar-mini"><User size={14} /></div>
                                                        <div>
                                                            <p className="user-name">{log.actor?.userId || 'System'}</p>
                                                            <div className="card-sub">
                                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                {log.project && <span style={{ opacity: 0.6 }}> • {log.project.name}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`log-badge ${isCritical ? 'critical' : isPositive ? 'positive' : ''}`}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                                <div className="log-details-area">
                                                    {log.details || 'No extended metadata'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div 
                                        key={log._id}
                                        className="admin-table-row log-row"
                                        style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <div className="log-cell-time">
                                            {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                        <div>
                                            <span className={`log-badge ${isCritical ? 'critical' : isPositive ? 'positive' : ''}`}>
                                                {log.action}
                                            </span>
                                        </div>
                                        <div className="log-cell-actor">
                                            <User size={14} className="icon-sub" /> <span>{log.actor?.userId || 'System'}</span>
                                        </div>
                                        <div className="log-cell-scope">
                                            {log.project ? <><Folder size={14} className="icon-sub" /> <span>{log.project.name}</span></> : '—'}
                                        </div>
                                        <div className="log-cell-details" title={log.details}>
                                            {log.details || '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <AlertModal {...alertState} onClose={() => setAlertState(s => ({ ...s, isOpen: false }))} />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmClearLogs}
                title="Wipe Audit Logs?"
                message="This will permanently delete all security audit logs. This action cannot be reversed."
                confirmText="Purge Logs"
                variant="danger"
            />

            <style>{`
                .log-viewer-view .btn-danger-ghost { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 0 1.5rem; border-radius: 0.75rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; height: 42px; font-size: 0.9rem; }
                .log-viewer-view .btn-danger-ghost:hover { background: #ef4444; color: white; transform: translateY(-1px); }
                
                .log-viewer-view .log-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
                .log-viewer-view .stat-card { position: relative; padding: 1.5rem; border-radius: 1.25rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); cursor: pointer; overflow: hidden; }
                .log-viewer-view .stat-card.active { background: rgba(255,255,255,0.04); }
                .log-viewer-view .active-glow { position: absolute; bottom: -20px; right: -20px; width: 60px; height: 60px; border-radius: 50%; opacity: 0.2; filter: blur(20px); }
                
                .log-viewer-view .filter-shelf { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
                .log-viewer-view .admin-select { background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 0.6rem 2.5rem 0.6rem 1rem; border-radius: 0.75rem; font-weight: 600; outline: none; min-width: 220px; cursor: pointer; height: 42px; font-size: 0.9rem; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; }
                .log-viewer-view .admin-select:focus { border-color: #3b82f6; }
                
                .log-viewer-view .pagination-controls { display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.05); padding: 0.4rem; border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.05); }
                .log-viewer-view .p-btn { background: none; border: none; color: #94a3b8; font-weight: 700; font-size: 0.8rem; padding: 0.4rem 0.8rem; border-radius: 0.5rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
                .log-viewer-view .p-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: white; }
                .log-viewer-view .p-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .log-viewer-view .p-text { font-size: 0.8rem; font-weight: 800; color: #64748b; padding: 0 0.5rem; }

                .log-viewer-view .admin-container { border-radius: 1rem; overflow: hidden; background: rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.05); }
                .log-viewer-view .admin-scroll-area { width: 100%; overflow-y: auto; position: relative; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
                
                .log-viewer-view .admin-table-header.log-header { display: grid; grid-template-columns: 140px 160px 180px 160px 1fr; gap: 1rem; padding: 1rem 1.5rem; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.05); color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; backdrop-filter: blur(8px); }
                .log-viewer-view .admin-table-header.log-header div { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .log-viewer-view .admin-table-row.log-row { display: grid; grid-template-columns: 140px 160px 180px 160px 1fr; gap: 1rem; color: #94a3b8; font-size: 0.85rem; font-weight: 500; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.02); align-items: center; min-width: 0; }
                .log-viewer-view .admin-table-row.log-row:hover { background: rgba(255,255,255,0.02); }
                
                .log-viewer-view .log-badge { padding: 0.2rem 0.6rem; border-radius: 0.4rem; background: rgba(59, 130, 246, 0.1); color: #3b82f6; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
                .log-badge.critical { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .log-badge.positive { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                
                .log-viewer-view .icon-sub { color: #475569; }
                .log-viewer-view .log-cell-time { color: #64748b; font-weight: 600; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .log-viewer-view .log-cell-actor { font-weight: 700; color: #cbd5e1; display: flex; align-items: center; gap: 0.4rem; min-width: 0; }
                .log-viewer-view .log-cell-actor span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .log-viewer-view .log-cell-scope { display: flex; align-items: center; gap: 0.4rem; min-width: 0; }
                .log-viewer-view .log-cell-scope span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .log-viewer-view .log-cell-details { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8; }

                .log-viewer-view .admin-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem; border-radius: 0.75rem; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 0.75rem; }
                .log-viewer-view .admin-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
                .log-viewer-view .card-top { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
                .log-viewer-view .user-info { display: flex; align-items: center; gap: 0.75rem; }
                .log-viewer-view .avatar-mini { width: 32px; height: 32px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
                .log-viewer-view .user-name { font-weight: 700; color: #f1f5f9; font-size: 0.9rem; margin: 0; }
                .log-viewer-view .card-sub { font-size: 0.75rem; color: #64748b; font-weight: 500; margin: 0; }
                
                .log-viewer-view .log-details-area { font-size: 0.75rem; color: #64748b; background: rgba(0,0,0,0.1); padding: 0.5rem 0.75rem; border-radius: 0.6rem; border: 1px solid rgba(255,255,255,0.03); margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                .log-viewer-view .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #475569; gap: 1rem; text-align: center; padding: 2rem; }

                @media (max-width: 1024px) {
                    .log-viewer-view .log-stats-grid { grid-template-columns: repeat(2, 1fr); }
                }

                @media (max-width: 768px) {
                    .log-viewer-view .log-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
                    .log-viewer-view .log-header { display: none; }
                    .log-viewer-view .admin-container { background: transparent; border: none; }
                    .log-viewer-view .filter-shelf { flex-direction: column; align-items: stretch; }
                    .log-viewer-view .admin-select { width: 100%; }
                    .log-viewer-view .pagination-controls { justify-content: center; }
                    .log-viewer-view .btn-danger-ghost { height: 50px; width: 100%; justify-content: center; font-size: 1rem; }
                }
            `}</style>
        </div>
    );
};

export default LogViewer;
