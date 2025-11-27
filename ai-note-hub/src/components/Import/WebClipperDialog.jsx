// Web Clipper Dialog Component
import { useState } from 'react';
import { Globe, Loader, CheckCircle, AlertCircle, X, Link as LinkIcon } from 'lucide-react';
import webClipperService from '../../services/webClipperService';
import { notesDB, activityDB } from '../../services/storage';

function WebClipperDialog({ onClose, onNoteCreated }) {
    const [mode, setMode] = useState('url'); // 'url' or 'html'
    const [url, setUrl] = useState('');
    const [html, setHtml] = useState('');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleProcess = async () => {
        try {
            setProcessing(true);
            setError(null);

            let extraction;

            if (mode === 'url') {
                // Try to fetch URL (will fail due to CORS in most cases)
                extraction = await webClipperService.fetchFromURL(url);

                if (extraction.corsError) {
                    // Provide instructions for workaround
                    setError('Direct URL fetching is blocked by CORS. Please switch to HTML mode and paste the page source.');
                    return;
                }
            } else {
                // Extract from pasted HTML
                extraction = webClipperService.extractFromHTML(html, url || null);
            }

            if (!extraction.success) {
                setError(extraction.error);
                return;
            }

            setResult(extraction);

            // Create note
            const note = await notesDB.createNote({
                title: extraction.metadata.title,
                content: `# ${extraction.metadata.title}\n\n**Source:** ${extraction.metadata.url || 'Web Clip'}\n**Author:** ${extraction.metadata.author}\n${extraction.metadata.publishDate ? `**Published:** ${extraction.metadata.publishDate}\n` : ''}\n## Summary\n\n${extraction.metadata.description}\n\n## Content\n\n${extraction.content}`,
                tags: extraction.tags,
                sourceType: 'web',
                webClipSource: {
                    url: extraction.metadata.url,
                    author: extraction.metadata.author,
                    publishDate: extraction.metadata.publishDate,
                },
            });

            await activityDB.recordActivity('notesCreated');

            if (onNoteCreated) {
                onNoteCreated(note);
            }

            setTimeout(() => onClose(), 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content web-clipper" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <Globe size={24} />
                        Web Clipper
                    </h2>
                    <button className="icon-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="mode-selector">
                        <button
                            className={`mode-button ${mode === 'url' ? 'active' : ''}`}
                            onClick={() => setMode('url')}
                        >
                            <LinkIcon size={18} />
                            URL
                        </button>
                        <button
                            className={`mode-button ${mode === 'html' ? 'active' : ''}`}
                            onClick={() => setMode(' html')}
                        >
                            <Globe size={18} />
                            Paste HTML
                        </button>
                    </div>

                    {mode === 'url' ? (
                        <div className="input-group">
                            <label>Enter URL:</label>
                            <input
                                type="url"
                                placeholder="https://example.com/article"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={processing}
                            />
                            <p className="text-small text-secondary">
                                Note: Due to CORS restrictions, direct URL fetching may not work for some sites.
                                If it fails, use "Paste HTML" mode instead.
                            </p>
                        </div>
                    ) : (
                        <div className="input-group">
                            <label>Paste HTML Source:</label>
                            <textarea
                                placeholder="Paste the HTML source of the page here..."
                                value={html}
                                onChange={(e) => setHtml(e.target.value)}
                                rows={10}
                                disabled={processing}
                            />
                            <p className="text-small text-secondary">
                                Tip: Right-click on the page → "View Page Source" → Copy & paste here
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {result && (
                        <div className="success-message">
                            <CheckCircle size={24} />
                            <div>
                                <h3>Content Clipped Successfully!</h3>
                                <p>{result.metadata.title}</p>
                                <p className="text-secondary">
                                    Tags: {result.tags.join(', ')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="button-secondary" onClick={onClose} disabled={processing}>
                        Cancel
                    </button>
                    <button
                        className="button-primary"
                        onClick={handleProcess}
                        disabled={(mode === 'url' && !url) || (mode === 'html' && !html) || processing || result}
                    >
                        {processing ? (
                            <>
                                <Loader className="spinner" size={16} />
                                Processing...
                            </>
                        ) : (
                            'Clip Content'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WebClipperDialog;
