import React, { useState } from 'react';
import UserManagement from '../components/admin/UserManagement';
import ProjectManagement from '../components/admin/ProjectManagement';
import LogViewer from '../components/admin/LogViewer';
import { Users, Folder, Activity, Settings } from 'lucide-react';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                <button 
                    onClick={() => setActiveTab('users')}
                    style={{ 
                        padding: '1rem', 
                        background: 'transparent', 
                        border: 'none', 
                        borderBottom: activeTab === 'users' ? '2px solid #3b82f6' : '2px solid transparent', 
                        color: activeTab === 'users' ? '#3b82f6' : '#94a3b8', 
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600'
                    }}
                >
                    <Users size={18} /> Users
                </button>
                <button 
                    onClick={() => setActiveTab('projects')}
                    style={{ 
                        padding: '1rem', 
                        background: 'transparent', 
                        border: 'none', 
                        borderBottom: activeTab === 'projects' ? '2px solid #3b82f6' : '2px solid transparent', 
                        color: activeTab === 'projects' ? '#3b82f6' : '#94a3b8', 
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600'
                    }}
                >
                    <Folder size={18} /> Projects
                </button>
                <button 
                    onClick={() => setActiveTab('logs')}
                    style={{ 
                        padding: '1rem', 
                        background: 'transparent', 
                        border: 'none', 
                        borderBottom: activeTab === 'logs' ? '2px solid #3b82f6' : '2px solid transparent', 
                        color: activeTab === 'logs' ? '#3b82f6' : '#94a3b8', 
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600'
                    }}
                >
                    <Activity size={18} /> Audit Logs
                </button>
            </div>

            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'projects' && <ProjectManagement />}
                {activeTab === 'logs' && <LogViewer />}
            </div>
        </div>
    );
};

export default AdminPanel;
