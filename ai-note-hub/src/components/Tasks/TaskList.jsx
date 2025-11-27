// Task List Component
import { useState, useEffect } from 'react';
import { CheckSquare, Square, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { tasksDB, notesDB } from '../../services/storage';
import { format } from 'date-fns';

function TaskList({ onTaskClick }) {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all'); // all, active, completed
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {
        try {
            setLoading(true);
            const allTasks = await tasksDB.getAllTasks();
            setTasks(allTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleTask(taskId) {
        await tasksDB.toggleTask(taskId);
        loadTasks();
    }

    async function handleDeleteTask(taskId) {
        if (confirm('Delete this task?')) {
            await tasksDB.deleteTask(taskId);
            loadTasks();
        }
    }

    async function handleTaskClick(task) {
        if (task.noteId && onTaskClick) {
            const note = await notesDB.getNoteById(task.noteId);
            onTaskClick(note);
        }
    }

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'hsl(0, 70%, 60%)';
            case 'medium': return 'hsl(30, 80%, 55%)';
            case 'low': return 'hsl(200, 70%, 60%)';
            default: return 'hsl(0, 0%, 60%)';
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p>Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="task-list-container">
            <div className="task-header">
                <h2>Tasks</h2>
                <div className="filter-buttons">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All ({tasks.length})
                    </button>
                    <button
                        className={filter === 'active' ? 'active' : ''}
                        onClick={() => setFilter('active')}
                    >
                        Active ({tasks.filter(t => !t.completed).length})
                    </button>
                    <button
                        className={filter === 'completed' ? 'active' : ''}
                        onClick={() => setFilter('completed')}
                    >
                        Completed ({tasks.filter(t => t.completed).length})
                    </button>
                </div>
            </div>

            <div className="task-list">
                {filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <CheckSquare size={48} strokeWidth={1} />
                        <p>No {filter !== 'all' ? filter : ''} tasks found</p>
                        <p className="text-secondary">
                            Tasks are automatically extracted from your notes
                        </p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <div
                            key={task.id}
                            className={`task-item ${task.completed ? 'completed' : ''}`}
                        >
                            <button
                                className="task-checkbox"
                                onClick={() => handleToggleTask(task.id)}
                            >
                                {task.completed ? (
                                    <CheckSquare size={20} color="hsl(140, 70%, 55%)" />
                                ) : (
                                    <Square size={20} />
                                )}
                            </button>

                            <div className="task-content" onClick={() => handleTaskClick(task)}>
                                <div className="task-title">{task.title}</div>

                                <div className="task-meta">
                                    {task.priority && task.priority !== 'medium' && (
                                        <span
                                            className="task-priority"
                                            style={{ color: getPriorityColor(task.priority) }}
                                        >
                                            {task.priority}
                                        </span>
                                    )}

                                    {task.dueDate && (
                                        <span className="task-due-date">
                                            <Calendar size={14} />
                                            {format(new Date(task.dueDate), 'MMM d')}
                                        </span>
                                    )}

                                    {task.noteId && (
                                        <span className="task-source">
                                            from note
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                className="icon-button task-delete"
                                onClick={() => handleDeleteTask(task.id)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TaskList;
