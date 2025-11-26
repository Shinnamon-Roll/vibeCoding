import Dexie from 'dexie';

// Initialize IndexedDB database
const db = new Dexie('AINotesHub');

// Define schema
db.version(1).stores({
  notes: '++id, title, content, createdAt, updatedAt, tags, favorite, archived',
  attachments: '++id, noteId, filename, type, data, size',
  tags: '++id, name, color',
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
    };
    
    const id = await db.notes.add(note);
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
    const updatedData = {
      ...updates,
      updatedAt: Date.now(),
    };
    
    await db.notes.update(id, updatedData);
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
  },
};

export default db;
