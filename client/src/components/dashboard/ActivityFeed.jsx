import React from 'react';
import { Clock, User as UserIcon, FileText, Folder } from 'lucide-react';
import { motion } from 'framer-motion';

const ActivityFeed = ({ logs }) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                No recent activity.
            </div>
        );
    }

    return (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} className="text-blue-400" /> Recent Activity
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {logs.map((log, index) => (
                    <motion.div 
                        key={log._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ 
                            display: 'flex', 
                            gap: '1rem', 
                            padding: '1rem', 
                            background: 'rgba(255,255,255,0.02)', 
                            borderRadius: '0.75rem',
                            borderLeft: `3px solid ${getActionColor(log.action)}`
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, color: '#3b82f6' }}>{log.actor?.username || 'System'}</span> {formatAction(log.action)}
                            </p> 
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                {log.details} {log.project && <span style={{ color: '#64748b' }}>• {log.project.name}</span>}
                            </p>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {formatTime(log.timestamp)}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const getActionColor = (action) => {
    if (action.includes('DELETE')) return '#ef4444';
    if (action.includes('CREATE') || action.includes('UPLOAD')) return '#10b981';
    if (action.includes('UPDATE') || action.includes('EDIT')) return '#f59e0b';
    return '#3b82f6';
};

const formatAction = (action) => {
    return action.toLowerCase().replace(/_/g, ' ');
};

const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
};

export default ActivityFeed;
