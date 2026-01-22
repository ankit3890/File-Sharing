import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import SummaryCard from '../../components/dashboard/SummaryCard';
import SummaryCardSkeleton from '../../components/dashboard/SummaryCardSkeleton';
import AdminQueue from '../../components/dashboard/AdminQueue';
import { Users, Folder, File, HardDrive } from 'lucide-react';
import './dashboard.css';

const AdminDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [queue, setQueue] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [queueLoading, setQueueLoading] = useState(true);

    const fetchSummary = async () => {
        try {
            const res = await api.get('/dashboard/admin-summary');
            setSummary(res.data);
        } catch (error) {
            console.error("Admin Summary Load Error:", error);
        } finally {
            setSummaryLoading(false);
        }
    };

    const fetchQueue = async () => {
        try {
            const res = await api.get('/dashboard/admin-queue');
            setQueue(res.data);
        } catch (error) {
            console.error("Admin Queue Load Error:", error);
        } finally {
            setQueueLoading(false);
        }
    };

    const fetchAll = () => {
        fetchSummary();
        fetchQueue();
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // Helper to render queue skeleton
    const renderQueueSkeleton = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
             <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', height: '400px' }}>
                <div className="skeleton-line" style={{ width: '30%', marginBottom: '1.5rem' }} />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-line" style={{ height: '60px', marginBottom: '1rem' }} />
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>System Overview 🛠️</h2>
                <p style={{ color: '#94a3b8' }}>Monitor system health and pending actions.</p>
            </div>

            {/* Summary Cards */}
            <div className="dashboard-grid">
                {summaryLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
                ) : summary ? (
                    <>
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
                    </>
                ) : <div className="p-4 text-red-400">Failed to load summary.</div>}
            </div>

            {/* Main Content */}
            {queueLoading ? renderQueueSkeleton() : queue ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    <AdminQueue 
                        pendingAttendance={queue.pendingAttendance} 
                        storageAlerts={queue.storageAlerts}
                        recentFiles={queue.recentFiles}
                        onRefresh={fetchAll}
                    />
                </div>
            ) : <div className="p-4 text-red-400">Failed to load queue.</div>}
        </div>
    );
};

export default AdminDashboard;
