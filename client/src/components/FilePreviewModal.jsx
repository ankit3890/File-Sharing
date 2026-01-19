import React, { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../utils/api';

const FilePreviewModal = ({ file, onClose }) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (file) {
            fetchPreview();
        }
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [file]);

    const fetchPreview = async () => {
        try {
            // Check if previewable
            const type = file.mimetype;
            const isImage = type.startsWith('image/');
            const isVideo = type.startsWith('video/');
            const isPdf = type === 'application/pdf';
            const isText = type.startsWith('text/') || type === 'application/json' || type === 'text/javascript'; // etc

            if (isImage || isVideo || isPdf) {
                 // For binary streams, we rely on browser handling via blob
                 // We need a token? Actually, api.get handles Authorization header.
                 // But for <img src> we need a token in URL or blob check.
                 // Let's use blob fetch.
                 const res = await api.get(`/files/${file._id}/preview`, { responseType: 'blob' });
                 const url = URL.createObjectURL(res.data);
                 setPreviewUrl(url);
                 setLoading(false);
            } else if (isText) {
                const res = await api.get(`/files/${file._id}/preview`, { responseType: 'text' });
                setContent(res.data);
                setLoading(false);
            } else {
                setLoading(false); // Not supported
            }
        } catch (error) {
            console.error("Preview failed", error);
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            // Get token
            const resToken = await api.get(`/files/${file._id}/download_token`);
            const token = resToken.data.token;
            // Trigger download via window
            window.location.href = `http://localhost:5000/api/files/download/${token}`;
        } catch (error) {
            alert('Download failed');
        }
    };

    if (!file) return null;

    const renderContent = () => {
        if (loading) return <div>Loading preview...</div>;

        const type = file.mimetype;
        
        if (type.startsWith('image/')) {
            return <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '70vh' }} />;
        }
        if (type.startsWith('video/')) {
            return <video controls src={previewUrl} style={{ maxWidth: '100%', maxHeight: '70vh' }} />;
        }
        if (type === 'application/pdf') {
            return <iframe src={previewUrl} style={{ width: '100%', height: '70vh', border: 'none' }} title="pdf-preview" />;
        }
        // Basic Text/Code detection
        if (type.startsWith('text/') || ['application/json', 'application/javascript'].includes(type) || file.originalName.match(/\.(js|jsx|ts|tsx|py|css|html|md|json)$/)) {
             return (
                 <div style={{ maxHeight: '70vh', overflowY: 'auto', width: '100%' }}>
                     <SyntaxHighlighter language={file.originalName.split('.').pop()} style={vscDarkPlus}>
                        {content || ''}
                     </SyntaxHighlighter>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' }}>
                 <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{file.originalName}</h2>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                     <button onClick={handleDownload} className="btn" style={{ background: '#334155', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
        </div>
    );
};

export default FilePreviewModal;
