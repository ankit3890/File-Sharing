import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { FolderPlus, Trash2, Folder, UserPlus, X, Users, MoreVertical, Shield, User } from 'lucide-react';
import AlertModal from '../AlertModal';
import ConfirmModal from '../ConfirmModal';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectManagement = () => {
    const [projects, setProjects] = useState([]);
    const [newProject, setNewProject] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [activeMenu, setActiveMenu] = useState(null);
    
    // Modals
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const [confirmState, setConfirmState] = useState({ isOpen: false, projectId: null });

    const parentRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        fetchProjects();
        fetchUsers();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Virtualization Setup
    const rowVirtualizer = useVirtualizer({
        count: parentRef.current ? projects.length : 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => isMobile ? 180 : 80,
        overscan: 5,
    });

    const handleAddProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', { name: newProject });
            setNewProject('');
            fetchProjects();
            setAlertState({ isOpen: true, title: 'Success', message: 'Project created successfully', type: 'success' });
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to create project', type: 'error' });
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmState({ isOpen: true, projectId: id });
    };

    const confirmDelete = async () => {
        if (!confirmState.projectId) return;
        try {
            await api.delete(`/projects/${confirmState.projectId}`);
            fetchProjects();
            setAlertState({ isOpen: true, title: 'Success', message: 'Project and its files deleted', type: 'success' });
        } catch (error) {
             setAlertState({ isOpen: true, title: 'Error', message: 'Failed to delete project', type: 'error' });
        } finally {
            setConfirmState({ isOpen: false, projectId: null });
            setActiveMenu(null);
        }
    };

    const handleAddMember = async (projectId, userId) => {
        try {
            console.log('Adding member:', { projectId, userId });
            await api.put(`/projects/${projectId}/members`, { userId });
            await fetchProjects(); 
            // Refresh selected project state to update the modal
            const res = await api.get('/projects');
            const refreshed = res.data.find(p => p._id === projectId);
            if (refreshed) {
                setSelectedProject(refreshed);
            }
        } catch (error) {
            console.error('Add member failed:', error);
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to add member', type: 'error' });
        }
    };

    const handleRemoveMember = async (projectId, memberId) => {
        try {
            console.log('Removing member:', { projectId, memberId });
            await api.delete(`/projects/${projectId}/members/${memberId}`);
            await fetchProjects();
            // Refresh selected project state to update the modal
            const res = await api.get('/projects');
            const refreshed = res.data.find(p => p._id === projectId);
            if (refreshed) {
                setSelectedProject(refreshed);
            }
        } catch (error) {
             console.error('Remove member failed:', error);
             setAlertState({ isOpen: true, title: 'Error', message: 'Failed to remove member', type: 'error' });
        }
    };

    return (
        <div className="project-mgmt-view" style={{ color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Project Management</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.75rem', borderRadius: '1rem' }}>
                    {projects.length} SYSTEM PROJECTS
                </span>
            </div>

            <form onSubmit={handleAddProject} className="add-project-form">
                <div style={{ position: 'relative', flex: 1 }}>
                    <FolderPlus size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                        type="text" 
                        value={newProject} 
                        onChange={(e) => setNewProject(e.target.value)} 
                        placeholder="Project display name..." 
                        className="input-field admin-input" 
                    />
                </div>
                <button type="submit" className="btn btn-primary add-btn">
                    <FolderPlus size={18} /> <span>Create Project</span>
                </button>
            </form>

            <div className="glass admin-container">
                <div 
                    ref={parentRef} 
                    className="admin-scroll-area"
                    style={{ height: projects.length > 0 ? '550px' : 'auto', minHeight: '200px' }}
                >
                    {!isMobile && (
                        <div className="admin-table-header project-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                            <div>Project Context</div>
                            <div>Access & Members</div>
                            <div style={{ textAlign: 'right' }}>Management</div>
                        </div>
                    )}

                    {loading && projects.length === 0 ? (
                        <div style={{ padding: '1rem' }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                isMobile ? (
                                    <div key={i} className="mobile-admin-card" style={{ marginBottom: '1rem' }}>
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
                                ) : (
                                    <div key={i} className="admin-table-row project-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
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
                                )
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <Folder size={48} strokeWidth={1} style={{ opacity: 0.2 }} />
                            <p>No project repositories initialized in the system.</p>
                        </div>
                    ) : (
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map(virtualRow => {
                                const project = projects[virtualRow.index];
    
                                if (isMobile) {
                                    return (
                                        <div 
                                            key={project._id}
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
                                                        <div className="avatar-box project">
                                                            <Folder size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="entity-name">{project.name}</p>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                                                <Users size={12} /> {project.members?.length || 0} members
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <button 
                                                            onClick={() => setActiveMenu(activeMenu === project._id ? null : project._id)}
                                                            className="icon-btn-ghost"
                                                        >
                                                            <MoreVertical size={20} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {activeMenu === project._id && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    className="admin-overflow-menu"
                                                                >
                                                                    <button onClick={() => setSelectedProject(project)} className="action-item">
                                                                        <UserPlus size={16} /> Manage Members
                                                                    </button>
                                                                    <div className="divider" />
                                                                    <button onClick={() => handleDeleteClick(project._id)} className="delete-action">
                                                                        <Trash2 size={16} /> Delete Project
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                                
                                                <div className="member-bubbles-mobile">
                                                    {project.members?.slice(0, 3).map(m => (
                                                        <span key={m._id} className="mini-tag">
                                                            {m.userId.split('@')[0]}
                                                        </span>
                                                    ))}
                                                    {project.members?.length > 3 && (
                                                        <span className="mini-tag count">+{project.members.length - 3} more</span>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedProject(project); }} className="add-member-mini">
                                                        + Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
    
                                return (
                                    <div 
                                        key={project._id}
                                        className="admin-table-row project-row"
                                        style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                            <div className="avatar-box project">
                                                <Folder size={20} />
                                            </div>
                                            <span className="entity-name">{project.name}</span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
                                            {project.members?.slice(0, 4).map(m => (
                                                <div key={m._id} className="member-chip">
                                                    <span>{m.userId.split('@')[0]}</span>
                                                    {m.role === 'admin' ? (
                                                        <Shield size={10} className="text-yellow-500" />
                                                    ) : (
                                                        <X size={10} className="remove-icon" onClick={() => handleRemoveMember(project._id, m._id)} />
                                                    )}
                                                </div>
                                            ))}
                                            {project.members?.length > 4 && (
                                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                                                    +{project.members.length - 4} more
                                                </span>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedProject(project); }} className="add-member-btn">
                                                <UserPlus size={12} /> Members
                                            </button>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button onClick={() => handleDeleteClick(project._id)} className="icon-btn-danger" title="Delete Project">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Member Management Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
                        <motion.div 
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="glass member-modal" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h4 style={{ fontWeight: 800 }}>{selectedProject.name} Members</h4>
                                <button onClick={() => setSelectedProject(null)} className="icon-btn-ghost"><X size={20} /></button>
                            </div>

                            <div className="member-list-container">
                                {users.map(u => {
                                    const isIncluded = selectedProject.members?.some(m => m._id === u._id);
                                    return (
                                        <div key={u._id} className="member-selection-row">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="mini-avatar"><User size={14} /></div>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.userId}</span>
                                            </div>
                                            {u.role === 'admin' ? (
                                                <div className="admin-badge-mini">
                                                    <Shield size={12} fill="#eab308" />
                                                    <span>Admin</span>
                                                </div>
                                            ) : isIncluded ? (
                                                <button onClick={() => handleRemoveMember(selectedProject._id, u._id)} className="compact-remove-btn">
                                                    Remove
                                                </button>
                                            ) : (
                                                <button onClick={() => handleAddMember(selectedProject._id, u._id)} className="btn btn-primary compact-add-btn">
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <button onClick={() => setSelectedProject(null)} className="modal-close-btn">
                                Done Managing
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                title="Delete Project?"
                message="Are you sure you want to delete this project? This will permanently remove all files within it. This action is irreversible."
                confirmText="Terminate Project"
                variant="danger"
            />

            <style>{`
                .project-mgmt-view .add-project-form { display: flex; gap: 1rem; margin-bottom: 2rem; }
                .project-mgmt-view .admin-input { padding-left: 2.5rem !important; margin-bottom: 0 !important; height: 42px; font-weight: 500; font-size: 0.9rem; border-radius: 0.75rem; background: rgba(0,0,0,0.2); }
                .project-mgmt-view .add-btn { display: flex; align-items: center; gap: 0.75rem; padding: 0 1.5rem; height: 42px; font-weight: 800; font-size: 0.9rem; border-radius: 0.75rem; transition: all 0.2s; }
                .project-mgmt-view .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
                
                .project-mgmt-view .admin-container { border-radius: 1rem; overflow: hidden; }
                .project-mgmt-view .admin-scroll-area { width: 100%; overflow-y: auto; position: relative; }
                
                .project-mgmt-view .admin-container { border-radius: 1rem; overflow: hidden; background: rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.05); }
                .project-mgmt-view .admin-scroll-area { width: 100%; overflow-y: auto; position: relative; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
                
                .project-mgmt-view .admin-table-header.project-header { display: grid; grid-template-columns: 250px 1fr 120px; gap: 1rem; padding: 1rem 1.5rem; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.05); color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; backdrop-filter: blur(8px); }
                .project-mgmt-view .admin-table-header.project-header div { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .project-mgmt-view .admin-table-row.project-row { display: grid; grid-template-columns: 250px 1fr 120px; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.2s; align-items: center; min-width: 0; }
                .project-mgmt-view .admin-table-row.project-row:hover { background: rgba(255,255,255,0.02); }
                
                .project-mgmt-view .avatar-box { width: 40px; height: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
                .project-mgmt-view .avatar-box.project { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
                
                .project-mgmt-view .entity-name { font-weight: 700; color: #f1f5f9; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
                
                .project-mgmt-view .icon-btn-danger { background: none; border: none; color: #64748b; cursor: pointer; padding: 10px; border-radius: 10px; transition: all 0.2s; }
                .project-mgmt-view .icon-btn-danger:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                .project-mgmt-view .icon-btn-ghost { background: none; border: none; color: #64748b; cursor: pointer; padding: 8px; border-radius: 8px; }
                .project-mgmt-view .icon-btn-ghost:hover { color: white; background: rgba(255,255,255,0.05); }
                
                .project-mgmt-view .member-chip { display: flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); padding: 0.25rem 0.6rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 700; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.05); white-space: nowrap; max-width: 150px; }
                .project-mgmt-view .member-chip span { overflow: hidden; text-overflow: ellipsis; }
                .project-mgmt-view .remove-icon { cursor: pointer; color: #64748b; transition: color 0.2s; }
                .project-mgmt-view .remove-icon:hover { color: #ef4444; }
                
                .project-mgmt-view .add-member-btn { background: none; border: 1px dashed #475569; color: #94a3b8; padding: 0.25rem 0.6rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; transition: all 0.2s; flex-shrink: 0; }
                .project-mgmt-view .add-member-btn:hover { background: rgba(255,255,255,0.05); color: white; border-color: #64748b; }

                .project-mgmt-view .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
                .project-mgmt-view .member-modal { width: 100%; max-width: 450px; padding: 2rem; border-radius: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); }
                .project-mgmt-view .modal-header { display: flex; justify-content: space-between; align-items: center; }
                
                .project-mgmt-view .member-list-container { max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; padding-right: 0.5rem; }
                .project-mgmt-view .member-list-container::-webkit-scrollbar { width: 5px; }
                .project-mgmt-view .member-list-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

                .project-mgmt-view .member-selection-row { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; background: rgba(255,255,255,0.02); border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.03); }
                .project-mgmt-view .mini-avatar { width: 28px; height: 28px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; }
                .project-mgmt-view .included-badge { font-size: 0.75rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 0.3rem 0.75rem; border-radius: 1rem; }
                .project-mgmt-view .compact-add-btn { padding: 0.4rem 1rem; font-size: 0.8rem; font-weight: 800; border-radius: 0.6rem; background: #3b82f6; border: none; color: white; cursor: pointer; transition: all 0.2s; }
                .project-mgmt-view .compact-add-btn:hover { background: #2563eb; transform: translateY(-1px); }
                .project-mgmt-view .compact-remove-btn { padding: 0.4rem 1rem; font-size: 0.8rem; font-weight: 800; border-radius: 0.6rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; cursor: pointer; transition: all 0.2s; }
                .project-mgmt-view .compact-remove-btn:hover { background: #ef4444; color: white; transform: translateY(-1px); }
                .project-mgmt-view .admin-badge-mini { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 0.6rem; color: #eab308; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                .project-mgmt-view .modal-close-btn { width: 100%; padding: 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 0.75rem; font-weight: 800; cursor: pointer; }

                .project-mgmt-view .mobile-admin-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
                .project-mgmt-view .member-bubbles-mobile { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.5rem; }
                .project-mgmt-view .mini-tag { background: rgba(255,255,255,0.05); padding: 0.2rem 0.5rem; border-radius: 0.4rem; font-size: 0.7rem; font-weight: 700; color: #94a3b8; }
                .project-mgmt-view .mini-tag.count { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
                .project-mgmt-view .add-member-mini { background: none; border: 1px dashed rgba(255,255,255,0.1); color: #64748b; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 0.4rem; cursor: pointer; }

                .project-mgmt-view .admin-overflow-menu { position: absolute; right: 0; top: 100%; z-index: 100; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 0.4rem; min-width: 180px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); }
                .project-mgmt-view .action-item { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border: none; background: none; color: #cbd5e1; cursor: pointer; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 700; transition: all 0.2s; }
                .project-mgmt-view .action-item:hover { background: rgba(255,255,255,0.05); color: white; }
                .project-mgmt-view .divider { height: 1px; background: rgba(255,255,255,0.05); margin: 0.4rem; }
                .project-mgmt-view .delete-action { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border: none; background: none; color: #ef4444; cursor: pointer; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 700; transition: all 0.2s; }
                .project-mgmt-view .delete-action:hover { background: rgba(239, 68, 68, 0.1); }

                @media (max-width: 768px) {
                    .project-mgmt-view .add-project-form { flex-direction: column; }
                    .project-mgmt-view .add-btn { width: 100%; justify-content: center; }
                    .project-mgmt-view .project-header { display: none; }
                    .project-mgmt-view .admin-container { background: transparent; border: none; }
                }
            `}</style>
        </div>
    );
};

export default ProjectManagement;
