// Transcription service using Web Speech API

export class TranscriptionService {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.transcript = '';
        this.onTranscriptUpdate = null;
        this.onError = null;
        this.mediaRecorder = null;
        this.audioChunks = [];

        // Check if browser supports Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.setupRecognition();
        }
    }

    setupRecognition() {
        if (!this.recognition) return;

        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            this.transcript += finalTranscript;

            if (this.onTranscriptUpdate) {
                this.onTranscriptUpdate({
                    transcript: this.transcript + interimTranscript,
                    isFinal: finalTranscript.length > 0,
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (this.onError) {
                this.onError(event.error);
            }
        };

        this.recognition.onend = () => {
            if (this.isRecording) {
                // Restart if still recording
                this.recognition.start();
            }
        };
    }

    async startRecording(callbacks = {}) {
        if (!this.recognition) {
            const error = 'Speech recognition not supported in this browser';
            if (callbacks.onError) {
                callbacks.onError(error);
            }
            throw new Error(error);
        }

        this.transcript = '';
        this.audioChunks = [];
        this.onTranscriptUpdate = callbacks.onTranscriptUpdate;
        this.onError = callbacks.onError;

        try {
            // Start audio recording for playback
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();

            // Start speech recognition
            this.recognition.start();
            this.isRecording = true;

            return { success: true };
        } catch (error) {
            console.error('Error starting recording:', error);
            if (this.onError) {
                this.onError(error.message);
            }
            throw error;
        }
    }

    stopRecording() {
        if (!this.isRecording) {
            return null;
        }

        this.isRecording = false;

        if (this.recognition) {
            this.recognition.stop();
        }

        return new Promise((resolve) => {
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Stop all tracks
                    if (this.mediaRecorder.stream) {
                        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
                    }

                    resolve({
                        transcript: this.transcript.trim(),
                        audioBlob,
                        audioUrl,
                        duration: this.audioChunks.length * 100, // Approximate
                    });
                };

                this.mediaRecorder.stop();
            } else {
                resolve({
                    transcript: this.transcript.trim(),
                    audioBlob: null,
                    audioUrl: null,
                    duration: 0,
                });
            }
        });
    }

    pauseRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
        }
    }

    resumeRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.start();
        }
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
        }
    }

    isSupported() {
        return !!this.recognition;
    }
}

// Singleton instance
let transcriptionService = null;

export function getTranscriptionService() {
    if (!transcriptionService) {
        transcriptionService = new TranscriptionService();
    }
    return transcriptionService;
}

// Generate auto-summary from transcript
export async function generateMeetingSummary(transcript, options = {}) {
    // Import AI service for summarization
    const { aiService } = await import('./ai.js');

    const summary = await aiService.summarize(transcript, {
        maxLength: options.maxLength || 300,
    });

    // Extract key points (simple approach)
    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
    const keyPoints = sentences
        .filter(s => s.length > 50 && s.length < 200)
        .slice(0, 5)
        .map(s => s.trim());

    // Extract action items (sentences with action words)
    const actionWords = ['should', 'will', 'need to', 'must', 'todo', 'task', 'action'];
    const actionItems = sentences
        .filter(s => actionWords.some(word => s.toLowerCase().includes(word)))
        .slice(0, 5)
        .map(s => s.trim());

    return {
        summary,
        keyPoints,
        actionItems,
        wordCount: transcript.split(/\s+/).length,
        duration: options.duration || 0,
    };
}

export default {
    TranscriptionService,
    getTranscriptionService,
    generateMeetingSummary,
};
