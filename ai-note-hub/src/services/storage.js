import Dexie from 'dexie';

// Initialize IndexedDB database
const db = new Dexie('AINotesHub');

// Define schema - Version 1 (original)
db.version(1).stores({
  notes: '++id, title, content, createdAt, updatedAt, tags, favorite, archived',
  attachments: '++id, noteId, filename, type, data, size',
  tags: '++id, name, color',
});

// Version 2 - Extended features (only add new tables, don't modify existing indexes)
db.version(2).stores({
  notes: '++id, title, content, createdAt, updatedAt, tags, favorite, archived', // Keep same as v1
  attachments: '++id, noteId, filename, type, data, size',
  tags: '++id, name, color',
  versions: '++id, noteId, content, createdAt, authorType',
  tasks: '++id, noteId, title, completed, priority, dueDate, createdAt',
  relationships: '++id, sourceNoteId, targetNoteId, strength, type',
  plugins: '++id, name, version, enabled, permissions',
  settings: 'key, value',
  dailyActivity: '++id, date, notesCreated, notesUpdated, tasksCompleted, meetingsRecorded',
}).upgrade(async tx => {
  // Migration logic: Add new fields to existing notes without breaking
  console.log('Upgrading database to version 2...');
  // Note: New fields (isLocal, sourceType, pdfData, etc.) will be added on-demand when notes are created/updated
});

