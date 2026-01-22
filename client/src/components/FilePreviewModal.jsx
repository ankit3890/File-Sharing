import React, { useState, useEffect, useRef, Suspense } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../utils/api';
import AlertModal from './AlertModal';

// Lazy load syntax highlighter for performance
const SyntaxHighlighter = React.lazy(() => import('react-syntax-highlighter/dist/esm/prism'));

const FilePreviewModal = ({ file, onClose }) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    
    // Refs for cleanup and control
    const previewUrlRef = useRef(null);
    const abortRef = useRef(null);

    // Language detection helper
    const getLanguage = (name) => {
        if (!name) return 'text';
        const ext = name.split('.').pop().toLowerCase();
        const map = {
            js: 'javascript',
            jsx: 'jsx',
            ts: 'typescript',
            tsx: 'tsx',
            py: 'python',
            json: 'json',
            css: 'css',
            html: 'html',
            md: 'markdown',
            txt: 'text',
            xml: 'xml',
            sql: 'sql',
            java: 'java',
            c: 'c',
            cpp: 'cpp',
            go: 'go',
            rs: 'rust',
            php: 'php',
            rb: 'ruby',
            sh: 'bash',
            yaml: 'yaml',
            yml: 'yaml'
        };
        return map[ext] || 'text';
    };

    useEffect(() => {
        if (file) {
            // Reset states
            setContent(null);
            setLoading(true);
            
            // Cleanup previous URL
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
                setPreviewUrl(null);
            }

            fetchPreview();
        }

        // Lock body scroll
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = '';
            // URL cleanup on unmount
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }
            // Abort pending request
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, [file]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const fetchPreview = async () => {
        // Abort previous request
        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        try {
            const type = file.mimetype;
            const isImage = type.startsWith('image/');
            const isVideo = type.startsWith('video/');
            const isPdf = type === 'application/pdf';
            const isText = type.startsWith('text/') || type === 'application/json' || type === 'text/javascript' || 
                           type === 'application/xml' || file.originalName.match(/\.(js|jsx|ts|tsx|py|css|html|md|json|xml|sql|yaml|yml|sh)$/i);

            if (isImage || isVideo || isPdf) {
                const res = await api.get(`/files/${file._id}/preview`, { 
                    responseType: 'blob',
                    signal: abortRef.current.signal 
                });
                const url = URL.createObjectURL(res.data);
                previewUrlRef.current = url;
                setPreviewUrl(url);
                setLoading(false);
            } else if (isText) {
                // Size check for text files
                if (file.size > 5 * 1024 * 1024) {
                    setContent("File is too large to preview directly. Please download it to view content.");
                    setLoading(false);
                    return;
                }

                const res = await api.get(`/files/${file._id}/preview`, { 
                    responseType: 'text',
                    signal: abortRef.current.signal
                });
                setContent(res.data);
                setLoading(false);
            } else {
                setLoading(false); // unsupported
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.message === 'canceled') {
                return;
            }
            console.error("Preview failed", error);
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const resToken = await api.get(`/files/${file._id}/download_token`);
            const token = resToken.data.token;
            window.location.href = `/api/files/download/${token}`;
        } catch (error) {
            setAlertState({
                isOpen: true,
                title: 'Download Failed',
                message: 'Failed to initiate download.',
                type: 'error'
            });
        }
    };

    if (!file) return null;

    const renderContent = () => {
        if (loading) {
            return (
                <div style={{ width: '100%', height: '70vh', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', overflow: 'hidden', position: 'relative' }}>
                    <div className="skeleton-preview" style={{ 
                        width: '100%', 
                        height: '100%', 
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite' 
                    }} />
                    <style>{`
                        @keyframes shimmer {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}</style>
                </div>
            );
        }

        const type = file.mimetype;
        
        if (type.startsWith('image/')) {
            return <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '0.5rem' }} />;
        }
        if (type.startsWith('video/')) {
            return <video controls src={previewUrl} style={{ maxWidth: '100%', maxHeight: '80vh' }} />;
        }
        if (type === 'application/pdf') {
            return (
                <div style={{ width: '100%', height: '80vh', background: 'white', borderRadius: '0.5rem' }}>
                    <object
                        data={previewUrl}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                    >
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#0f172a' }}>
                            <p>Unable to display PDF directly.</p>
                            <button onClick={handleDownload} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                Download PDF
                            </button>
                        </div>
                    </object>
                </div>
            );
        }
        
        // Text/Code Fallback based on content presence
        if (content !== null) {
             return (
                 <div style={{ height: '80vh', overflowY: 'auto', width: '100%', background: '#1e1e1e', borderRadius: '0.5rem', padding: '1rem' }}>
                     <Suspense fallback={<div style={{ color: '#64748b' }}>Rendering code...</div>}>
                        <SyntaxHighlighter 
                            language={getLanguage(file.originalName)} 
                            style={vscDarkPlus}
                            customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
                            showLineNumbers={true}
                        >
                            {content}
                        </SyntaxHighlighter>
                     </Suspense>
                 </div>
             );
        }

        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <FileText size={64} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                <p>Preview not available for this file type.</p>
                <button onClick={handleDownload} className="btn btn-primary" style={{ marginTop: '1rem' }}>Download to View</button>
            </div>
        );
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' }}>
                 <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{file.originalName}</h2>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                     <button onClick={handleDownload} className="btn" style={{ background: '#334155', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                         <Download size={18} /> Download
                     </button>
                     <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                         <X size={24} />
                     </button>
                 </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflow: 'hidden' }}>
                {renderContent()}
            </div>
            
            <AlertModal 
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </div>
    );
};

export default FilePreviewModal;
