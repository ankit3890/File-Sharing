import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import SummaryCard from '../../components/dashboard/SummaryCard';
import AdminQueue from '../../components/dashboard/AdminQueue';
import { Users, Folder, File, HardDrive } from 'lucide-react';

const AdminDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [queue, setQueue] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [summaryRes, queueRes] = await Promise.all([
                api.get('/dashboard/admin-summary'),
                api.get('/dashboard/admin-queue')
            ]);
            setSummary(summaryRes.data);
            setQueue(queueRes.data);
        } catch (error) {
            console.error("Admin Dashboard Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-white">Loading Admin Panel...</div>;
    if (!summary) return <div className="p-8 text-center text-white">Failed to load data.</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>System Overview 🛠️</h2>
                <p style={{ color: '#94a3b8' }}>Monitor system health and pending actions.</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <SummaryCard 
                    title="Total Users" 
                    value={summary.users} 
                    icon={Users} 
                    color="#3b82f6" 
                />
                <SummaryCard 
                    title="Active Projects" 
                    value={summary.projects} 
                    icon={Folder} 
                    color="#8b5cf6" 
                />
                 <SummaryCard 
                    title="Total Files" 
                    value={summary.files} 
                    icon={File} 
                    color="#10b981" 
                />
                <SummaryCard 
                    title="System Storage" 
                    value={`${(summary.storage / 1024 / 1024).toFixed(0)} MB`} 
                    icon={HardDrive} 
                    color="#f59e0b" 
                />
            </div>

            {/* Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <AdminQueue 
                    pendingAttendance={queue.pendingAttendance} 
                    storageAlerts={queue.storageAlerts}
                    onRefresh={fetchData}
                />
                
                {/* Right Side: Recent Global Files or Logs (For now reusing RecentFiles logic or custom) */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Latest Uploads</h3>
                     {queue.recentFiles.length === 0 ? (
                         <p style={{ color: '#94a3b8' }}>No recent uploads.</p>
                     ) : (
                         <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                             {queue.recentFiles.map(f => (
                                 <li key={f._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                                     <div>
                                         <p style={{ fontWeight: 500 }}>{f.originalName}</p>
                                         <p style={{ fontSize: '0.8rem', color: '#64748b' }}>by {f.uploader?.username} • {(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                     </div>
                                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(f.uploadedAt).toLocaleDateString()}</p>
                                 </li>
                             ))}
                         </ul>
                     )}
                </div>
            </div>
            <style>{`
                 @media (max-width: 1024px) {
                    div[style*="gridTemplateColumns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                 }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
