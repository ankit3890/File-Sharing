import React, { useState, lazy, Suspense } from 'react';
import { Users, Folder, Activity, ShieldCheck } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

// Lazy load admin sections
const UserManagement = lazy(() => import('../components/admin/UserManagement'));
const ProjectManagement = lazy(() => import('../components/admin/ProjectManagement'));
const LogViewer = lazy(() => import('../components/admin/LogViewer'));

const TabSkeleton = ({ mode, isMobile }) => {
    const rows = Array.from({ length: 6 });

    const renderRow = (i) => {
        if (mode === 'users') {
             if (isMobile) {
                return (
                    <div key={i} className="mobile-admin-card" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.25rem', padding: '1.25rem' }}>
                         <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="skeleton-line" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton-line" style={{ width: '60%', height: '18px', marginBottom: '0.5rem' }} />
                                <div className="skeleton-line" style={{ width: '30%', height: '14px' }} />
                            </div>
                         </div>
                         <div className="skeleton-line" style={{ width: '100%', height: '1px', marginBottom: '1rem' }} />
                         <div className="skeleton-line" style={{ width: '40%', height: '14px' }} />
                    </div>
                );
             }
             return (
                <div key={i} className="" style={{ display: 'grid', gridTemplateColumns: '300px 150px 1fr 120px', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="skeleton-line" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                        <div className="skeleton-line" style={{ width: '120px', height: '16px' }} />
                    </div>
                    <div className="skeleton-line" style={{ width: '80px', height: '24px', borderRadius: '2rem' }} />
                    <div className="skeleton-line" style={{ width: '100px', height: '16px' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div className="skeleton-line" style={{ width: '30px', height: '30px', borderRadius: '10px' }} />
                    </div>
                </div>
            );
        }
        if (mode === 'projects') {
            if (isMobile) {
                return (
                    <div key={i} className="mobile-admin-card" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.25rem', padding: '1.25rem' }}>
                         <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                            <div className="skeleton-line" style={{ width: '40px', height: '40px', borderRadius: '0.5rem' }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton-line" style={{ width: '50%', height: '18px', marginBottom: '0.5rem' }} />
                                <div className="skeleton-line" style={{ width: '30%', height: '14px' }} />
                            </div>
                         </div>
                         <div className="skeleton-line" style={{ width: '100%', height: '1px', marginBottom: '1rem' }} />
                         <div className="skeleton-line" style={{ width: '80%', height: '20px' }} />
                    </div>
                );
            }
            return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '250px 1fr 120px', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="skeleton-line" style={{ width: '40px', height: '40px', borderRadius: '0.5rem' }} />
                        <div className="skeleton-line" style={{ width: '150px', height: '18px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div className="skeleton-line" style={{ width: '60px', height: '24px', borderRadius: '0.5rem' }} />
                        <div className="skeleton-line" style={{ width: '60px', height: '24px', borderRadius: '0.5rem' }} />
                        <div className="skeleton-line" style={{ width: '60px', height: '24px', borderRadius: '0.5rem' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                    </div>
                </div>
            );
        }
        if (mode === 'logs') {
             if (isMobile) {
                return (
                    <div key={i} className="admin-card mobile-log-card" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.25rem', padding: '1rem' }}>
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
                );
             }
             return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 160px 180px 160px 1fr', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center' }}>
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
            );
        }
        return null;
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {/* Mock Header for continuity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', opacity: 0.5 }}>
                 <div className="skeleton-line" style={{ width: '200px', height: '24px' }} />
                 <div className="skeleton-line" style={{ width: '100px', height: '24px' }} />
            </div>
            
            <div className="glass" style={{ borderRadius: '1rem', background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem' }}>
                     {rows.map((_, i) => renderRow(i))}
                </div>
            </div>
        </div>
    );
};

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const renderTab = () => {
        switch (activeTab) {
            case 'users':
                return <UserManagement />;
            case 'projects':
                return <ProjectManagement />;
            case 'logs':
                return <LogViewer />;
            default:
                return null;
        }
    };

    const tabStyle = (tab) => ({
        padding: '0.75rem 1.25rem',
        background: 'transparent',
        border: 'none',
        borderBottom: activeTab === tab ? '3px solid #ffffff' : '3px solid transparent',
        color: activeTab === tab ? '#ffffff' : '#64748b',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        fontWeight: 700,
        fontSize: '0.9rem',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        opacity: activeTab === tab ? 1 : 0.7,
    });

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Admin Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={28} className="text-white" /> System Administration
                </h2>
                <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Control users, projects, and security audit logs.</p>
            </div>

            {/* Tabs Container (Scrollable on mobile) */}
            <div
                className="admin-tabs-scroll"
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none', // Hide scrollbar for Firefox
                    msOverflowStyle: 'none' // Hide scrollbar for IE/Edge
                }}
            >
                <button onClick={() => setActiveTab('users')} style={tabStyle('users')}>
                    <Users size={18} /> User Management
                </button>

                <button onClick={() => setActiveTab('projects')} style={tabStyle('projects')}>
                    <Folder size={18} /> Projects
                </button>

                <button onClick={() => setActiveTab('logs')} style={tabStyle('logs')}>
                    <Activity size={18} /> Audit Logs
                </button>
            </div>

            {/* Content Slot */}
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <Suspense fallback={<TabSkeleton mode={activeTab} isMobile={isMobile} />}>
                    {renderTab()}
                </Suspense>
            </div>

            <style>{`
                .admin-tabs-scroll::-webkit-scrollbar {
                    display: none; /* Hide scrollbar for Chrome/Safari */
                }
                
                @media (max-width: 768px) {
                    .admin-tabs-scroll {
                        margin-left: -1rem;
                        margin-right: -1rem;
                        padding-left: 1rem;
                        padding-right: 1rem;
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AdminPanel;
