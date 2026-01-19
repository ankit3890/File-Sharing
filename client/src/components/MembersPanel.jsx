import React, { useState } from 'react';
import { Search, User, Shield, Circle } from 'lucide-react';

const MembersPanel = ({ members = [], onMemberSelect, selectedMemberId }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const isOnline = (lastActive) => {
        if (!lastActive) return false;
        const diff = new Date() - new Date(lastActive);
        return diff < 5 * 60 * 1000; // 5 minutes
    };

    const filteredMembers = members.filter(m => 
        m.userId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} /> Team Members
                </h3>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        placeholder="Search members..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '0.5rem 0.5rem 0.5rem 2.5rem', 
                            borderRadius: '0.5rem', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            background: 'rgba(0,0,0,0.2)', 
                            color: 'white' 
                        }}
                    />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', paddingLeft: '0.25rem' }}>
                    Select a user to filter files
                </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredMembers.map(member => {
                    const isSelected = selectedMemberId === member._id;
                    return (
                        <div 
                            key={member._id} 
                            onClick={() => onMemberSelect && onMemberSelect(member)}
                            style={{ 
                                padding: '0.75rem', 
                                borderRadius: '0.5rem', 
                                background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)', 
                                border: isSelected ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className="member-row"
                        >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    background: '#3b82f6', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold'
                                }}>
                                    {member.userId?.[0]?.toUpperCase()}
                                </div>
                                <Circle 
                                    size={10} 
                                    fill={isOnline(member.lastActive) ? '#22c55e' : '#94a3b8'} 
                                    color={isOnline(member.lastActive) ? '#22c55e' : '#94a3b8'} 
                                    style={{ position: 'absolute', bottom: -2, right: -2, border: '2px solid #1e293b', borderRadius: '50%' }}
                                />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{member.userId}</p>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    {isOnline(member.lastActive) ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>
                        {member.role === 'admin' && (
                            <div title="Admin" style={{ color: '#eab308' }}>
                                <Shield size={16} />
                            </div>
                        )}
                    </div>
                    );
                })}
                {filteredMembers.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#64748b', marginTop: '1rem', fontSize: '0.9rem' }}>No members found</p>
                )}
            </div>
        </div>
    );
};

export default MembersPanel;
