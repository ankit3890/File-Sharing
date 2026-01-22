import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import SummaryCard from '../../components/dashboard/SummaryCard';
import SummaryCardSkeleton from '../../components/dashboard/SummaryCardSkeleton';
import RecentFiles from '../../components/dashboard/RecentFiles';
import { Folder, HardDrive, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import './dashboard.css';

const UserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // User State
    const [summary, setSummary] = useState(null);
    const [recentFiles, setRecentFiles] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [filesLoading, setFilesLoading] = useState(true);

    const fetchSummary = async () => {
        try {
            const res = await api.get('/dashboard/user-summary');
            setSummary(res.data);
        } catch (error) {
            console.error("Dashboard Summary Load Error:", error);
        } finally {
            setSummaryLoading(false);
        }
    };

    const fetchFiles = async () => {
        try {
            const res = await api.get('/dashboard/user-recent-files');
            setRecentFiles(res.data);
        } catch (error) {
            console.error("Dashboard Files Load Error:", error);
        } finally {
            setFilesLoading(false);
        }
    };

    const fetchAll = () => {
        fetchSummary();
        fetchFiles();
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // Helper to render files skeleton
    const renderFilesSkeleton = () => (
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', height: '500px' }}>
            <div className="skeleton-line" style={{ width: '25%', marginBottom: '1.5rem' }} />
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-line" style={{ height: '50px', marginBottom: '1rem' }} />
            ))}
        </div>
    );

    const getAttendanceIcon = () => {
        if (!summary) return { icon: Clock, color: '#f59e0b' };
        const status = summary.attendance?.toLowerCase();
        if (status === 'approved') return { icon: CheckCircle, color: '#10b981' };
        if (status === 'rejected') return { icon: XCircle, color: '#ef4444' };
        return { icon: Clock, color: '#f59e0b' };
    };

    const handleApplyAttendance = async () => {
        try {
            await api.post('/attendance/mark');
            fetchSummary(); // Refresh summary to show 'Pending' immediately
        } catch (error) {
            console.error('Attendance Apply Error', error);
            alert('Failed to apply for attendance. You may have already applied today.');
        }
    };

    const todayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', title: 'numeric', month: 'long', day: 'numeric'
    }).toUpperCase();

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div>
                <h2 className="welcome-title" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    Welcome back, {user.name || user.userId.split('@')[0]} 👋
                </h2>
                <p style={{ color: '#94a3b8' }}>Here’s what’s happening today.</p>
            </div>

            {/* --- PROMINENT ATTENDANCE SECTION --- */}
            {/* Show skeleton or attendance CTA if loaded */}
            {summaryLoading ? (
                 <div className="glass" style={{ height: '200px', borderRadius: '1.5rem', padding: '2rem' }}>
                     <div className="skeleton-line" style={{ width: '20%', margin: '0 auto 1.5rem' }} />
                     <div className="skeleton-line" style={{ width: '40%', height: '50px', margin: '0 auto 1rem', borderRadius: '1.25rem' }} />
                     <div className="skeleton-line" style={{ width: '30%', margin: '0 auto' }} />
                 </div>
            ) : summary && summary.attendance === 'Not Marked' && (
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

            {/* --- USER SECTION --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#e2e8f0' }}>My Workspace</h3>

                {/* User Stats Cards */}
                <div className="dashboard-grid">
                    {summaryLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
                    ) : summary ? (
                        <>
                            <SummaryCard 
                                title="My Projects" 
                                value={summary.projects} 
                                subtext="Active projects"
                                icon={Folder} 
                                color="#8b5cf6" 
                                onClick={() => navigate('/projects')}
                            />
                            <SummaryCard 
                                title="Storage Used" 
                                value={`${(summary.storage.used / 1024 / 1024).toFixed(0)} MB`} 
                                subtext={`${summary.storage.percent}% of Limit`}
                                icon={HardDrive} 
                                color={summary.storage.percent >= 90 ? '#ef4444' : summary.storage.percent >= 70 ? '#eab308' : '#ffffff'} 
                                onClick={() => navigate('/manage-space')}
                            />
                            <SummaryCard 
                                title="My Files" 
                                value={summary.files} 
                                subtext="Total uploaded files"
                                icon={FileText} 
                                color="#6366f1" 
                                onClick={() => {
                                    const element = document.getElementById('recent-files-section');
                                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                                }}
                            />
                            <SummaryCard 
                                title="Attendance" 
                                value={summary.attendance === 'Not Marked' ? 'Pending' : summary.attendance.charAt(0).toUpperCase() + summary.attendance.slice(1)} 
                                subtext="Your daily attendance"
                                icon={getAttendanceIcon().icon} 
                                color={getAttendanceIcon().color} 
                                onClick={() => navigate('/attendance')}
                            />
                        </>
                    ) : <div className="p-4 text-red-400">Failed to load summary.</div>}
                </div>

                {/* Main Content Area */}
                <div id="recent-files-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {filesLoading ? renderFilesSkeleton() : (
                        <RecentFiles files={recentFiles} onRefresh={fetchAll} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
