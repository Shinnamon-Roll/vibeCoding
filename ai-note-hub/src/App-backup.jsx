import { useState, useEffect } from 'react';
import { Search, Plus, Menu, Moon, Sun, Settings, MessageSquare, Mic, FileText, Image, Globe, CheckSquare, Sparkles } from 'lucide-react';
import './styles/index.css';
import './styles/extended.css';
import './App.css';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import NoteList from './components/Notes/NoteList';
import NoteEditor from './components/Notes/NoteEditor';
import SearchInterface from './components/Search/SearchInterface';
import AssistantChat from './components/AI/AssistantChat';
import RecordingInterface from './components/Meeting/RecordingInterface';
import PDFUploader from './components/Import/PDFUploader';
import ImageOCR from './components/Import/ImageOCR';
import WebClipperDialog from './components/Import/WebClipperDialog';
import TaskList from './components/Tasks/TaskList';
import DailyDigest from './components/Dashboard/DailyDigest';
import { notesDB, activityDB } from './services/storage';
import aiService from './services/ai';
import taskExtractor from './services/taskExtractor';

function App() {
    const [notes, setNotes] = useState([]);
    const [currentNote, setCurrentNote] = useState(null);
    const [selectedView, setSelectedView] = useState('all'); // all, favorites, archived, search, tasks, digest
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showAssistant, setShowAssistant] = useState(false);
    const [showRecording, setShowRecording] = useState(false);
    const [showPDFUploader, setShowPDFUploader] = useState(false);
    const [showImageOCR, setShowImageOCR] = useState(false);
    const [showWebClipper, setShowWebClipper] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [loading, setLoading] = useState(true);

    // Load notes on mount
    useEffect(() => {
        loadNotes();
    }, []);

    async function loadNotes() {
        try {
            setLoading(true);
            const allNotes = await notesDB.getAllNotes();
            setNotes(allNotes);

            // Generate embeddings for notes that don't have them
            for (const note of allNotes) {
                if (!note.embedding) {
                    const embedding = await aiService.generateEmbedding(
                        `${note.title} ${note.content}`
                    );
                    await notesDB.updateEmbedding(note.id, embedding);
                }
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateNote() {
        const newNote = await notesDB.createNote({
            title: 'Untitled Note',
            content: '',
        });
        await activityDB.recordActivity('notesCreated');
        setNotes([newNote, ...notes]);
        setCurrentNote(newNote);
        setSelectedView('all');
    }

    async function handleUpdateNote(id, updates) {
        const updatedNote = await notesDB.updateNote(id, updates);
        await activityDB.recordActivity('notesUpdated');
        setNotes(notes.map(n => n.id === id ? updatedNote : n));
        setCurrentNote(updatedNote);

        // Update embedding if content changed
        if (updates.content || updates.title) {
            const embedding = await aiService.generateEmbedding(
                `${updatedNote.title} ${updatedNote.content}`
            );
            await notesDB.updateEmbedding(id, embedding);

            // Extract tasks from note content
            const tasks = taskExtractor.extractTasks(updatedNote.content, id);
            // Note: In a full implementation, we'd also save these tasks to the DB
        }
    }

    async function handleDeleteNote(id) {
        await notesDB.deleteNote(id);
        setNotes(notes.filter(n => n.id !== id));
        if (currentNote?.id === id) {
            setCurrentNote(null);
        }
    }

    async function handleToggleFavorite(id) {
        const updatedNote = await notesDB.toggleFavorite(id);
        setNotes(notes.map(n => n.id === id ? updatedNote : n));
        if (currentNote?.id === id) {
            setCurrentNote(updatedNote);
        }
    }

    async function handleSearch(query) {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            setSelectedView('all');
            return;
        }

        // Perform semantic search
        const results = await aiService.semanticSearch(query, notes);
        setSearchResults(results);
        setSelectedView('search');
    }

    function getDisplayedNotes() {
        if (selectedView === 'search') {
            return searchResults;
        }
        if (selectedView === 'favorites') {
            return notes.filter(n => n.favorite);
        }
        if (selectedView === 'archived') {
            return notes.filter(n => n.archived);
        }
        return notes.filter(n => !n.archived);
    }

    function handleSelectNote(note) {
        setCurrentNote(note);
    }

    async function handleRecordingComplete(recordingData) {
        // Create a new note from the recording
        const newNote = await notesDB.createNote({
            title: `Meeting Note - ${new Date().toLocaleDateString()}`,
            content: recordingData.transcript || '',
            tags: ['meeting', 'transcription'],
            sourceType: 'meeting',
        });

        await activityDB.recordActivity('notesCreated');
        await activityDB.recordActivity('meetingsRecorded');
        setNotes([newNote, ...notes]);
        setCurrentNote(newNote);
        setShowRecording(false);
        setSelectedView('all');
    }

    function handleImportComplete(note) {
        loadNotes(); // Reload all notes
        setCurrentNote(note);
        setSelectedView('all');
    }

    const displayedNotes = getDisplayedNotes();

    return (
        <div className={`app ${darkMode ? 'dark' : 'light'}`}>
            {/* Sidebar */}
            <Sidebar
                selectedView={selectedView}
                onViewChange={setSelectedView}
                notes={notes}
                onCreateNote={handleCreateNote}
                onImportPDF={() => setShowPDFUploader(true)}
                onImportImage={() => setShowImageOCR(true)}
                onImportWeb={() => setShowWebClipper(true)}
            />

            {/* Main Content */}
            <div className="main-content">
                <Header
                    onSearch={handleSearch}
                    searchQuery={searchQuery}
                    onToggleAssistant={() => setShowAssistant(!showAssistant)}
                    onToggleRecording={() => setShowRecording(!showRecording)}
                    showAssistant={showAssistant}
                    showRecording={showRecording}
                />

                <div className="content-area">
                    {/* Main Content Area */}
                    {selectedView === 'tasks' ? (
                        <div className="full-width-view">
                            <TaskList onTaskClick={handleSelectNote} />
                        </div>
                    ) : selectedView === 'digest' ? (
                        <div className="full-width-view">
                            <DailyDigest />
                        </div>
                    ) : (
                        <div className={`notes-section ${currentNote ? 'with-editor' : 'full-width'}`}>
                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p className="text-secondary">Loading your notes...</p>
                                </div>
                            ) : (
                                <NoteList
                                    notes={displayedNotes}
                                    currentNote={currentNote}
                                    onSelectNote={handleSelectNote}
                                    onDeleteNote={handleDeleteNote}
                                    onToggleFavorite={handleToggleFavorite}
                                    viewType={selectedView}
                                />
                            )}
                        </div>
                    )}

                    {/* Note Editor */}
                    {currentNote && (
                        <div className="editor-section">
                            <NoteEditor
                                note={currentNote}
                                onUpdate={handleUpdateNote}
                                onClose={() => setCurrentNote(null)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* AI Assistant Panel */}
            {showAssistant && (
                <AssistantChat
                    notes={notes}
                    currentNote={currentNote}
                    onClose={() => setShowAssistant(false)}
                />
            )}

            {/* Recording Interface Modal */}
            {showRecording && (
                <RecordingInterface
                    onComplete={handleRecordingComplete}
                    onClose={() => setShowRecording(false)}
                />
            )}

            {/* Import Modals */}
            {showPDFUploader && (
                <PDFUploader
                    onNoteCreated={handleImportComplete}
                    onClose={() => setShowPDFUploader(false)}
                />
            )}

            {showImageOCR && (
                <ImageOCR
                    onNoteCreated={handleImportComplete}
                    onClose={() => setShowImageOCR(false)}
                />
            )}

            {showWebClipper && (
                <WebClipperDialog
                    onNoteCreated={handleImportComplete}
                    onClose={() => setShowWebClipper(false)}
                />
            )}
        </div>
    );
}

export default App;
