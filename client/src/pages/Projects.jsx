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

    const ProjectSkeleton = () => (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', width: '48px', height: '48px' }} />
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton-line" style={{ width: '60%', height: '18px' }} />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div className="skeleton-line" style={{ width: '30%', height: '12px' }} />
                <div className="skeleton-line" style={{ width: '20%', height: '12px' }} />
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>My Projects</h2>
                {!loading && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.75rem', borderRadius: '1rem' }}>
                        {projects.length} TOTAL PROJECTS
                    </span>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)}
                </div>
            ) : projects.length === 0 ? (
                <div
                    className="glass"
                    style={{
                        padding: '4rem 2rem',
                        borderRadius: '1rem',
                        textAlign: 'center',
                        color: '#475569',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <Folder size={48} strokeWidth={1} style={{ opacity: 0.2 }} />
                    <p>No projects assigned to your account yet.</p>
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
