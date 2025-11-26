import React from 'react';
import { Star, Trash2, Calendar, Tag as TagIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './NoteList.css';

function NoteList({
    notes,
    currentNote,
    onSelectNote,
    onDeleteNote,
    onToggleFavorite,
    viewType
}) {
    if (notes.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No notes yet</h3>
                <p className="text-secondary">
                    {viewType === 'search'
                        ? 'No notes match your search query'
                        : 'Create your first note to get started'}
                </p>
            </div>
        );
    }

    return (
        <div className="note-list">
            {notes.map(note => (
                <NoteCard
                    key={note.id}
                    note={note}
                    isActive={currentNote?.id === note.id}
                    onSelect={() => onSelectNote(note)}
                    onDelete={() => onDeleteNote(note.id)}
                    onToggleFavorite={() => onToggleFavorite(note.id)}
                />
            ))}
        </div>
    );
}

function NoteCard({ note, isActive, onSelect, onDelete, onToggleFavorite }) {
    const preview = note.content.slice(0, 150);
    const hasContent = note.content.length > 0;

    return (
        <div
            className={`note-card glass-card ${isActive ? 'active' : ''}`}
            onClick={onSelect}
        >
            <div className="note-card-header">
                <h3 className="note-title">{note.title}</h3>
                <div className="note-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                        className={`btn-icon-small ${note.favorite ? 'favorite-active' : ''}`}
                        onClick={onToggleFavorite}
                        aria-label="Toggle favorite"
                    >
                        <Star size={16} fill={note.favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        className="btn-icon-small"
                        onClick={onDelete}
                        aria-label="Delete note"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {hasContent && (
                <p className="note-preview">{preview}{note.content.length > 150 ? '...' : ''}</p>
            )}

            <div className="note-card-footer">
                <div className="note-meta">
                    <Calendar size={14} />
                    <span className="text-sm text-tertiary">
                        {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
                    </span>
                </div>

                {note.tags && note.tags.length > 0 && (
                    <div className="note-tags">
                        {note.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="badge badge-primary">
                                <TagIcon size={10} />
                                {tag}
                            </span>
                        ))}
                        {note.tags.length > 2 && (
                            <span className="badge">+{note.tags.length - 2}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NoteList;
