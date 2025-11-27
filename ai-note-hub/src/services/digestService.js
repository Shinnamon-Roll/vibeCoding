// Daily Digest Service - Generate daily activity summaries
import { notesDB, tasksDB, activityDB } from './storage';
import aiService from './ai';

export const digestService = {
    /**
     * Generate daily digest
     * @param {Date} date - Target date (defaults to today)
     */
    async generateDailyDigest(date = new Date()) {
        const dateStr = date.toISOString().split('T')[0];
        const startOfDay = new Date(dateStr).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

        // Get activity data
        const activity = await activityDB.getTodayActivity() || {
            notesCreated: 0,
            notesUpdated: 0,
            tasksCompleted: 0,
            meetingsRecorded: 0,
        };

        // Get notes created/updated today
        const allNotes = await notesDB.getAllNotes();
        const todayNotes = allNotes.filter(note =>
            note.createdAt >= startOfDay && note.createdAt < endOfDay
        );
        const updatedNotes = allNotes.filter(note =>
            note.updatedAt >= startOfDay &&
            note.updatedAt < endOfDay &&
            note.createdAt < startOfDay
        );

        // Get tasks completed today
        const allTasks = await tasksDB.getAllTasks();
        const completedTasks = allTasks.filter(task =>
            task.completed && task.updatedAt >= startOfDay && task.updatedAt < endOfDay
        );

        // Get meeting notes
        const meetingNotes = todayNotes.filter(note =>
            (note.tags || []).includes('meeting') || note.sourceType === 'meeting'
        );

        // Generate insights
        const insights = await this.generateInsights({
            notes: todayNotes,
            updatedNotes,
            tasks: completedTasks,
            meetings: meetingNotes,
        });

        return {
            date: dateStr,
            activity,
            newNotes: todayNotes.slice(0, 5), // Top 5 new notes
            updatedNotes: updatedNotes.slice(0, 5),
            completedTasks: completedTasks.slice(0, 10),
            meetings: meetingNotes,
            insights,
            summary: this.generateSummary(activity, insights),
        };
    },

    /**
     * Generate insights from daily activity
     */
    async generateInsights(data) {
        const insights = [];

        // Productivity insight
        const totalActions = data.notes.length + data.tasks.length;
        if (totalActions > 10) {
            insights.push({
                type: 'productivity',
                message: `🚀 Highly productive day! You created ${data.notes.length} notes and completed ${data.tasks.length} tasks.`,
            });
        } else if (totalActions > 5) {
            insights.push({
                type: 'productivity',
                message: `✅ Good progress today with ${totalActions} total actions.`,
            });
        }

        // Topic trends
        const topicCounts = {};
        data.notes.forEach(note => {
            (note.tags || []).forEach(tag => {
                topicCounts[tag] = (topicCounts[tag] || 0) + 1;
            });
        });

        const topTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (topTopics.length > 0) {
            const topicsStr = topTopics.map(([tag, count]) => `${tag} (${count})`).join(', ');
            insights.push({
                type: 'topics',
                message: `📊 Top topics today: ${topicsStr}`,
            });
        }

        // Meeting focus
        if (data.meetings.length > 0) {
            insights.push({
                type: 'meetings',
                message: `🗓️ You recorded ${data.meetings.length} meeting${data.meetings.length > 1 ? 's' : ''} today.`,
            });
        }

        // Task completion rate
        if (data.tasks.length > 0) {
            insights.push({
                type: 'tasks',
                message: `✨ Completed ${data.tasks.length} task${data.tasks.length > 1 ? 's' : ''} today!`,
            });
        }

        return insights;
    },

    /**
     * Generate text summary
     */
    generateSummary(activity, insights) {
        if (activity.notesCreated === 0 && activity.tasksCompleted === 0) {
            return "You haven't recorded any activity today yet. Start by creating a note or completing a task!";
        }

        let summary = `Today you were productive! `;

        if (activity.notesCreated > 0) {
            summary += `Created ${activity.notesCreated} new note${activity.notesCreated > 1 ? 's' : ''}. `;
        }

        if (activity.notesUpdated > 0) {
            summary += `Updated ${activity.notesUpdated} existing note${activity.notesUpdated > 1 ? 's' : ''}. `;
        }

        if (activity.tasksCompleted > 0) {
            summary += `Completed ${activity.tasksCompleted} task${activity.tasksCompleted > 1 ? 's' : ''}. `;
        }

        if (activity.meetingsRecorded > 0) {
            summary += `Recorded ${activity.meetingsRecorded} meeting${activity.meetingsRecorded > 1 ? 's' : ''}. `;
        }

        return summary.trim();
    },

    /**
     * Get week summary
     */
    async getWeeklySummary() {
        const activities = await activityDB.getRecentActivity(7);

        const totals = activities.reduce((acc, day) => ({
            notesCreated: acc.notesCreated + (day.notesCreated || 0),
            notesUpdated: acc.notesUpdated + (day.notesUpdated || 0),
            tasksCompleted: acc.tasksCompleted + (day.tasksCompleted || 0),
            meetingsRecorded: acc.meetingsRecorded + (day.meetingsRecorded || 0),
        }), { notesCreated: 0, notesUpdated: 0, tasksCompleted: 0, meetingsRecorded: 0 });

        return {
            period: 'Last 7 days',
            totals,
            dailyActivities: activities,
            averagePerDay: {
                notes: Math.round((totals.notesCreated + totals.notesUpdated) / 7),
                tasks: Math.round(totals.tasksCompleted / 7),
            },
        };
    },
};

export default digestService;
