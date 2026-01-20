import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FolderPlus, Trash2, Folder, UserPlus, X } from 'lucide-react';
import AlertModal from '../AlertModal';
import ConfirmModal from '../ConfirmModal';

const ProjectManagement = () => {
    const [projects, setProjects] = useState([]);
    const [newProject, setNewProject] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null); // For member editing
    
    // Modals
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const [confirmState, setConfirmState] = useState({ isOpen: false, projectId: null });

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    const fetchProjects = async () => {
        const res = await api.get('/projects');
        setProjects(res.data);
    };

    const fetchUsers = async () => {
        const res = await api.get('/users');
        setUsers(res.data);
    };

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
            setAlertState({ isOpen: true, title: 'Success', message: 'Project deleted', type: 'success' });
        } catch (error) {
             setAlertState({ isOpen: true, title: 'Error', message: 'Failed to delete project', type: 'error' });
        } finally {
            setConfirmState({ isOpen: false, projectId: null });
        }
    };

    const handleAddMember = async (projectId, userId) => {
        try {
            await api.put(`/projects/${projectId}/members`, { userId });
            fetchProjects(); 
            if(selectedProject && selectedProject._id === projectId) {
                const p = (await api.get('/projects')).data.find(p => p._id === projectId);
                setSelectedProject(p);
            }
            // Optional: Success modal could be annoying here if adding many users
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to add member', type: 'error' });
        }
    };

    const handleRemoveMember = async (projectId, userId) => {
        try {
            await api.delete(`/projects/${projectId}/members/${userId}`);
             fetchProjects();
              if(selectedProject && selectedProject._id === projectId) {
                const p = (await api.get('/projects')).data.find(p => p._id === projectId);
                setSelectedProject(p);
            }
        } catch (error) {
             setAlertState({ isOpen: true, title: 'Error', message: 'Failed to remove member', type: 'error' });
        }
    }

    return (
        <div>
           <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Project Management</h3>

           <form onSubmit={handleAddProject} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <input 
                    type="text" 
                    value={newProject} 
                    onChange={(e) => setNewProject(e.target.value)} 
                    placeholder="New Project Name" 
                    className="input-field" 
                    style={{ marginBottom: 0, width: '300px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderPlus size={18} /> Create Project
                </button>
            </form>

            <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                            <th style={{ padding: '1rem' }}>Project Name</th>
                            <th style={{ padding: '1rem' }}>Members</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => (
                            <tr key={project._id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Folder size={18} className="text-blue-400" /> {project.name}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                                        {project.members && project.members.map(m => (
                                            <span key={m._id} style={{ fontSize: '0.75rem', background: '#334155', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                                                {m.userId} {m.role === 'admin' && <span style={{ color: '#fbbf24' }}>🛡️</span>}
                                                {m.role !== 'admin' && (
                                                    <X size={12} style={{cursor: 'pointer'}} onClick={() => handleRemoveMember(project._id, m._id)} />
                                                )}
                                            </span>
                                        ))}
                                         <button onClick={() => setSelectedProject(project)} style={{ background: 'transparent', border: '1px dashed #475569', color: '#94a3b8', borderRadius: '0.25rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>+ Add</button>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                     <button onClick={() => handleDeleteClick(project._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                                            <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedProject && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setSelectedProject(null)}>
                    <div className="glass" style={{ padding: '2rem', width: '400px', borderRadius: '1rem' }} onClick={e => e.stopPropagation()}>
                        <h4 style={{ marginBottom: '1rem' }}>Add User to {selectedProject.name}</h4>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {users.map(u => (
                                <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #334155' }}>
                                    <span>{u.userId}</span>
                                    {selectedProject.members.some(m => m._id === u._id) ? (
                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Added</span>
                                    ) : (
                                        <button onClick={() => handleAddMember(selectedProject._id, u._id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Add</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setSelectedProject(null)} style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', background: 'transparent', border: '1px solid #475569', color: 'white', borderRadius: '0.5rem', cursor: 'pointer' }}>Close</button>
                    </div>
                </div>
            )}

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
                message="Are you sure you want to delete this project? This will remove all files and cannot be undone."
                confirmText="Delete Project"
                isDanger={true}
            />
        </div>
    );
};

export default ProjectManagement;
