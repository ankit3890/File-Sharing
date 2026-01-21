import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Folder } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects');

                // Defensive: support multiple backend shapes
                const projectList =
                    res.data?.projects ||
                    res.data ||
                    [];

                setProjects(Array.isArray(projectList) ? projectList : []);
            } catch (error) {
                console.error('Failed to load projects', error);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) {
        return <SkeletonLoader />;
    }

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
                My Projects
            </h2>

            {projects.length === 0 ? (
                <div
                    className="glass"
                    style={{
                        padding: '2rem',
                        borderRadius: '1rem',
                        textAlign: 'center',
                        color: '#94a3b8'
                    }}
                >
                    No projects assigned yet
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '1.5rem'
                    }}
                >
                    {projects.map(project => (
                        <Link
                            key={project._id}
                            to={`/projects/${project._id}`}
                            style={{
                                textDecoration: 'none',
                                color: 'inherit'
                            }}
                        >
                            <div
                                className="glass"
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: '1rem',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        marginBottom: '1rem'
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '0.75rem',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            borderRadius: '0.5rem'
                                        }}
                                    >
                                        <Folder size={24} color="#3b82f6" />
                                    </div>
                                    <h3
                                        style={{
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        {project.name}
                                    </h3>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.8rem',
                                        color: '#94a3b8'
                                    }}
                                >
                                    <span>
                                        {project.members?.length || 0} Members
                                    </span>
                                    <span>Active</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Projects;
