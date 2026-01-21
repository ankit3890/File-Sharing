import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import SummaryCard from '../../components/dashboard/SummaryCard';
import RecentFiles from '../../components/dashboard/RecentFiles';
import AdminQueue from '../../components/dashboard/AdminQueue';
import { Folder, HardDrive, FileText, CheckCircle, Clock, XCircle, Users, File } from 'lucide-react';

const UserDashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    
    // User State
    const [summary, setSummary] = useState(null);
    const [recentFiles, setRecentFiles] = useState([]);
    
    // Admin State
    const [adminSummary, setAdminSummary] = useState(null);
    const [adminQueue, setAdminQueue] = useState(null);
    
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            // Always fetch User Data
            const userPromises = [
                api.get('/dashboard/user-summary'),
                api.get('/dashboard/user-recent-files')
            ];

            // Conditionally fetch Admin Data
            if (isAdmin) {
                userPromises.push(api.get('/dashboard/admin-summary'));
                userPromises.push(api.get('/dashboard/admin-queue'));
            }

            const results = await Promise.all(userPromises);
            
            // Unpack User Data
            setSummary(results[0].data);
            setRecentFiles(results[1].data);

            // Unpack Admin Data
            if (isAdmin) {
                setAdminSummary(results[2].data);
                setAdminQueue(results[3].data);
            }

        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [isAdmin]);

    if (loading) return <div className="p-8 text-center text-white">Loading Dashboard...</div>;
    if (!summary) return <div className="p-8 text-center text-white">Failed to load data.</div>;

    const getAttendanceIcon = () => {
        const status = summary.attendance?.toLowerCase();
        if (status === 'approved') return { icon: CheckCircle, color: '#10b981' };
        if (status === 'rejected') return { icon: XCircle, color: '#ef4444' };
        return { icon: Clock, color: '#f59e0b' };
    };

    const attStatus = getAttendanceIcon();
    const storageColor = summary.storage.percent >= 90 ? '#ef4444' : summary.storage.percent >= 70 ? '#eab308' : '#3b82f6';
    
    const handleApplyAttendance = async () => {
        try {
            await api.post('/attendance/mark');
            // Refresh dashboard to show 'Pending' immediately
            fetchDashboardData();
        } catch (error) {
            console.error('Attendance Apply Error', error);
            alert('Failed to apply for attendance. You may have already applied today.');
        }
    };

    const displayAttendance = summary.attendance === 'Not Marked' 
        ? 'Pending' 
        : summary.attendance.charAt(0).toUpperCase() + summary.attendance.slice(1);

    const todayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).toUpperCase();

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div>
                <h2 className="welcome-title" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Welcome back, {user.userId.split('@')[0]} 👋</h2>
                <p style={{ color: '#94a3b8' }}>Here’s what’s happening today.</p>
            </div>

            {/* --- PROMINENT ATTENDANCE SECTION (User Only) --- */}
            {!isAdmin && summary.attendance === 'Not Marked' && (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '3rem 2rem',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    textAlign: 'center',
                    gap: '1.5rem',
                    marginBottom: '1rem'
                }}>
                    <h4 style={{ 
                        color: '#94a3b8', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        letterSpacing: '0.15em',
                        opacity: 0.8
                    }}>
                        TODAY IS {todayDate}
                    </h4>
                    
                    <button 
                        onClick={handleApplyAttendance}
                        className="attendance-btn"
                        style={{
                            padding: '1.25rem 3.5rem',
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            color: 'white',
                            backgroundColor: '#10b981',
                            backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '1.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem',
                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.5)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
                        }}
                    >
                        <div style={{ 
                            width: '14px', 
                            height: '14px', 
                            background: '#34d399', 
                            borderRadius: '50%', 
                            boxShadow: '0 0 12px #fff',
                            border: '2px solid rgba(255,255,255,0.3)'
                        }}></div>
                        Mark Today's Attendance
                    </button>

                    <p style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
                        You can mark attendance only once per day.
                    </p>
                </div>
            )}

            {/* --- ADMIN SECTION --- */}
            {isAdmin && adminSummary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} className="text-purple-400" /> System Overview (Admin)
                    </h3>
                    
                    {/* Admin Stats Cards */}
                    <div className="dashboard-grid">
                        <SummaryCard 
                            title="Total Users" 
                            value={adminSummary.users} 
                            subtext="Registered users"
                            icon={Users} 
                            color="#8b5cf6" 
                            onClick={() => window.location.href = '/admin'}
                        />
                        <SummaryCard 
                            title="Total Projects" 
                            value={adminSummary.projects} 
                            subtext="Active projects"
                            icon={Folder} 
                            color="#3b82f6" 
                            onClick={() => window.location.href = '/projects'}
                        />
                        <SummaryCard 
                            title="Total Files" 
                            value={adminSummary.files} 
                            subtext="Across all projects"
                            icon={File} 
                            color="#10b981" 
                            onClick={() => window.location.href = '/projects'}
                        />
                        <SummaryCard 
                            title="System Storage" 
                            value={`${(adminSummary.storage / 1024 / 1024).toFixed(0)} MB`} 
                            subtext="Used by all users"
                            icon={HardDrive} 
                            color="#f59e0b" 
                            onClick={() => window.location.href = '/manage-space'}
                        />
                    </div>

                    {/* Admin Action Queue */}
                    {adminQueue && (
                        <AdminQueue 
                            pendingAttendance={adminQueue.pendingAttendance} 
                            storageAlerts={adminQueue.storageAlerts}
                            recentFiles={adminQueue.recentFiles}
                            onRefresh={fetchDashboardData}
                        />
                    )}
                </div>
            )}

            {/* --- USER SECTION --- */}
            {!isAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#e2e8f0' }}>My Workspace</h3>

                    {/* User Stats Cards */}
                    <div className="dashboard-grid">
                        <SummaryCard 
                            title="My Projects" 
                            value={summary.projects} 
                            subtext="Active projects"
                            icon={Folder} 
                            color="#8b5cf6" 
                            onClick={() => window.location.href = '/projects'}
                        />
                        <SummaryCard 
                            title="Storage Used" 
                            value={`${(summary.storage.used / 1024 / 1024).toFixed(0)} MB`} 
                            subtext={`${summary.storage.percent}% of Limit`}
                            icon={HardDrive} 
                            color={storageColor} 
                            onClick={() => window.location.href = '/manage-space'}
                        />
                        <SummaryCard 
                            title="My Files" 
                            value={summary.files} 
                            subtext="Total uploaded files"
                            icon={FileText} 
                            color="#6366f1" 
                            onClick={() => {
                                // Scroll to recent files section
                                const element = document.getElementById('recent-files-section');
                                if (element) element.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                        <SummaryCard 
                            title="Attendance" 
                            value={displayAttendance} 
                            subtext="Your daily attendance"
                            icon={attStatus.icon} 
                            color={attStatus.color} 
                            onClick={() => window.location.href = '/attendance'}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div id="recent-files-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <RecentFiles files={recentFiles} onRefresh={fetchDashboardData} />
                    </div>
                </div>
            )}
            <style>{`
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                }

                @media (max-width: 1024px) {
                    .dashboard-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                    }
                }

                @media (max-width: 768px) {
                    .dashboard-grid {
                        gap: 0.75rem;
                    }
                    .welcome-title {
                        font-size: 1.5rem !important;
                    }
                    .attendance-btn {
                        width: 100%;
                        padding: 1rem 2rem !important;
                        font-size: 1rem !important;
                        border-radius: 1rem !important;
                    }
                }

                @media (max-width: 480px) {
                    .dashboard-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </div>
    );
};

export default UserDashboard;
