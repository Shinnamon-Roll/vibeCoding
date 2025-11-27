// Knowledge Graph Service - Build semantic relationships between notes
import aiService from './ai';

export const knowledgeGraph = {
    /**
     * Build relationship graph from notes
     * @param {Array} notes - All notes
     * @param {number} threshold - Similarity threshold (0-1)
     */
    async buildGraph(notes, threshold = 0.3) {
        const relationships = [];

        // Compare each note with every other note
        for (let i = 0; i < notes.length; i++) {
            for (let j = i + 1; j < notes.length; j++) {
                const note1 = notes[i];
                const note2 = notes[j];

                // Calculate similarity
                const similarity = await this.calculateSimilarity(note1, note2);

                if (similarity >= threshold) {
                    relationships.push({
                        sourceNoteId: note1.id,
                        targetNoteId: note2.id,
                        strength: similarity,
                        type: 'semantic',
                    });
                }
            }
        }

        return relationships;
    },

    /**
     * Calculate similarity between two notes
     */
    async calculateSimilarity(note1, note2) {
        // Check for tag overlap
        const tagSimilarity = this.calculateTagSimilarity(note1.tags || [], note2.tags || []);

        // Check for content similarity using embeddings
        let embeddingSimilarity = 0;
        if (note1.embedding && note2.embedding) {
            embeddingSimilarity = aiService.cosineSimilarity(note1.embedding, note2.embedding);
        }

        // Check for keyword overlap
        const keywordSimilarity = this.calculateKeywordSimilarity(
            note1.title + ' ' + note1.content,
            note2.title + ' ' + note2.content
        );

        // Weighted combination
        return (
            tagSimilarity * 0.3 +
            embeddingSimilarity * 0.5 +
            keywordSimilarity * 0.2
        );
    },

    /**
     * Calculate tag overlap similarity
     */
    calculateTagSimilarity(tags1, tags2) {
        if (tags1.length === 0 || tags2.length === 0) return 0;

        const set1 = new Set(tags1);
        const set2 = new Set(tags2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));

        return (2 * intersection.size) / (set1.size + set2.size);
    },

    /**
     * Calculate keyword similarity using Jaccard index
     */
    calculateKeywordSimilarity(text1, text2) {
        const words1 = this.extractKeywords(text1);
        const words2 = this.extractKeywords(text2);

        const set1 = new Set(words1);
        const set2 = new Set(words2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        if (union.size === 0) return 0;
        return intersection.size / union.size;
    },

    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        // Common stop words to filter out
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i',
            'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when',
            'where', 'why', 'how', 'not', 'no', 'yes',
        ]);

        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));
    },

    /**
     * Find related notes for a specific note
     * @param {Object} note - Target note
     * @param {Array} allNotes - All notes
     * @param {number} limit - Maximum number of related notes
     */
    async findRelatedNotes(note, allNotes, limit = 5) {
        const similarities = [];

        for (const otherNote of allNotes) {
            if (otherNote.id === note.id) continue;

            const similarity = await this.calculateSimilarity(note, otherNote);
            if (similarity > 0.2) {
                similarities.push({
                    note: otherNote,
                    similarity,
                });
            }
        }

        // Sort by similarity and return top N
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(item => ({
                ...item.note,
                relationshipStrength: item.similarity,
            }));
    },

    /**
     * Cluster notes by topic
     */
    clusterByTopic(notes, numClusters = 5) {
        // Simple clustering based on shared keywords
        const clusters = [];

        // Extract all keywords from all notes
        const noteKeywords = notes.map(note => ({
            note,
            keywords: this.extractKeywords(note.title + ' ' + note.content),
        }));

        // Create initial clusters from most common keywords
        const keywordFreq = {};
        noteKeywords.forEach(({ keywords }) => {
            keywords.forEach(kw => {
                keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
            });
        });

        const topKeywords = Object.entries(keywordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, numClusters)
            .map(([kw]) => kw);

        // Assign notes to clusters
        topKeywords.forEach((keyword, index) => {
            const clusterNotes = noteKeywords
                .filter(({ keywords }) => keywords.includes(keyword))
                .map(({ note }) => note);

            if (clusterNotes.length > 0) {
                clusters.push({
                    id: index,
                    label: keyword,
                    notes: clusterNotes,
                });
            }
        });

        // Add remaining notes to "Other" cluster
        const assignedNoteIds = new Set(
            clusters.flatMap(c => c.notes.map(n => n.id))
        );
        const unassignedNotes = notes.filter(n => !assignedNoteIds.has(n.id));

        if (unassignedNotes.length > 0) {
            clusters.push({
                id: clusters.length,
                label: 'Other',
                notes: unassignedNotes,
            });
        }

        return clusters;
    },

    /**
     * Generate graph data for visualization
     */
    generateGraphData(notes, relationships) {
        const nodes = notes.map(note => ({
            id: note.id,
            label: note.title,
            tags: note.tags || [],
            size: (note.content?.length || 0) / 100, // Size based on content length
        }));

        const edges = relationships.map(rel => ({
            source: rel.sourceNoteId,
            target: rel.targetNoteId,
            strength: rel.strength,
        }));

        return { nodes, edges };
    },
};

export default knowledgeGraph;