// Notes API
export const notesDB = {
  // Create a new note
  async createNote(noteData) {
    const now = Date.now();
    const note = {
      title: noteData.title || 'Untitled',
      content: noteData.content || '',
      tags: noteData.tags || [],
      favorite: noteData.favorite || false,
      archived: noteData.archived || false,
      createdAt: now,
      updatedAt: now,
      embedding: null, // For semantic search
      isLocal: noteData.isLocal || false, // For offline mode
      sourceType: noteData.sourceType || 'manual', // manual, pdf, web, image, meeting
      pdfData: noteData.pdfData || null,
      imageData: noteData.imageData || null,
      webClipSource: noteData.webClipSource || null,
    };

    const id = await db.notes.add(note);

    // Create initial version
    await db.versions.add({
      noteId: id,
      content: note.content,
      title: note.title,
      createdAt: now,
      authorType: 'user',
    });

    return { ...note, id };
  },

  // Get all notes
  async getAllNotes() {
    const notes = await db.notes
      .orderBy('updatedAt')
      .reverse()
      .toArray();
    return notes;
  },

  // Get note by ID
  async getNoteById(id) {
    return await db.notes.get(id);
  },

  // Update note
  async updateNote(id, updates) {
    const now = Date.now();
    const updatedData = {
      ...updates,
      updatedAt: now,
    };

    await db.notes.update(id, updatedData);

    // Create version if content or title changed
    if (updates.content !== undefined || updates.title !== undefined) {
      const note = await db.notes.get(id);
      await db.versions.add({
        noteId: id,
        content: note.content,
        title: note.title,
        createdAt: now,
        authorType: 'user',
      });
    }

    return await db.notes.get(id);
  },

  // Delete note
  async deleteNote(id) {
    // Delete associated attachments
    await db.attachments.where('noteId').equals(id).delete();
    await db.notes.delete(id);
  },

  // Search notes (keyword search)
  async searchNotes(query) {
    const lowerQuery = query.toLowerCase();
    const notes = await db.notes
      .filter(note =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .toArray();

    return notes;
  },

  // Get notes by tag
  async getNotesByTag(tagName) {
    const notes = await db.notes
      .filter(note => note.tags.includes(tagName))
      .toArray();
    return notes;
  },

  // Get favorite notes
  async getFavoriteNotes() {
    const notes = await db.notes
      .filter(note => note.favorite === true)
      .toArray();
    return notes;
  },

  // Get archived notes
  async getArchivedNotes() {
    const notes = await db.notes
      .filter(note => note.archived === true)
      .toArray();
    return notes;
  },

  // Toggle favorite
  async toggleFavorite(id) {
    const note = await db.notes.get(id);
    await db.notes.update(id, { favorite: !note.favorite });
    return await db.notes.get(id);
  },

  // Toggle archive
  async toggleArchive(id) {
    const note = await db.notes.get(id);
    await db.notes.update(id, { archived: !note.archived });
    return await db.notes.get(id);
  },

  // Update note embedding for semantic search
  async updateEmbedding(id, embedding) {
    await db.notes.update(id, { embedding });
  },

  // Get recent notes
  async getRecentNotes(limit = 10) {
    const notes = await db.notes
      .orderBy('updatedAt')
      .reverse()
      .limit(limit)
      .toArray();
    return notes;
  },
};

// Attachments API
export const attachmentsDB = {
  // Add attachment to note
  async addAttachment(noteId, file) {
    const attachment = {
      noteId,
      filename: file.name,
      type: file.type,
      size: file.size,
      data: await fileToBase64(file),
      createdAt: Date.now(),
    };

    const id = await db.attachments.add(attachment);
    return { ...attachment, id };
  },

  // Get attachments for note
  async getAttachmentsByNoteId(noteId) {
    return await db.attachments
      .where('noteId')
      .equals(noteId)
      .toArray();
  },

  // Delete attachment
  async deleteAttachment(id) {
    await db.attachments.delete(id);
  },

  // Get attachment by ID
  async getAttachmentById(id) {
    return await db.attachments.get(id);
  },
};

// Tags API
export const tagsDB = {
  // Create or get tag
  async createTag(name, color) {
    const existing = await db.tags.where('name').equals(name).first();
    if (existing) {
      return existing;
    }

    const tag = {
      name,
      color: color || generateRandomColor(),
      createdAt: Date.now(),
    };

    const id = await db.tags.add(tag);
    return { ...tag, id };
  },

  // Get all tags
  async getAllTags() {
    return await db.tags.toArray();
  },

  // Get tag by name
  async getTagByName(name) {
    return await db.tags.where('name').equals(name).first();
  },

  // Delete tag
  async deleteTag(id) {
    const tag = await db.tags.get(id);
    if (tag) {
      // Remove tag from all notes
      const notes = await db.notes
        .filter(note => note.tags.includes(tag.name))
        .toArray();

      for (const note of notes) {
        const updatedTags = note.tags.filter(t => t !== tag.name);
        await db.notes.update(note.id, { tags: updatedTags });
      }

      await db.tags.delete(id);
    }
  },

  // Get tag usage count
  async getTagUsageCount(tagName) {
    const count = await db.notes
      .filter(note => note.tags.includes(tagName))
      .count();
    return count;
  },
};

// Utility function to convert file to base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Generate random color for tags
function generateRandomColor() {
  const colors = [
    'hsl(270, 70%, 60%)',  // purple
    'hsl(330, 75%, 65%)',  // pink
    'hsl(200, 80%, 55%)',  // blue
    'hsl(30, 90%, 55%)',   // orange
    'hsl(140, 70%, 55%)',  // green
    'hsl(45, 95%, 60%)',   // yellow
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Export/Import functionality
export const dataManager = {
  // Export all notes as JSON
  async exportNotes() {
    const notes = await notesDB.getAllNotes();
    const attachments = await db.attachments.toArray();
    const tags = await tagsDB.getAllTags();

    const data = {
      notes,
      attachments,
      tags,
      exportedAt: Date.now(),
      version: '1.0',
    };

    return JSON.stringify(data, null, 2);
  },

  // Import notes from JSON
  async importNotes(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      // Import tags first
      if (data.tags) {
        for (const tag of data.tags) {
          await db.tags.add(tag);
        }
      }

      // Import notes
      if (data.notes) {
        for (const note of data.notes) {
          await db.notes.add(note);
        }
      }

      // Import attachments
      if (data.attachments) {
        for (const attachment of data.attachments) {
          await db.attachments.add(attachment);
        }
      }

      return { success: true, count: data.notes?.length || 0 };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear all data
  async clearAllData() {
    await db.notes.clear();
    await db.attachments.clear();
    await db.tags.clear();
    await db.versions.clear();
    await db.tasks.clear();
    await db.relationships.clear();
    await db.plugins.clear();
    await db.settings.clear();
    await db.dailyActivity.clear();
  },
};

// Version History API
export const versionsDB = {
  // Get all versions for a note
  async getVersionsByNoteId(noteId) {
    return await db.versions
      .where('noteId')
      .equals(noteId)
      .reverse()
      .toArray();
  },

  // Get specific version
  async getVersionById(id) {
    return await db.versions.get(id);
  },

  // Delete old versions (keep last N)
  async pruneVersions(noteId, keepCount = 20) {
    const versions = await db.versions
      .where('noteId')
      .equals(noteId)
      .reverse()
      .toArray();

    if (versions.length > keepCount) {
      const toDelete = versions.slice(keepCount);
      for (const version of toDelete) {
        await db.versions.delete(version.id);
      }
    }
  },
};

// Tasks API
export const tasksDB = {
  // Create task
  async createTask(taskData) {
    const task = {
      noteId: taskData.noteId || null,
      title: taskData.title,
      completed: taskData.completed || false,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || null,
      createdAt: Date.now(),
      extractedFrom: taskData.extractedFrom || null,
    };

    const id = await db.tasks.add(task);
    return { ...task, id };
  },

  // Get all tasks
  async getAllTasks() {
    return await db.tasks.orderBy('createdAt').reverse().toArray();
  },

  // Get tasks by note
  async getTasksByNoteId(noteId) {
    return await db.tasks.where('noteId').equals(noteId).toArray();
  },

  // Update task
  async updateTask(id, updates) {
    await db.tasks.update(id, updates);
    return await db.tasks.get(id);
  },

  // Toggle task completion
  async toggleTask(id) {
    const task = await db.tasks.get(id);
    await db.tasks.update(id, { completed: !task.completed });
    return await db.tasks.get(id);
  },

  // Delete task
  async deleteTask(id) {
    await db.tasks.delete(id);
  },

  // Get incomplete tasks
  async getIncompleteTasks() {
    return await db.tasks.filter(task => !task.completed).toArray();
  },

  // Get completed tasks
  async getCompletedTasks() {
    return await db.tasks.filter(task => task.completed).toArray();
  },
};

// Relationships API (for knowledge graph)
export const relationshipsDB = {
  // Create relationship
  async createRelationship(sourceNoteId, targetNoteId, strength, type = 'semantic') {
    // Check if relationship already exists
    const existing = await db.relationships
      .where('sourceNoteId')
      .equals(sourceNoteId)
      .and(rel => rel.targetNoteId === targetNoteId)
      .first();

    if (existing) {
      await db.relationships.update(existing.id, { strength, type });
      return existing;
    }

    const relationship = {
      sourceNoteId,
      targetNoteId,
      strength,
      type,
      createdAt: Date.now(),
    };

    const id = await db.relationships.add(relationship);
    return { ...relationship, id };
  },

  // Get relationships for a note
  async getRelationships(noteId) {
    const outgoing = await db.relationships.where('sourceNoteId').equals(noteId).toArray();
    const incoming = await db.relationships.where('targetNoteId').equals(noteId).toArray();
    return { outgoing, incoming };
  },

  // Get all relationships
  async getAllRelationships() {
    return await db.relationships.toArray();
  },

  // Delete relationship
  async deleteRelationship(id) {
    await db.relationships.delete(id);
  },

  // Rebuild relationships (useful for recalculation)
  async rebuildRelationships() {
    await db.relationships.clear();
  },
};

// Plugins API
export const pluginsDB = {
  // Install plugin
  async installPlugin(pluginData) {
    const plugin = {
      name: pluginData.name,
      version: pluginData.version,
      enabled: pluginData.enabled !== undefined ? pluginData.enabled : true,
      permissions: pluginData.permissions || [],
      manifest: pluginData.manifest,
      code: pluginData.code,
      installedAt: Date.now(),
    };

    const id = await db.plugins.add(plugin);
    return { ...plugin, id };
  },

  // Get all plugins
  async getAllPlugins() {
    return await db.plugins.toArray();
  },

  // Get enabled plugins
  async getEnabledPlugins() {
    return await db.plugins.filter(p => p.enabled).toArray();
  },

  // Toggle plugin
  async togglePlugin(id) {
    const plugin = await db.plugins.get(id);
    await db.plugins.update(id, { enabled: !plugin.enabled });
    return await db.plugins.get(id);
  },

  // Update plugin
  async updatePlugin(id, updates) {
    await db.plugins.update(id, updates);
    return await db.plugins.get(id);
  },

  // Uninstall plugin
  async uninstallPlugin(id) {
    await db.plugins.delete(id);
  },
};

// Settings API
export const settingsDB = {
  // Set setting
  async setSetting(key, value) {
    await db.settings.put({ key, value });
  },

  // Get setting
  async getSetting(key, defaultValue = null) {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
  },

  // Get all settings
  async getAllSettings() {
    const settingsArray = await db.settings.toArray();
    return settingsArray.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  },

  // Delete setting
  async deleteSetting(key) {
    await db.settings.delete(key);
  },
};

// Daily Activity API
export const activityDB = {
  // Record activity
  async recordActivity(activityType, count = 1) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.dailyActivity
      .where('date')
      .equals(today)
      .first();

    if (existing) {
      const updates = {};
      updates[activityType] = (existing[activityType] || 0) + count;
      await db.dailyActivity.update(existing.id, updates);
    } else {
      const activity = {
        date: today,
        notesCreated: activityType === 'notesCreated' ? count : 0,
        notesUpdated: activityType === 'notesUpdated' ? count : 0,
        tasksCompleted: activityType === 'tasksCompleted' ? count : 0,
        meetingsRecorded: activityType === 'meetingsRecorded' ? count : 0,
      };
      await db.dailyActivity.add(activity);
    }
  },

  // Get today's activity
  async getTodayActivity() {
    const today = new Date().toISOString().split('T')[0];
    return await db.dailyActivity.where('date').equals(today).first();
  },

  // Get activity for date range
  async getActivityRange(startDate, endDate) {
    return await db.dailyActivity
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  // Get last N days activity
  async getRecentActivity(days = 7) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    return await this.getActivityRange(startDate, endDate);
  },
};

export default db;
