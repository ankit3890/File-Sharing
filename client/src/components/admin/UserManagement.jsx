import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Trash2, UserPlus, User, Shield, Database, MoreVertical } from 'lucide-react';
import AlertModal from '../AlertModal';
import ConfirmModal from '../ConfirmModal';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [activeMenu, setActiveMenu] = useState(null);
    
    // Modal States
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const [confirmState, setConfirmState] = useState({ isOpen: false, userId: null });

    const parentRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        fetchUsers();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Virtualization Setup
    const rowVirtualizer = useVirtualizer({
        count: parentRef.current ? users.length : 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => isMobile ? 140 : 70,
        overscan: 5,
    });

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', { userId: newUser });
            setNewUser('');
            fetchUsers();
            setAlertState({ isOpen: true, title: 'Success', message: 'User added successfully', type: 'success' });
        } catch (error) {
            setAlertState({ 
                isOpen: true, 
                title: 'Operation Failed', 
                message: error.response?.data?.message || 'Failed to add user', 
                type: 'error' 
            });
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmState({ isOpen: true, userId: id });
    };

    const confirmDelete = async () => {
        if (!confirmState.userId) return;
        try {
            await api.delete(`/users/${confirmState.userId}`);
            fetchUsers();
            setAlertState({ isOpen: true, title: 'Success', message: 'User permanentely removed', type: 'success' });
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to delete user', type: 'error' });
        } finally {
            setConfirmState({ isOpen: false, userId: null });
            setActiveMenu(null);
        }
    };

    return (
        <div className="user-mgmt-view" style={{ color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>User Management</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.75rem', borderRadius: '1rem' }}>
                    {users.length} TOTAL USERS
                </span>
            </div>
            
            <form onSubmit={handleAddUser} className="add-user-form">
                <div style={{ position: 'relative', flex: 1 }}>
                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                        type="text" 
                        value={newUser} 
                        onChange={(e) => setNewUser(e.target.value)} 
                        placeholder="Enter user email or ID..." 
                        className="input-field admin-input" 
                    />
                </div>
                <button type="submit" className="btn btn-primary add-btn">
                    <UserPlus size={18} /> <span>Add User</span>
                </button>
            </form>

            <div className="glass admin-container">
                <div 
                    ref={parentRef} 
                    className="admin-scroll-area"
                    style={{ height: users.length > 0 ? '500px' : 'auto', minHeight: '200px' }}
                >
                    {!isMobile && (
                        <div className="admin-table-header user-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                            <div>User Entity</div>
                            <div>Permissions</div>
                            <div>Storage Usage</div>
                            <div style={{ textAlign: 'right' }}>Management</div>
                        </div>
                    )}

                    {loading && users.length === 0 ? (
                        <div style={{ padding: '1rem' }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                isMobile ? (
                                    <div key={i} className="mobile-admin-card" style={{ marginBottom: '1rem' }}>
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
                                ) : (
                                    <div key={i} className="admin-table-row user-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
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
                                )
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <User size={48} strokeWidth={1} style={{ opacity: 0.2 }} />
                            <p>No user entities found in the system registry.</p>
                        </div>
                    ) : (
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map(virtualRow => {
                                const user = users[virtualRow.index];
                                const isAdmin = user.role === 'admin';

                                if (isMobile) {
                                    return (
                                        <div 
                                            key={user._id}
                                            style={{
                                                position: 'absolute', top: 0, left: 0, width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                                padding: '0.5rem 1rem'
                                            }}
                                        >
                                            <div className="mobile-admin-card">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                        <div className={`avatar-box ${isAdmin ? 'admin' : ''}`}>
                                                            {isAdmin ? <Shield size={16} /> : <User size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className="entity-name">{user.userId}</p>
                                                            <span className={`role-badge ${isAdmin ? 'admin' : ''}`}>
                                                                {user.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <button 
                                                            onClick={() => setActiveMenu(activeMenu === user._id ? null : user._id)}
                                                            className="icon-btn-ghost"
                                                        >
                                                            <MoreVertical size={20} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {activeMenu === user._id && !isAdmin && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    className="admin-overflow-menu"
                                                                >
                                                                    <button onClick={() => handleDeleteClick(user._id)} className="delete-action">
                                                                        <Trash2 size={16} /> Terminate User
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                                <div className="card-footer">
                                                    <div className="stat-item">
                                                        <Database size={14} />
                                                        <span>{(user.storageUsed / 1048576).toFixed(2)} MB Used</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div 
                                        key={user._id}
                                        className="admin-table-row user-row"
                                        style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                            <div className={`avatar-box ${isAdmin ? 'admin' : ''}`}>
                                                {isAdmin ? <Shield size={18} /> : <User size={18} />}
                                            </div>
                                            <span className="entity-name"><span>{user.userId}</span></span>
                                        </div>
                                        <div>
                                            <span className={`role-badge ${isAdmin ? 'admin' : ''}`}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontWeight: 600 }}>
                                            <Database size={16} style={{ color: '#64748b' }} />
                                            {(user.storageUsed / 1048576).toFixed(2)} MB
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            {!isAdmin && (
                                                <button onClick={() => handleDeleteClick(user._id)} className="icon-btn-danger" title="Delete User">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <AlertModal 
                isOpen={alertState.isOpen} 
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            <ConfirmModal 
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                title="Delete User?"
                message="Are you sure you want to delete this user? This will delete all their files and cannot be undone."
                confirmText="Delete User"
                variant="danger"
            />

            <style>{`
                .user-mgmt-view .add-user-form { display: flex; gap: 1rem; margin-bottom: 2rem; }
                .user-mgmt-view .admin-input { padding-left: 2.5rem !important; margin-bottom: 0 !important; height: 42px; font-weight: 500; font-size: 0.9rem; border-radius: 0.75rem; background: rgba(0,0,0,0.2); }
                .user-mgmt-view .add-btn { display: flex; align-items: center; gap: 0.75rem; padding: 0 1.5rem; height: 42px; font-weight: 800; font-size: 0.9rem; border-radius: 0.75rem; transition: all 0.2s; }
                .user-mgmt-view .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
                
                .user-mgmt-view .admin-container { border-radius: 1rem; overflow: hidden; background: rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.05); }
                .user-mgmt-view .admin-scroll-area { width: 100%; overflow-y: auto; position: relative; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
                
                .user-mgmt-view .admin-table-header.user-header { display: grid; grid-template-columns: 300px 150px 1fr 120px; gap: 1rem; padding: 1rem 1.5rem; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.05); color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; backdrop-filter: blur(8px); }
                .user-mgmt-view .admin-table-header.user-header div { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .user-mgmt-view .admin-table-row.user-row { display: grid; grid-template-columns: 300px 150px 1fr 120px; gap: 1rem; padding: 1rem 1.5rem; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.2s; min-width: 0; }
                .user-mgmt-view .admin-table-row.user-row:hover { background: rgba(255,255,255,0.02); }
                
                .user-mgmt-view .avatar-box { width: 40px; height: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
                .user-mgmt-view .avatar-box.admin { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
                
                .user-mgmt-view .entity-name { font-weight: 700; color: #f1f5f9; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
                .user-mgmt-view .role-badge { padding: 0.25rem 0.75rem; border-radius: 2rem; background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; flex-shrink: 0; }
                .user-mgmt-view .role-badge.admin { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                
                .user-mgmt-view .icon-btn-danger { background: none; border: none; color: #64748b; cursor: pointer; padding: 10px; border-radius: 10px; transition: all 0.2s; }
                .user-mgmt-view .icon-btn-danger:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                .user-mgmt-view .icon-btn-ghost { background: none; border: none; color: #64748b; cursor: pointer; padding: 8px; border-radius: 8px; }
                .user-mgmt-view .icon-btn-ghost:hover { color: white; background: rgba(255,255,255,0.05); }

                .user-mgmt-view .mobile-admin-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
                .user-mgmt-view .card-footer { display: flex; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; margin-top: 0.5rem; }
                .user-mgmt-view .stat-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: #94a3b8; font-weight: 600; }
                
                .user-mgmt-view .admin-overflow-menu { position: absolute; right: 0; top: 100%; z-index: 100; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 0.4rem; min-width: 180px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); }
                .user-mgmt-view .delete-action { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border: none; background: none; color: #ef4444; cursor: pointer; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 700; }
                .user-mgmt-view .delete-action:hover { background: rgba(239, 68, 68, 0.1); }

                @media (max-width: 768px) {
                    .user-mgmt-view .add-user-form { flex-direction: column; }
                    .user-mgmt-view .add-btn { width: 100%; justify-content: center; }
                    .user-mgmt-view .admin-container { background: transparent; border: none; }
                }
            `}</style>
        </div>
    );
};

export default UserManagement;
