// AI Service for semantic search, summarization, and text rewriting
// Using local vector-based approach with simulated embeddings

// Simple text embedding using TF-IDF-like approach
function generateEmbedding(text) {
    // Normalize and tokenize
    const tokens = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2);

    // Create a simple word frequency vector
    const wordFreq = {};
    tokens.forEach(token => {
        wordFreq[token] = (wordFreq[token] || 0) + 1;
    });

    // Create embedding vector (simplified)
    const embedding = tokens.slice(0, 100).map(token => wordFreq[token] || 0);

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) {
        return 0;
    }

    const minLength = Math.min(vec1.length, vec2.length);
    let dotProduct = 0;

    for (let i = 0; i < minLength; i++) {
        dotProduct += (vec1[i] || 0) * (vec2[i] || 0);
    }

    return dotProduct;
}

export const aiService = {
    // Generate embedding for text
    async generateEmbedding(text) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return generateEmbedding(text);
    },

    // Semantic search across notes
    async semanticSearch(query, notes) {
        const queryEmbedding = generateEmbedding(query);

        // Calculate similarity for each note
        const results = notes.map(note => {
            const noteText = `${note.title} ${note.content}`;
            const noteEmbedding = note.embedding || generateEmbedding(noteText);
            const similarity = cosineSimilarity(queryEmbedding, noteEmbedding);

            return {
                ...note,
                similarity,
                embedding: noteEmbedding,
            };
        });

        // Sort by similarity
        results.sort((a, b) => b.similarity - a.similarity);

        // Return top results with similarity > threshold
        return results.filter(r => r.similarity > 0.1);
    },

    // Generate summary of text
    async summarize(text, options = {}) {
        const maxLength = options.maxLength || 200;

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Extract key sentences (simple extractive summarization)
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        if (sentences.length <= 2) {
            return text;
        }

        // Score sentences based on word importance
        const scoredSentences = sentences.map(sentence => {
            const words = sentence.toLowerCase().split(/\s+/);
            // Simple scoring: longer sentences with more content words
            const score = words.filter(w => w.length > 4).length;
            return { sentence: sentence.trim(), score };
        });

        // Sort by score and take top sentences
        scoredSentences.sort((a, b) => b.score - a.score);

        let summary = '';
        let currentLength = 0;

        for (const { sentence } of scoredSentences) {
            if (currentLength + sentence.length > maxLength && summary.length > 0) {
                break;
            }
            summary += (summary ? ' ' : '') + sentence;
            currentLength += sentence.length;
        }

        return summary || sentences[0];
    },

    // Rewrite/improve text
    async rewrite(text, style = 'improve') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const styles = {
            improve: 'Improved: ',
            professional: 'Professional: ',
            casual: 'Casual: ',
            concise: 'Concise: ',
        };

        // In a real implementation, this would call an AI model
        // For now, return a simulated rewrite
        const prefix = styles[style] || styles.improve;

        // Simple text improvements
        let rewritten = text
            .replace(/\b(\w+)\s+\1\b/gi, '$1') // Remove duplicate words
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        if (style === 'concise') {
            const sentences = rewritten.match(/[^.!?]+[.!?]+/g) || [rewritten];
            rewritten = sentences.slice(0, Math.ceil(sentences.length / 2)).join(' ');
        }

        return `${prefix}${rewritten}`;
    },

    // AI Assistant chat - context-aware responses
    async chat(message, context = {}) {
        const { notes = [], currentNote = null } = context;

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 400));

        const lowerMessage = message.toLowerCase();

        // Handle specific commands
        if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
            if (currentNote) {
                const summary = await this.summarize(currentNote.content);
                return {
                    response: `Here's a summary of "${currentNote.title}":\n\n${summary}`,
                    type: 'summary',
                };
            }
            return {
                response: 'Please select a note to summarize.',
                type: 'info',
            };
        }

        if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
            const query = message.replace(/(search|find|for)/gi, '').trim();
            if (query && notes.length > 0) {
                const results = await this.semanticSearch(query, notes);
                const topResults = results.slice(0, 3);

                if (topResults.length > 0) {
                    const notesList = topResults
                        .map((n, i) => `${i + 1}. ${n.title}`)
                        .join('\n');
                    return {
                        response: `I found ${results.length} relevant note(s):\n\n${notesList}`,
                        type: 'search',
                        results: topResults,
                    };
                }
            }
            return {
                response: 'No matching notes found.',
                type: 'info',
            };
        }

        if (lowerMessage.includes('rewrite') || lowerMessage.includes('improve')) {
            if (currentNote) {
                const style = lowerMessage.includes('professional') ? 'professional' :
                    lowerMessage.includes('casual') ? 'casual' :
                        lowerMessage.includes('concise') ? 'concise' : 'improve';

                const rewritten = await this.rewrite(currentNote.content, style);
                return {
                    response: `Here's a ${style} version:\n\n${rewritten}`,
                    type: 'rewrite',
                };
            }
            return {
                response: 'Please select a note to rewrite.',
                type: 'info',
            };
        }

        if (lowerMessage.includes('how many notes') || lowerMessage.includes('count')) {
            return {
                response: `You have ${notes.length} note(s) in your collection.`,
                type: 'info',
            };
        }

        if (lowerMessage.includes('recent')) {
            const recent = notes.slice(0, 5);
            const notesList = recent
                .map((n, i) => `${i + 1}. ${n.title}`)
                .join('\n');
            return {
                response: `Your most recent notes:\n\n${notesList}`,
                type: 'list',
                results: recent,
            };
        }

        // Default response
        return {
            response: `I can help you with:
• Summarize notes
• Search for specific content
• Rewrite text (professional, casual, concise)
• Count and list notes

Try asking "summarize this note" or "search for [topic]"`,
            type: 'help',
        };
    },

    // Extract key topics from text
    async extractTopics(text) {
        await new Promise(resolve => setTimeout(resolve, 200));

        // Simple keyword extraction
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 4);

        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        const topics = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);

        return topics;
    },

    // Suggest tags for a note
    async suggestTags(title, content) {
        const topics = await this.extractTopics(`${title} ${content}`);
        return topics.slice(0, 3);
    },
};

export default aiService;
