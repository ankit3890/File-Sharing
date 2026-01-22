import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
    const navigate = useNavigate();
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/login');
        }
    };

    return (
        <div style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto', color: '#cbd5e1' }}>
            <button 
                onClick={handleBack} 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: 'none', 
                    border: 'none', 
                    color: '#64748b', 
                    cursor: 'pointer',
                    marginBottom: '2.5rem',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                }}
                className="hover:text-slate-300"
            >
                <ArrowLeft size={18} /> Back
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Terms & Conditions</h1>
                <p style={{ marginBottom: '2rem', fontStyle: 'italic', color: '#94a3b8', opacity: 0.8 }}>Last Updated: {currentDate}</p>

                <div className="glass terms-content" style={{ borderRadius: '1.5rem', lineHeight: '1.7', background: 'rgba(15, 23, 42, 0.6)' }}>
                    <p style={{ marginBottom: '2rem' }}>
                        By accessing or using this application ("Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, you must not use the Platform.
                    </p>

                    <Section title="1. Access & Eligibility">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>This Platform is <strong>private and invitation-only</strong></li>
                            <li>Accounts are created <strong>only by the Admin</strong></li>
                            <li>No public registration is allowed</li>
                            <li>Users must use the credentials provided by the Admin</li>
                        </ul>
                    </Section>

                    <Section title="2. Account Security">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>A default password is issued by the Admin and <strong>must be changed on first login</strong></li>
                            <li>Users are responsible for maintaining the confidentiality of their credentials</li>
                            <li>All actions performed using a user account are considered the responsibility of that user</li>
                        </ul>
                    </Section>

                    <Section title="3. User Roles & Permissions">
                        <div className="mb-2"><strong>Admin</strong> has full control over:</div>
                        <ul className="list-disc pl-5 space-y-3 mb-4">
                            <li>Users, Projects, Files</li>
                            <li>Storage limits</li>
                            <li>Logs and monitoring</li>
                        </ul>
                        <div className="mb-2"><strong>Users</strong>:</div>
                        <ul className="list-disc pl-5 space-y-3">
                            <li>Can access only assigned projects</li>
                            <li>Cannot join or leave projects on their own</li>
                            <li>Cannot access admin-only features</li>
                        </ul>
                    </Section>

                    <Section title="4. File Upload & Storage Limits">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>Maximum file size per upload: <strong>15 MB</strong></li>
                            <li>Maximum storage per user: <strong>100 MB</strong></li>
                            <li>Uploads exceeding the storage limit will be blocked</li>
                            <li>Users must delete existing files to free space before uploading new files</li>
                        </ul>
                    </Section>

                    <Section title="5. File Ownership & Responsibility">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>Users remain responsible for the content they upload</li>
                            <li>The Platform does <strong>not claim ownership</strong> of uploaded files</li>
                            <li>Users must ensure files:
                                <ul className="list-circle pl-5 mt-1 space-y-1">
                                    <li>Do not violate laws or regulations</li>
                                    <li>Do not contain malicious software</li>
                                    <li>Do not infringe intellectual property rights</li>
                                </ul>
                            </li>
                        </ul>
                    </Section>

                    <Section title="6. File Access, Preview & Download">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>Files are accessible <strong>only to members of the same project</strong></li>
                            <li>Admin can access all files</li>
                            <li>All downloads require authentication and authorization</li>
                            <li>Public or external file sharing is not allowed</li>
                            <li>File preview is available only for supported formats</li>
                        </ul>
                    </Section>

                    <Section title="7. File Actions & Admin Rights">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>Users may edit metadata and delete their own files</li>
                            <li>Admin may delete any file at any time</li>
                            <li>Admin actions may be displayed as <strong>"Deleted by Admin"</strong></li>
                            <li>Deleted files may not be recoverable</li>
                        </ul>
                    </Section>

                    <Section title="8. Logging & Monitoring">
                        <div className="mb-2">All system activities are logged, including:</div>
                        <ul className="list-disc pl-5 space-y-3 mb-4">
                            <li>Login and logout</li>
                            <li>File upload, preview, download, edit, and delete actions</li>
                            <li>Admin and project-related actions</li>
                        </ul>
                        <ul className="list-disc pl-5 space-y-3">
                            <li>Logs are <strong>read-only</strong>, permanent, and cannot be altered or deleted</li>
                            <li>Logs are used strictly for security, auditing, and accountability</li>
                        </ul>
                    </Section>

                    <Section title="9. Data Security">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>Files are encrypted at rest</li>
                            <li>Secure authentication methods are used</li>
                            <li>While security best practices are followed, absolute data security cannot be guaranteed</li>
                        </ul>
                    </Section>

                    <Section title="10. Prohibited Activities">
                        <p className="mb-2">Users must not:</p>
                        <ul className="list-disc pl-5 space-y-3 mb-4">
                            <li>Upload illegal, harmful, or malicious files</li>
                            <li>Attempt unauthorized system access</li>
                            <li>Share login credentials</li>
                            <li>Tamper with system logs</li>
                            <li>Abuse admin privileges</li>
                        </ul>
                        <p className="text-red-400 font-bold">Violation may result in account suspension or permanent removal.</p>
                    </Section>

                    <Section title="11. Account Suspension & Termination">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>The Admin reserves the right to:
                                <ul className="list-circle pl-5 mt-1 space-y-1">
                                    <li>Suspend or delete any account</li>
                                    <li>Remove access without prior notice</li>
                                </ul>
                            </li>
                            <li>Upon account deletion, user data and files may be permanently removed</li>
                        </ul>
                    </Section>

                    <Section title="12. Service Availability">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>The Platform is provided <strong>"as is"</strong></li>
                            <li>No guarantee of uninterrupted service</li>
                            <li>Maintenance or updates may cause temporary downtime</li>
                        </ul>
                    </Section>

                    <Section title="13. Limitation of Liability">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>The Platform is not responsible for:
                                <ul className="list-circle pl-5 mt-1 space-y-1">
                                    <li>Data loss due to user actions</li>
                                    <li>Admin-initiated deletions</li>
                                    <li>Unauthorized access caused by credential misuse</li>
                                </ul>
                            </li>
                        </ul>
                    </Section>

                    <Section title="14. Transparency & Open-Source Disclosure">
                        <p className="mb-4">This Platform is developed as an <strong>open-source project</strong>.</p>
                        <div className="mb-4">
                            <strong>Source Code Repository:</strong><br/>
                            <a href="https://github.com/ankit3890/File-Sharing" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>https://github.com/ankit3890/File-Sharing</a>
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                            <strong>Developed by:</strong><br/>
                            Ankit Kumar Singh<br/>
                            Deepak Kumar Singh
                        </div>
                        <p className="mt-4 text-sm text-slate-400">The source code is publicly available for transparency, learning, and review purposes.</p>
                    </Section>

                    <Section title="15. Changes to Terms">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>These Terms & Conditions may be updated at any time</li>
                            <li>Continued use of the Platform implies acceptance of updated terms</li>
                        </ul>
                    </Section>

                    <Section title="16. Contact & Support">
                        <p>For any questions or issues, please contact the <strong>Platform Admin</strong>.</p>
                    </Section>

                </div>
            </motion.div>
            
            <style>{`
                .terms-content {
                    padding: 2.5rem;
                }
                @media (max-width: 768px) {
                    .terms-content {
                        padding: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>{title}</h2>
        <div style={{ color: '#cbd5e1' }}>{children}</div>
    </div>
);

export default Terms;
