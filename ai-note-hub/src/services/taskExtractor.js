// Task Extraction Service - Extract actionable items from text
export const taskExtractor = {
    /**
     * Extract tasks from text content
     * @param {string} text - Text content to analyze
     * @param {number} noteId - Associated note ID
     */
    extractTasks(text, noteId = null) {
        const tasks = [];
        const lines = text.split('\n');

        // Pattern matching for various task formats
        const patterns = [
            // Checkbox markdown: - [ ] Task or - [x] Task
            /^[\s-]*\[([x ])\]\s+(.+)$/i,
            // TODO: or TO-DO:
            /^[\s-]*(?:TODO|TO-DO|TASK)[\s:]+(.+)$/i,
            // Action verbs at start of line
            /^[\s-]*(?:Need to|Must|Should|Will|Have to|Don't forget to)\s+(.+)$/i,
            // Imperative verbs
            /^[\s-]*(?:Call|Email|Send|Schedule|Book|Buy|Fix|Update|Review|Complete|Finish|Start|Begin)\s+(.+)$/i,
        ];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.length < 5) continue;

            for (const pattern of patterns) {
                const match = trimmed.match(pattern);
                if (match) {
                    const taskText = match[match.length - 1]?.trim();
                    if (taskText && taskText.length > 2) {
                        // Check if already completed (for checkbox format)
                        const isCompleted = match[1] === 'x';

                        // Extract priority and due date
                        const { priority, dueDate, cleanText } = this.extractMetadata(taskText);

                        tasks.push({
                            title: cleanText,
                            noteId,
                            completed: isCompleted,
                            priority,
                            dueDate,
                            extractedFrom: trimmed,
                        });
                    }
                    break;
                }
            }
        }

        return this.deduplicateTasks(tasks);
    },

    /**
     * Extract priority and due date from task text
     */
    extractMetadata(text) {
        let cleanText = text;
        let priority = 'medium';
        let dueDate = null;

        // Priority detection
        if (/!{3,}|urgent|critical|asap/i.test(text)) {
            priority = 'high';
            cleanText = cleanText.replace(/!{3,}|urgent|critical|asap/gi, '').trim();
        } else if (/!{2}|important/i.test(text)) {
            priority = 'medium';
            cleanText = cleanText.replace(/!{2}|important/gi, '').trim();
        } else if (/!|low priority|when possible/i.test(text)) {
            priority = 'low';
            cleanText = cleanText.replace(/!|low priority|when possible/gi, '').trim();
        }

        // Due date detection (simple patterns)
        const datePatterns = [
            // Tomorrow, today
            { pattern: /\b(today|tomorrow)\b/i, days: (match) => match.toLowerCase() === 'today' ? 0 : 1 },
            // Next week, next month
            { pattern: /\bnext week\b/i, days: () => 7 },
            { pattern: /\bnext month\b/i, days: () => 30 },
            // In X days
            { pattern: /\bin (\d+) days?\b/i, days: (match) => parseInt(match[1]) },
            // By/before date patterns
            {
                pattern: /\b(?:by|before|due)\s+(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b/i, days: (match) => {
                    try {
                        const date = new Date(match[1]);
                        return Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
                    } catch {
                        return null;
                    }
                }
            },
        ];

        for (const { pattern, days } of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                const daysToAdd = days(match);
                if (daysToAdd !== null) {
                    dueDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
                    cleanText = cleanText.replace(pattern, '').trim();
                }
                break;
            }
        }

        // Remove common punctuation at the end
        cleanText = cleanText.replace(/[.!]+$/, '').trim();

        return { priority, dueDate, cleanText };
    },

    /**
     * Remove duplicate tasks
     */
    deduplicateTasks(tasks) {
        const seen = new Set();
        return tasks.filter(task => {
            const key = task.title.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },

    /**
     * Extract tasks from multiple notes
     */
    extractFromNotes(notes) {
        const allTasks = [];
        for (const note of notes) {
            const noteTasks = this.extractTasks(note.content, note.id);
            allTasks.push(...noteTasks);
        }
        return allTasks;
    },
};

export default taskExtractor;
