// PDF Uploader Component
import { useState, useRef } from 'react';
import { Upload, FileText, Loader, CheckCircle, AlertCircle, X } from 'lucide-react';
import pdfService from '../../services/pdfService';
import aiService from '../../services/ai';
import { notesDB, activityDB } from '../../services/storage';

function PDFUploader({ onClose, onNoteCreated }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            setError(null);
            setResult(null);
        } else {
            setError('Please drop a valid PDF file');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleProcess = async () => {
        if (!file) return;

        try {
            setProcessing(true);
            setError(null);

            // Extract text from PDF
            const extraction = await pdfService.extractFromPDF(file);

            if (!extraction.success) {
                setError(extraction.error);
                return;
            }

            setResult(extraction);

            // Generate summary
            const summary = await aiService.summarize(extraction.text, { maxLength: 300 });

            // Create note
            const note = await notesDB.createNote({
                title: extraction.metadata.title,
                content: `# ${extraction.metadata.title}\n\n**Source:** PDF (${extraction.pageCount} pages)\n**Author:** ${extraction.metadata.author}\n\n## Summary\n\n${summary}\n\n## Full Content\n\n${extraction.text}`,
                tags: ['pdf', 'imported'],
                sourceType: 'pdf',
                pdfData: {
                    fileName: extraction.fileName,
                    pageCount: extraction.pageCount,
                    author: extraction.metadata.author,
                },
            });

            // Record activity
            await activityDB.recordActivity('notesCreated');

            if (onNoteCreated) {
                onNoteCreated(note);
            }

            // Close after brief delay
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pdf-uploader" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <FileText size={24} />
                        Import PDF
                    </h2>
                    <button className="icon-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {!file && (
                        <div
                            className="upload-zone"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={48} />
                            <p>Drag & drop a PDF file here</p>
                            <p className="text-secondary">or click to browse</p>
                            <p className="text-small">Maximum size: 50MB</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}

                    {file && !result && (
                        <div className="file-info">
                            <FileText size={32} />
                            <div>
                                <h3>{file.name}</h3>
                                <p className="text-secondary">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                className="button-secondary"
                                onClick={() => setFile(null)}
                                disabled={processing}
                            >
                                Remove
                            </button>
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
                                <h3>PDF Processed Successfully!</h3>
                                <p>{result.pageCount} pages • {result.metadata.author}</p>
                                <p className="text-secondary">Note created with full text and AI summary</p>
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
                        disabled={!file || processing || result}
                    >
                        {processing ? (
                            <>
                                <Loader className="spinner" size={16} />
                                Processing...
                            </>
                        ) : (
                            'Import PDF'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PDFUploader;
