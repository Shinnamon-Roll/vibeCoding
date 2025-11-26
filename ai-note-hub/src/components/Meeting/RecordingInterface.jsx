import React, { useState, useEffect } from 'react';
import { X, Mic, Square, Play, Pause } from 'lucide-react';
import { getTranscriptionService, generateMeetingSummary } from '../../services/transcription';
import './RecordingInterface.css';

function RecordingInterface({ onComplete, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const transcriptionService = getTranscriptionService();

    useEffect(() => {
        let interval;
        if (isRecording && !isPaused) {
            interval = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording, isPaused]);

    async function handleStartRecording() {
        try {
            setError('');

            if (!transcriptionService.isSupported()) {
                setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
                return;
            }

            await transcriptionService.startRecording({
                onTranscriptUpdate: (data) => {
                    setTranscript(data.transcript);
                },
                onError: (err) => {
                    setError(`Recording error: ${err}`);
                    setIsRecording(false);
                },
            });

            setIsRecording(true);
            setDuration(0);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleStopRecording() {
        setIsProcessing(true);
        const result = await transcriptionService.stopRecording();
        setIsRecording(false);

        if (result && result.transcript) {
            // Generate summary
            const summary = await generateMeetingSummary(result.transcript, {
                duration,
            });

            onComplete({
                transcript: result.transcript,
                summary: summary.summary,
                keyPoints: summary.keyPoints,
                actionItems: summary.actionItems,
                duration,
                audioUrl: result.audioUrl,
            });
        } else {
            setError('No transcript captured');
            setIsProcessing(false);
        }
    }

    function handlePauseResume() {
        if (isPaused) {
            transcriptionService.resumeRecording();
            setIsPaused(false);
        } else {
            transcriptionService.pauseRecording();
            setIsPaused(true);
        }
    }

    function formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return (
        <div className="recording-modal-overlay" onClick={onClose}>
            <div className="recording-modal glass-card" onClick={(e) => e.stopPropagation()}>
                <div className="recording-header">
                    <h3>Meeting Recorder</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="recording-body">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="recording-visualizer">
                        <div className={`recording-indicator ${isRecording && !isPaused ? 'active' : ''}`}>
                            <Mic size={48} />
                        </div>
                        <div className="recording-duration">
                            {formatDuration(duration)}
                        </div>
                    </div>

                    <div className="recording-controls">
                        {!isRecording ? (
                            <button
                                className="btn-primary record-button"
                                onClick={handleStartRecording}
                            >
                                <Mic size={20} />
                                Start Recording
                            </button>
                        ) : (
                            <>
                                <button
                                    className="btn-secondary"
                                    onClick={handlePauseResume}
                                    disabled={isProcessing}
                                >
                                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                                    {isPaused ? 'Resume' : 'Pause'}
                                </button>
                                <button
                                    className="btn-primary stop-button"
                                    onClick={handleStopRecording}
                                    disabled={isProcessing}
                                >
                                    <Square size={20} />
                                    {isProcessing ? 'Processing...' : 'Stop & Save'}
                                </button>
                            </>
                        )}
                    </div>

                    {transcript && (
                        <div className="transcript-container">
                            <h4>Transcript</h4>
                            <div className="transcript-text">
                                {transcript}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RecordingInterface;
