import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Folder } from 'lucide-react';

const Projects = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects');
                setProjects(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchProjects();
    }, []);

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>My Projects</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {projects.map(project => (
                    <Link key={project._id} to={`/projects/${project._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', transition: 'transform 0.2s', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem' }}>
                                    <Folder className="text-blue-500" size={24} />
                                </div>
                                <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{project.name}</h3>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                                <span>{project.members?.length || 0} Members</span>
                                <span>Active</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Projects;
