import React, { useState, lazy, Suspense } from 'react';
import { Users, Folder, Activity } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

// Lazy load admin sections (IMPORTANT for bundle size)
const UserManagement = lazy(() => import('../components/admin/UserManagement'));
const ProjectManagement = lazy(() => import('../components/admin/ProjectManagement'));
const LogViewer = lazy(() => import('../components/admin/LogViewer'));

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users');

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
        padding: '1rem',
        background: 'transparent',
        border: 'none',
        borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
        color: activeTab === tab ? '#3b82f6' : '#94a3b8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 600,
    });

    return (
        <div>
            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem',
                    borderBottom: '1px solid var(--border)',
                }}
            >
                <button onClick={() => setActiveTab('users')} style={tabStyle('users')}>
                    <Users size={18} /> Users
                </button>

                <button onClick={() => setActiveTab('projects')} style={tabStyle('projects')}>
                    <Folder size={18} /> Projects
                </button>

                <button onClick={() => setActiveTab('logs')} style={tabStyle('logs')}>
                    <Activity size={18} /> Audit Logs
                </button>
            </div>

            {/* Content */}
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
                <Suspense fallback={<SkeletonLoader />}>
                    {renderTab()}
                </Suspense>
            </div>
        </div>
    );
};

export default AdminPanel;
