import React, { useState } from 'react';
import {
    Home, Star, Archive, Tag, Trash2, Plus,
    FileText, Clock, Settings as SettingsIcon,
    CheckSquare, Sparkles, Upload, Image, Globe, ChevronDown, ChevronRight
} from 'lucide-react';
import './Sidebar.css';

function Sidebar({ selectedView, onViewChange, notes, onCreateNote, onImportPDF, onImportImage, onImportWeb }) {
    const [showImportMenu, setShowImportMenu] = useState(false);

    const noteCount = notes.filter(n => !n.archived).length;
    const favoriteCount = notes.filter(n => n.favorite).length;
    const archivedCount = notes.filter(n => n.archived).length;

    const menuItems = [
        { id: 'all', icon: Home, label: 'All Notes', count: noteCount },
        { id: 'favorites', icon: Star, label: 'Favorites', count: favoriteCount },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks', count: null },
        { id: 'digest', icon: Sparkles, label: 'Daily Digest', count: null },
        { id: 'archived', icon: Archive, label: 'Archived', count: archivedCount },
    ];

    return (
        <div className="sidebar glass-card">
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        <FileText size={24} />
                    </div>
                    <h2 className="logo-text">AI Notes</h2>
                </div>

                <button
                    className="btn-primary create-note-btn"
                    onClick={onCreateNote}
                >
                    <Plus size={18} />
                    New Note
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${selectedView === item.id ? 'active' : ''}`}
                        onClick={() => onViewChange(item.id)}
                    >
                        <item.icon size={20} />
                        <span className="nav-label">{item.label}</span>
                        {item.count !== null && item.count > 0 && (
                            <span className="nav-count">{item.count}</span>
                        )}
                    </button>
                ))}

                <div className="nav-divider"></div>

                <div className="import-section">
                    <button
                        className="nav-item import-toggle"
                        onClick={() => setShowImportMenu(!showImportMenu)}
                    >
                        <Upload size={20} />
                        <span className="nav-label">Import</span>
                        {showImportMenu ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {showImportMenu && (
                        <div className="import-menu">
                            <button className="nav-item sub-item" onClick={onImportPDF}>
                                <FileText size={18} />
                                <span className="nav-label">PDF Document</span>
                            </button>
                            <button className="nav-item sub-item" onClick={onImportImage}>
                                <Image size={18} />
                                <span className="nav-label">Image / OCR</span>
                            </button>
                            <button className="nav-item sub-item" onClick={onImportWeb}>
                                <Globe size={18} />
                                <span className="nav-label">Web Clip</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item">
                    <SettingsIcon size={20} />
                    <span className="nav-label">Settings</span>
                </button>

                <div className="footer-info">
                    <p className="text-sm text-tertiary">
                        {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
