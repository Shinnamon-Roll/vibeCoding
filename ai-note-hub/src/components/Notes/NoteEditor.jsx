import React, { useState, useEffect } from 'react';
import { X, Save, Tag as TagIcon, Sparkles } from 'lucide-react';
import aiService from '../../services/ai';
import './NoteEditor.css';

function NoteEditor({ note, onUpdate, onClose }) {
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [tags, setTags] = useState(note.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [suggestedTags, setSuggestedTags] = useState([]);

    // Auto-save functionality
    useEffect(() => {
        const timer = setTimeout(() => {
            if (title !== note.title || content !== note.content || JSON.stringify(tags) !== JSON.stringify(note.tags)) {
                handleSave();
            }
        }, 1000); // Auto-save after 1 second of inactivity

        return () => clearTimeout(timer);
    }, [title, content, tags]);

    // Suggest tags when content changes
    useEffect(() => {
        const suggestTimer = setTimeout(async () => {
            if (content.length > 50) {
                const suggested = await aiService.suggestTags(title, content);
                setSuggestedTags(suggested.filter(tag => !tags.includes(tag)));
            }
        }, 2000);

        return () => clearTimeout(suggestTimer);
    }, [content, title, tags]);

    async function handleSave() {
        setIsSaving(true);
        await onUpdate(note.id, { title, content, tags });
        setTimeout(() => setIsSaving(false), 500);
    }

    function handleAddTag(tag) {
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setTagInput('');
            setSuggestedTags(suggestedTags.filter(t => t !== tag));
        }
    }

    function handleRemoveTag(tagToRemove) {
        setTags(tags.filter(tag => tag !== tagToRemove));
    }

    function handleTagInputKeyDown(e) {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            handleAddTag(tagInput.trim());
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            handleRemoveTag(tags[tags.length - 1]);
        }
    }

    return (
        <div className="note-editor glass-card">
            <div className="editor-header">
                <div className="editor-title-section">
                    <input
                        type="text"
                        className="editor-title-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Note title..."
                    />
                    {isSaving && (
                        <span className="saving-indicator">
                            <Save size={14} />
                            Saving...
                        </span>
                    )}
                </div>
                <button
                    className="btn-icon"
                    onClick={onClose}
                    aria-label="Close editor"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="editor-tags">
                <div className="tags-container">
                    <TagIcon size={16} className="tags-icon" />
                    {tags.map((tag, index) => (
                        <span key={index} className="tag-pill">
                            {tag}
                            <button
                                className="tag-remove"
                                onClick={() => handleRemoveTag(tag)}
                                aria-label={`Remove ${tag}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        className="tag-input"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Add tag..."
                    />
                </div>

                {suggestedTags.length > 0 && (
                    <div className="suggested-tags">
                        <Sparkles size={14} />
                        <span className="text-sm text-tertiary">Suggested:</span>
                        {suggestedTags.map((tag, index) => (
                            <button
                                key={index}
                                className="suggested-tag"
                                onClick={() => handleAddTag(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <textarea
                className="editor-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your note..."
                autoFocus
            />

            <div className="editor-footer">
                <span className="text-sm text-tertiary">
                    {content.split(/\s+/).filter(w => w.length > 0).length} words
                </span>
            </div>
        </div>
    );
}

export default NoteEditor;
