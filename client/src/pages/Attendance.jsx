import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle, XCircle, Clock, Download, Filter, User as UserIcon, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import AlertModal from '../components/AlertModal';
import PromptModal from '../components/PromptModal';
import ConfirmModal from '../components/ConfirmModal';

const Attendance = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const [promptState, setPromptState] = useState({ isOpen: false, id: null, status: '', title: '', message: '' });
    const [confirmState, setConfirmState] = useState({ isOpen: false, id: null, status: '', title: '', message: '' });
    
    // Filters (Admin)
    const [filterUser, setFilterUser] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const [filterDate, setFilterDate] = useState({ 
        start: user.role === 'admin' ? localToday : '', 
        end: user.role === 'admin' ? localToday : '' 
    });
    const [users, setUsers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [exporting, setExporting] = useState(false);
    const [hoveredRow, setHoveredRow] = useState(null);

    useEffect(() => {
        fetchAttendance();
        if (user.role === 'admin') {
            fetchUsers();
        }
    }, [filterUser, filterStatus, filterDate]);

    // Keyboard Shortcuts
    useEffect(() => {
        if (user.role !== 'admin' || selectedIds.length === 0) return;

        const handleKeyPress = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.key.toLowerCase() === 'a') {
                handleBulkStatusUpdate('approved');
            } else if (e.key.toLowerCase() === 'r') {
                handleBulkStatusUpdate('rejected');
            } else if (e.key === 'Escape') {
                setSelectedIds([]);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectedIds, user.role]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            let res;
            if (user.role === 'admin') {
                const params = new URLSearchParams();
                if (filterUser !== 'all') params.append('userId', filterUser);
                if (filterStatus !== 'all') params.append('status', filterStatus);
                if (filterDate.start) params.append('startDate', filterDate.start);
                if (filterDate.end) params.append('endDate', filterDate.end);
                res = await api.get(`/attendance/all?${params.toString()}`);
            } else {
                res = await api.get('/attendance/my');
            }
            setAttendance(res.data);
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleMarkAttendance = async () => {
        try {
            setMarking(true);
            await api.post('/attendance/mark');
            setAlertState({ isOpen: true, title: 'Success', message: 'Attendance marked successfully', type: 'success' });
            fetchAttendance();
        } catch (error) {
            setAlertState({ 
                isOpen: true, 
                title: 'Error', 
                message: error.response?.data?.message || 'Failed to mark attendance.', 
                type: 'error' 
            });
        } finally {
            setMarking(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const record = attendance.find(a => a._id === id);
        
        // If changing an already reviewed record OR approving for first time, ask confirmation
        if (record && (record.status !== 'pending' && record.status !== 'not_marked' || status === 'approved')) {
            setConfirmState({
                isOpen: true,
                id,
                status,
                title: record.status === 'not_marked' ? 'Mark Presence' : (record.status === 'pending' ? 'Confirm Approval' : 'Edit Attendance Status'),
                message: record.status === 'not_marked' 
                    ? `Are you sure you want to mark ${record.userId.userId} as Present?`
                    : (record.status === 'pending' 
                        ? 'Are you sure you want to approve this attendance?' 
                        : `Select new status: ${status.toUpperCase()}?`)
            });
            return;
        }

        if (status === 'rejected') {
            setPromptState({
                isOpen: true,
                id,
                status,
                title: 'Reject Attendance',
                message: 'Please provide a reason (optional):'
            });
        } else {
            submitStatusUpdate(id, status, '');
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedIds.length === 0) return;
        
        try {
            await Promise.all(selectedIds.map(id => api.put(`/attendance/${id}/status`, { status })));
            setAlertState({ isOpen: true, title: 'Success', message: `Successfully updated ${selectedIds.length} records.`, type: 'success' });
            setSelectedIds([]);
            fetchAttendance();
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to update some records.', type: 'error' });
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === attendance.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(attendance.map(a => a._id));
        }
    };

    const handleResetFilters = () => {
        setFilterUser('all');
        setFilterStatus('all');
        const now = new Date();
        const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setFilterDate({ start: localToday, end: localToday });
        setSelectedIds([]);
    };

    const submitStatusUpdate = async (id, status, remark) => {
        try {
            await api.put(`/attendance/${id}/status`, { status, adminRemark: remark });
            setAlertState({ 
                isOpen: true, 
                title: 'Success', 
                message: status === 'approved' ? 'Attendance approved' : 'Attendance rejected', 
                type: 'success' 
            });
            fetchAttendance();
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Error', message: 'Attendance update failed', type: 'error' });
        }
    };

    const handleDownload = async () => {
        try {
            setExporting(true);
            const params = new URLSearchParams();
            if (filterUser !== 'all') params.append('userId', filterUser);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (filterDate.start) params.append('startDate', filterDate.start);
            if (filterDate.end) params.append('endDate', filterDate.end);

            const res = await api.get(`/attendance/report/download?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            setAlertState({ 
                isOpen: true, 
                title: 'Success', 
                message: 'Attendance report downloaded successfully', 
                type: 'success' 
            });
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to download report', type: 'error' });
        } finally {
            setExporting(false);
        }
    };

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todaysRecord = attendance.find(a => a.date === todayStr && (a.userId === user._id || a.userId?._id === user._id));
    const isAlreadyMarked = todaysRecord && !todaysRecord.isVirtual;

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#10b981'; // Green
            case 'rejected': return '#ef4444'; // Red
            case 'pending': return '#f59e0b'; // Amber
            case 'not_marked': return '#64748b'; // Gray
            default: return '#94a3b8';
        }
    };

    // Calculate Summary Stats
    const stats = {
        total: attendance.length,
        approved: attendance.filter(a => a.status === 'approved').length,
        pending: attendance.filter(a => a.status === 'pending').length,
        rejected: attendance.filter(a => a.status === 'rejected').length
    };

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyStats = {
        approved: attendance.filter(a => a.date.startsWith(currentMonth) && a.status === 'approved').length,
        pending: attendance.filter(a => a.date.startsWith(currentMonth) && a.status === 'pending').length,
        rejected: attendance.filter(a => a.date.startsWith(currentMonth) && a.status === 'rejected').length
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CalendarCheck size={32} color="#3b82f6" /> Attendance
                    </h1>
                    <p style={{ color: '#94a3b8' }}>{user.role === 'admin' ? 'Monitor and manage team attendance' : 'Track your daily attendance'}</p>
                </div>

                {user.role === 'admin' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <button 
                            onClick={handleDownload} 
                            disabled={exporting}
                            className="btn-primary" 
                            title="Download attendance report" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', position: 'relative' }}
                        >
                            {exporting ? (
                                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            ) : <Download size={18} />}
                            {exporting ? 'Preparing...' : 'Download CSV'}
                        </button>
                        <p style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Scope: {filterUser === 'all' ? 'All Users' : users.find(u => u._id === filterUser)?.userId} • {filterStatus.toUpperCase()} • {filterDate.start || 'Start'} to {filterDate.end || 'End'}
                        </p>
                    </div>
                )}
            </div>

            {user.role !== 'admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass" 
                        style={{ padding: '1.25rem', borderRadius: '1rem', textAlign: 'center', border: `1px solid ${isAlreadyMarked && todaysRecord.status !== 'rejected' ? getStatusColor(todaysRecord.status) : 'rgba(255, 255, 255, 0.05)'}`, background: isAlreadyMarked ? `${getStatusColor(todaysRecord.status)}05` : 'transparent' }}
                    >
                        <h2 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h2>
                        
                        {!isAlreadyMarked ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button 
                                    onClick={handleMarkAttendance}
                                    disabled={marking}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        borderRadius: '0.75rem',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        cursor: marking ? 'default' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        margin: '0 auto',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '1.1rem' }}>🟢</div>
                                    {marking ? 'Processing...' : 'Mark Today’s Attendance'}
                                </button>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>You can mark attendance only once per day.</p>
                            </div>
                        ) : todaysRecord.status === 'pending' ? (
                            <div style={{ padding: '0.25rem' }}>
                                <Clock size={36} color="#f59e0b" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
                                <h3 style={{ color: '#f59e0b', fontSize: '1.2rem', fontWeight: 'bold' }}>Awaiting Approval</h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>⏳ Attendance already marked and awaiting admin approval.</p>
                                <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #f59e0b40', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    Status: Pending Review
                                </div>
                            </div>
                        ) : todaysRecord.status === 'approved' ? (
                            <div style={{ padding: '0.25rem' }}>
                                <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
                                <h3 style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold' }}>Attendance Approved</h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>Your attendance for today has been successfully approved by the admin.</p>
                                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#10b981' }}>
                                    <span>🟢 Approved</span>
                                    <span style={{ color: '#64748b' }}>·</span>
                                    <span>Reviewed by <strong>Admin</strong> on <strong>{todaysRecord.reviewedAt || todaysRecord.updatedAt ? new Date(todaysRecord.reviewedAt || todaysRecord.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·') : 'Recently'}</strong></span>
                                </div>
                                <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b98140', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    Status: Approved ✔
                                </div>
                            </div>
                        ) : todaysRecord.status === 'not_marked' ? (
                            <div style={{ padding: '0.25rem' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚪</div>
                                <h3 style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 'bold' }}>Attendance Not Marked</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>You haven't marked your attendance for today yet.</p>
                                <button 
                                    onClick={handleMarkAttendance}
                                    style={{
                                        marginTop: '1.25rem',
                                        padding: '0.6rem 1.5rem',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                        borderRadius: '0.5rem',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Mark Presence Now
                                </button>
                            </div>
                        ) : (
                            <div style={{ padding: '0.25rem' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔴</div>
                                <h3 style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: 'bold' }}>Attendance Rejected</h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>Your attendance for today was reviewed and marked as <strong>Rejected</strong> by the admin.</p>
                                
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.6rem', border: '1px solid rgba(255, 255, 255, 0.05)', maxWidth: '500px', margin: '1rem auto 0', textAlign: 'left' }}>
                                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#ef4444', fontWeight: 'bold', marginBottom: '0.25rem' }}>Admin Remark</p>
                                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                                        {todaysRecord.adminRemark ? `"${todaysRecord.adminRemark}"` : "No remarks were provided for this decision."}
                                    </p>
                                </div>

                                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>
                                    <span>🔴 Rejected</span>
                                    <span style={{ color: '#64748b' }}>·</span>
                                    <span>Reviewed by <strong>Admin</strong> on <strong>{todaysRecord.reviewedAt || todaysRecord.updatedAt ? new Date(todaysRecord.reviewedAt || todaysRecord.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·') : 'Recently'}</strong></span>
                                </div>
                                
                                <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef444440', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    Status: Rejected
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Monthly Summary */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass"
                        style={{ padding: '1rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.1rem' }}>This Month</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3b82f6' }}>{new Date().toLocaleString('default', { month: 'long' })}</p>
                            </div>
                            <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Present</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>{monthlyStats.approved}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Rejected</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ef4444' }}>{monthlyStats.rejected}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Pending</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f59e0b' }}>{monthlyStats.pending}</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                            <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Monthly attendance summary ({new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()})</p>
                        </div>
                    </motion.div>
                </div>
            )}

            {user.role === 'admin' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Total Records', value: stats.total, color: '#3b82f6', icon: <Calendar size={20} />, sub: 'Based on current filters' },
                            { label: 'Approved', value: stats.approved, color: '#10b981', icon: <CheckCircle size={20} />, sub: 'Based on current filters' },
                            { label: 'Rejected', value: stats.rejected, color: '#ef4444', icon: <XCircle size={20} />, sub: 'Based on current filters' },
                            { label: 'Pending Approval', value: stats.pending, color: '#f59e0b', icon: <Clock size={20} />, sub: 'Based on current filters' },
                        ].map((stat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass" 
                                style={{ padding: '1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: `1px solid ${stat.color}20`, position: 'relative' }}
                            >
                                <div style={{ padding: '0.75rem', background: `${stat.color}15`, borderRadius: '0.75rem', color: stat.color }}>{stat.icon}</div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stat.value}</p>
                                    <p style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.2rem' }}>{stat.sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>User</label>
                            <select 
                                value={filterUser} 
                                onChange={(e) => setFilterUser(e.target.value)}
                                style={{ width: '100%', height: '42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 1rem', borderRadius: '0.75rem', colorScheme: 'dark', fontSize: '0.9rem', fontWeight: '500' }}
                            >
                                <option value="all" style={{ background: '#1e293b' }}>All Users</option>
                                {users.map(u => <option key={u._id} value={u._id} style={{ background: '#1e293b' }}>{u.userId}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Status</label>
                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ width: '100%', height: '42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 1rem', borderRadius: '0.75rem', colorScheme: 'dark', fontSize: '0.9rem', fontWeight: '500' }}
                            >
                                <option value="all" style={{ background: '#1e293b' }}>All Status</option>
                                <option value="pending" style={{ background: '#1e293b' }}>Pending</option>
                                <option value="approved" style={{ background: '#1e293b' }}>Approved</option>
                                <option value="rejected" style={{ background: '#1e293b' }}>Rejected</option>
                                <option value="not_marked" style={{ background: '#1e293b' }}>Not Marked</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>From Date</label>
                            <input 
                                type="date" 
                                value={filterDate.start} 
                                max={filterDate.end || undefined}
                                placeholder="Select start date"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFilterDate(f => ({ 
                                        ...f, 
                                        start: val,
                                        end: (f.end && val > f.end) ? val : f.end
                                    }));
                                }}
                                style={{ width: '100%', height: '42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 1rem', borderRadius: '0.75rem', colorScheme: 'dark', fontSize: '0.9rem', fontWeight: '500' }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>To Date</label>
                            <input 
                                type="date" 
                                value={filterDate.end} 
                                min={filterDate.start || undefined}
                                placeholder="Select end date"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFilterDate(f => ({ 
                                        ...f, 
                                        end: val,
                                        start: (f.start && val < f.start) ? val : f.start
                                    }));
                                }}
                                style={{ width: '100%', height: '42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 1rem', borderRadius: '0.75rem', colorScheme: 'dark', fontSize: '0.9rem', fontWeight: '500' }}
                            />
                        </div>
                        <button 
                            onClick={handleResetFilters}
                            title="Reset all filters"
                            style={{ height: '42px', padding: '0 1.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: '800' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                            Reset
                        </button>
                    </div>
                </>
            )}

            <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                <div 
                    className="glass"
                    style={{ 
                        position: 'sticky', 
                        top: '1rem', 
                        zIndex: 100,
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '1rem', 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        margin: selectedIds.length > 0 ? '0 1rem 1rem' : '0',
                        backgroundColor: selectedIds.length > 0 ? 'rgba(20, 20, 20, 0.95)' : 'transparent',
                        backdropFilter: 'blur(10px)',
                        borderRadius: selectedIds.length > 0 ? '0.75rem' : '1rem 1rem 0 0',
                        boxShadow: selectedIds.length > 0 ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {user.role === 'admin' && (
                            <input 
                                type="checkbox" 
                                checked={attendance.length > 0 && selectedIds.length === attendance.length} 
                                onChange={toggleSelectAll}
                                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                            />
                        )}
                        <span style={{ fontSize: '0.9rem', color: selectedIds.length > 0 ? '#ffffff' : '#94a3b8', fontWeight: selectedIds.length > 0 ? 'bold' : 'normal' }}>
                            {user.role === 'admin' ? (selectedIds.length > 0 ? `${selectedIds.length} records selected` : 'Select records for bulk actions') : 'Your attendance history'}
                        </span>
                    </div>
                    {user.role === 'admin' && selectedIds.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', marginRight: '0.5rem' }}>Shortcuts: [A] Approve [R] Reject [Esc] Clear</span>
                            <button onClick={() => handleBulkStatusUpdate('approved')} style={{ padding: '0.5rem 1.25rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <CheckCircle size={14} /> Approve
                            </button>
                            <button onClick={() => handleBulkStatusUpdate('rejected')} style={{ padding: '0.5rem 1.25rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <XCircle size={14} /> Reject
                            </button>
                            <button onClick={() => setSelectedIds([])} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                <XCircle size={18} />
                            </button>
                        </div>
                    )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {user.role === 'admin' && <th style={{ padding: '1rem', width: '40px' }}></th>}
                                {user.role === 'admin' && <th style={{ padding: '1rem' }}>User Name</th>}
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Marked At</th>
                                <th style={{ padding: '1rem' }}>Reviewed By</th>
                                {user.role === 'admin' && <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading records...</td></tr>
                            ) : attendance.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                    <div style={{ padding: '2rem' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                                        <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#94a3b8' }}>No attendance records found</p>
                                        <p style={{ fontSize: '0.9rem' }}>Start by marking your attendance for today.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                attendance.map(record => (
                                    <tr 
                                        key={record._id} 
                                        onMouseEnter={() => setHoveredRow(record._id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                        style={{ 
                                            borderBottom: '1px solid rgba(255,255,255,0.02)', 
                                            background: selectedIds.includes(record._id) 
                                                ? 'rgba(59, 130, 246, 0.1)' 
                                                : record.status === 'approved' 
                                                    ? 'rgba(16, 185, 129, 0.02)' 
                                                    : record.status === 'rejected' 
                                                        ? 'rgba(239, 68, 68, 0.02)' 
                                                        : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        {user.role === 'admin' && (
                                            <td style={{ padding: '1rem' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.includes(record._id)} 
                                                    onChange={() => toggleSelect(record._id)}
                                                    style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                                                />
                                            </td>
                                        )}
                                        {user.role === 'admin' && <td style={{ padding: '1rem', fontWeight: '500' }}>{record.userId?.userId || 'N/A'}</td>}
                                        <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                                            {record.date.split('-').reverse().join('-')}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span 
                                                title={record.status === 'approved' ? 'Approved by admin' : record.status === 'rejected' ? (record.autoAbsent ? 'Automatically marked absent' : 'Rejected by admin') : 'Awaiting admin review'}
                                                style={{ 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '1rem', 
                                                    fontSize: '0.7rem', 
                                                    fontWeight: 'bold', 
                                                    background: `${getStatusColor(record.status)}15`, 
                                                    color: getStatusColor(record.status),
                                                    border: `1px solid ${getStatusColor(record.status)}30`,
                                                    textTransform: 'uppercase',
                                                    cursor: 'help',
                                                    letterSpacing: '0.02em'
                                                }}
                                            >
                                                {record.status === 'approved' ? '🟢 Approved' : record.status === 'rejected' ? '🔴 Rejected' : record.status === 'not_marked' ? (record.isSunday ? '🏖️ Sunday' : '⚪ Not Marked') : '🟡 Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                            {record.status === 'not_marked' ? (
                                                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Did not mark</span>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Clock size={12} />
                                                    {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            {record.status === 'not_marked' ? (
                                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{record.isSunday ? 'Weekly Holiday' : 'No submission'}</span>
                                            ) : record.status === 'pending' ? (
                                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Awaiting review</span>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    <div style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <UserIcon size={12} color="#64748b" /> {record.autoAbsent ? 'System Auto-Marked' : <>Reviewed by <strong>Admin</strong></>}
                                                    </div>
                                                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                                        {record.autoAbsent ? 'Missing end-of-day record' : new Date(record.reviewedAt || record.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·')}
                                                    </div>
                                                    {record.adminRemark && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem', fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>"{record.adminRemark}"</p>}
                                                </div>
                                            )}
                                        </td>
                                        {user.role === 'admin' && (
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {(record.status === 'pending' || record.status === 'not_marked') && (
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        gap: '0.5rem', 
                                                        justifyContent: 'flex-end',
                                                        opacity: hoveredRow === record._id ? 1 : 0,
                                                        transition: 'all 0.2s',
                                                        visibility: hoveredRow === record._id ? 'visible' : 'hidden'
                                                    }}>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(record._id, 'approved')}
                                                            title={record.status === 'not_marked' ? "Mark as Present" : "Approve attendance"}
                                                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                        >
                                                            {record.status === 'not_marked' ? 'Mark Present' : 'Approve'}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(record._id, 'rejected')}
                                                            title={record.status === 'not_marked' ? "Mark as Absent" : "Reject attendance"}
                                                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                        >
                                                            {record.status === 'not_marked' ? 'Mark Absent' : 'Reject'}
                                                        </button>
                                                    </div>
                                                )}
                                                {record.status !== 'pending' && record.status !== 'not_marked' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(record._id, record.status === 'approved' ? 'rejected' : 'approved')}
                                                        title="Review or update attendance"
                                                        style={{ 
                                                            background: 'rgba(255,255,255,0.05)', 
                                                            border: '1px solid rgba(255,255,255,0.1)', 
                                                            color: '#94a3b8', 
                                                            padding: '0.4rem 0.8rem', 
                                                            borderRadius: '0.5rem', 
                                                            cursor: 'pointer', 
                                                            fontSize: '0.75rem',
                                                            opacity: hoveredRow === record._id ? 1 : 0,
                                                            transition: 'all 0.2s',
                                                            visibility: hoveredRow === record._id ? 'visible' : 'hidden'
                                                        }}
                                                    >
                                                        Edit Status
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AlertModal 
                isOpen={alertState.isOpen} 
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            <PromptModal 
                isOpen={promptState.isOpen}
                onClose={() => setPromptState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={(val) => submitStatusUpdate(promptState.id, promptState.status, val)}
                title={promptState.title}
                message={promptState.message}
                placeholder="Enter admin remark (optional)"
                confirmText="❌ Reject"
            />

            <ConfirmModal 
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    const status = confirmState.status;
                    if (status === 'rejected') {
                        setPromptState({ isOpen: true, id: confirmState.id, status, title: 'Reject Attendance', message: 'Please provide a reason (optional):' });
                    } else {
                        submitStatusUpdate(confirmState.id, status, '');
                    }
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                }}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.status === 'approved' ? '✅ Approve' : 'Yes, Change Status'}
            />
        </div>
    );
};

export default Attendance;
