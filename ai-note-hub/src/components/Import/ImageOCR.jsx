// Image OCR Component
import { useState, useRef } from 'react';
import { Image as ImageIcon, Loader, CheckCircle, AlertCircle, X } from 'lucide-react';
import ocrService from '../../services/ocrService';
import aiService from '../../services/ai';
import { notesDB, activityDB } from '../../services/storage';

function ImageOCR({ onClose, onNoteCreated }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState('eng');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
            setResult(null);
        }
    };

    const handleProcess = async () => {
        if (!file) return;

        try {
            setProcessing(true);
            setError(null);
            setProgress(0);

            const extraction = await ocrService.extractTextFromImage(
                file,
                language,
                (prog) => setProgress(prog)
            );

            if (!extraction.success) {
                setError(extraction.error);
                return;
            }

            setResult(extraction);

            // Generate AI explanation/summary
            const explanation = await aiService.summarize(extraction.text);

            // Create note
            const note = await notesDB.createNote({
                title: `OCR: ${file.name}`,
                content: `# ${file.name}\n\n**Source:** Image OCR\n**Confidence:** ${Math.round(extraction.confidence)}%\n\n## AI Summary\n\n${explanation}\n\n## Extracted Text\n\n${extraction.text}`,
                tags: ['ocr', 'image', 'imported'],
                sourceType: 'image',
                imageData: {
                    fileName: file.name,
                    confidence: extraction.confidence,
                    lineCount: extraction.lineCount,
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
            <div className="modal-content image-ocr" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <ImageIcon size={24} />
                        Extract Text from Image
                    </h2>
                    <button className="icon-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {!file && (
                        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon size={48} />
                            <p>Select an image file</p>
                            <p className="text-secondary">PNG, JPG, WebP supported</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}

                    {preview && (
                        <div className="image-preview">
                            <img src={preview} alt="Preview" />
                        </div>
                    )}

                    {file && !result && (
                        <div className="ocr-settings">
                            <label>
                                OCR Language:
                                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                    {ocrService.getSupportedLanguages().map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}

                    {processing && (
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <p>Processing... {progress}%</p>
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
                                <h3>Text Extracted Successfully!</h3>
                                <p>Confidence: {Math.round(result.confidence)}%</p>
                                <p className="text-secondary">{result.wordCount} words extracted</p>
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
                            'Extract Text'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImageOCR;
