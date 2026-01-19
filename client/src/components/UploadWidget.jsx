import React, { useState, useRef } from 'react';
import api from '../utils/api';
import { UploadCloud, File, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const UploadWidget = ({ projectId, onUploadComplete }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('projectId', projectId);
        formData.append('description', description || 'Uploaded via Web');

        try {
            await api.post('/files', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUploadComplete();
            // Reset state
            setSelectedFile(null);
            setDescription('');
        } catch (error) {
            alert(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        setDescription('');
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="glass" style={{ padding: '0', borderRadius: '1rem', overflow: 'hidden' }}>
            {uploading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                     <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                     <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Encrypting & Uploading...</p>
                </div>
            ) : selectedFile ? (
                <div style={{ padding: '1.5rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.75rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: '#60a5fa' }}>
                            <File size={24} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedFile.name}</p>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description for this file..."
                            rows="3"
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem', 
                                borderRadius: '0.75rem', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                background: 'rgba(0,0,0,0.2)', 
                                color: 'white',
                                resize: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <button 
                        onClick={handleUpload}
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            background: '#3b82f6', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '0.75rem', 
                            fontSize: '1rem', 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <UploadCloud size={20} /> Upload File
                    </button>
                </div>
            ) : (
                <form 
                    onDragEnter={handleDrag} 
                    onDragOver={handleDrag} 
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current.click()}
                    style={{ 
                        padding: '3rem 2rem', 
                        textAlign: 'center', 
                        border: dragActive ? '2px dashed #3b82f6' : '2px dashed rgba(255,255,255,0.1)',
                        borderRadius: '1rem',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s'
                    }}
                >
                    <input 
                        ref={inputRef}
                        type="file" 
                        style={{ display: 'none' }} 
                        onChange={handleChange} 
                    />
                    
                    <UploadCloud size={48} style={{ color: dragActive ? '#60a5fa' : '#475569', margin: '0 auto 1rem', transition: 'color 0.2s' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Click or Drag file to upload</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Max 15MB per file</p>
                    
                    {dragActive && <div style={{ position: 'absolute', inset: 0, background: 'rgba(59, 130, 246, 0.1)', pointerEvents: 'none' }}></div>}
                </form>
            )}
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default UploadWidget;
