// Daily Digest Component
import { useState, useEffect } from 'react';
import { TrendingUp, FileText, CheckSquare, Video, Sparkles } from 'lucide-react';
import digestService from '../../services/digestService';

function DailyDigest({ onClose }) {
    const [digest, setDigest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDigest();
    }, []);

    async function loadDigest() {
        try {
            setLoading(true);
            const data = await digestService.generateDailyDigest();
            setDigest(data);
        } catch (error) {
            console.error('Error loading digest:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="digest-container loading">
                <div className="spinner" />
                <p>Generating your daily digest...</p>
            </div>
        );
    }

    if (!digest) {
        return null;
    }

    const { activity, insights, summary, newNotes, completedTasks } = digest;

    return (
        <div className="digest-container">
            <div className="digest-header">
                <h2>
                    <Sparkles size={24} />
                    Daily Digest
                </h2>
                <p className="digest-date">{new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
            </div>

            <div className="digest-summary">
                <p>{summary}</p>
            </div>

            <div className="digest-stats">
                <div className="stat-card">
                    <FileText size={24} />
                    <div>
                        <div className="stat-value">{activity.notesCreated || 0}</div>
                        <div className="stat-label">Notes Created</div>
                    </div>
                </div>

                <div className="stat-card">
                    <FileText size={24} />
                    <div>
                        <div className="stat-value">{activity.notesUpdated || 0}</div>
                        <div className="stat-label">Notes Updated</div>
                    </div>
                </div>

                <div className="stat-card">
                    <CheckSquare size={24} />
                    <div>
                        <div className="stat-value">{activity.tasksCompleted || 0}</div>
                        <div className="stat-label">Tasks Completed</div>
                    </div>
                </div>

                <div className="stat-card">
                    <Video size={24} />
                    <div>
                        <div className="stat-value">{activity.meetingsRecorded || 0}</div>
                        <div className="stat-label">Meetings Recorded</div>
                    </div>
                </div>
            </div>

            {insights && insights.length > 0 && (
                <div className="digest-insights">
                    <h3>Insights</h3>
                    {insights.map((insight, index) => (
                        <div key={index} className="insight-item">
                            <span className="insight-emoji">{insight.message.split(' ')[0]}</span>
                            <span>{insight.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {newNotes && newNotes.length > 0 && (
                <div className="digest-section">
                    <h3>New Notes Today</h3>
                    <div className="note-pills">
                        {newNotes.map(note => (
                            <div key={note.id} className="note-pill">
                                {note.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {completedTasks && completedTasks.length > 0 && (
                <div className="digest-section">
                    <h3>Completed Tasks</h3>
                    <ul className="task-list">
                        {completedTasks.map(task => (
                            <li key={task.id}>
                                <CheckSquare size={16} />
                                {task.title}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default DailyDigest;
