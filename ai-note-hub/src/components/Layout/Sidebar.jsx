import React from 'react';
import {
    Home, Star, Archive, Tag, Trash2, Plus,
    FileText, Clock, Settings as SettingsIcon
} from 'lucide-react';
import './Sidebar.css';

function Sidebar({ selectedView, onViewChange, notes, onCreateNote }) {
    const noteCount = notes.filter(n => !n.archived).length;
    const favoriteCount = notes.filter(n => n.favorite).length;
    const archivedCount = notes.filter(n => n.archived).length;

    const menuItems = [
        { id: 'all', icon: Home, label: 'All Notes', count: noteCount },
        { id: 'favorites', icon: Star, label: 'Favorites', count: favoriteCount },
        { id: 'recent', icon: Clock, label: 'Recent', count: null },
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
