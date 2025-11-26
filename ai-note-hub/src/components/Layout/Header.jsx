import React from 'react';
import { Search, MessageSquare, Mic, Grid, List, Settings } from 'lucide-react';
import './Header.css';

function Header({
    onSearch,
    searchQuery,
    onToggleAssistant,
    onToggleRecording,
    showAssistant,
    showRecording
}) {
    return (
        <header className="header">
            <div className="search-container">
                <div className="search-input-wrapper">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search notes with AI semantic search..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="header-actions">
                <button
                    className={`btn-icon ${showRecording ? 'active' : ''}`}
                    onClick={onToggleRecording}
                    data-tooltip="Record Meeting"
                >
                    <Mic size={20} />
                </button>

                <button
                    className={`btn-icon ${showAssistant ? 'active' : ''}`}
                    onClick={onToggleAssistant}
                    data-tooltip="AI Assistant"
                >
                    <MessageSquare size={20} />
                </button>
            </div>
        </header>
    );
}

export default Header;
