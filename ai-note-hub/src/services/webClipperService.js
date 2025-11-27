// Web Clipper Service for extracting and cleaning web content
import DOMPurify from 'dompurify';

export const webClipperService = {
    /**
     * Extract clean content from HTML
     * @param {string} html - Raw HTML content
     * @param {string} url - Source URL (optional)
     */
    extractFromHTML(html, url = null) {
        try {
            // Sanitize HTML
            const clean = DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'a', 'img'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
            });

            // Parse in temporary element
            const parser = new DOMParser();
            const doc = parser.parseFromString(clean, 'text/html');

            // Extract main content (simple heuristic)
            const content = this.extractMainContent(doc);

            // Extract metadata
            const metadata = this.extractMetadata(doc, url);

            // Convert to markdown-like format
            const markdown = this.htmlToMarkdown(content);

            // Suggest tags based on content
            const tags = this.suggestTags(metadata.title, markdown);

            return {
                success: true,
                content: markdown,
                metadata,
                tags,
                rawHTML: clean,
            };
        } catch (error) {
            console.error('Web clipper error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    },

    /**
     * Extract main content from document
     * Prioritizes article, main, or the largest content block
     */
    extractMainContent(doc) {
        // Try semantic HTML5 elements first
        const article = doc.querySelector('article');
        if (article) return article;

        const main = doc.querySelector('main');
        if (main) return main;

        const role = doc.querySelector('[role="main"]');
        if (role) return role;

        // Fallback: find largest content block
        const contentBlocks = doc.querySelectorAll('div, section');
        let largest = null;
        let maxLength = 0;

        contentBlocks.forEach(block => {
            const text = block.textContent || '';
            if (text.length > maxLength) {
                maxLength = text.length;
                largest = block;
            }
        });

        return largest || doc.body;
    },

    /**
     * Extract metadata from document
     */
    extractMetadata(doc, url) {
        // Try og:tags first
        const getMetaContent = (name) => {
            const meta = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
            return meta ? meta.getAttribute('content') : null;
        };

        const title = getMetaContent('og:title') ||
            getMetaContent('twitter:title') ||
            doc.querySelector('title')?.textContent ||
            'Untitled';

        const description = getMetaContent('og:description') ||
            getMetaContent('twitter:description') ||
            getMetaContent('description') ||
            '';

        const author = getMetaContent('author') ||
            getMetaContent('article:author') ||
            doc.querySelector('[rel="author"]')?.textContent ||
            'Unknown';

        const publishDate = getMetaContent('article:published_time') ||
            getMetaContent('datePublished') ||
            null;

        const image = getMetaContent('og:image') ||
            getMetaContent('twitter:image') ||
            null;

        return {
            title: title.trim(),
            description: description.trim(),
            author: author.trim(),
            publishDate,
            image,
            url: url || getMetaContent('og:url'),
        };
    },

    /**
     * Convert HTML to simplified markdown
     */
    htmlToMarkdown(element) {
        let markdown = '';

        const traverse = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) markdown += text + ' ';
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return;

            const tag = node.tagName.toLowerCase();

            switch (tag) {
                case 'h1':
                    markdown += '\n# ' + node.textContent.trim() + '\n\n';
                    break;
                case 'h2':
                    markdown += '\n## ' + node.textContent.trim() + '\n\n';
                    break;
                case 'h3':
                    markdown += '\n### ' + node.textContent.trim() + '\n\n';
                    break;
                case 'h4':
                case 'h5':
                case 'h6':
                    markdown += '\n#### ' + node.textContent.trim() + '\n\n';
                    break;
                case 'p':
                    node.childNodes.forEach(traverse);
                    markdown += '\n\n';
                    break;
                case 'br':
                    markdown += '\n';
                    break;
                case 'strong':
                case 'b':
                    markdown += '**' + node.textContent.trim() + '**';
                    break;
                case 'em':
                case 'i':
                    markdown += '*' + node.textContent.trim() + '*';
                    break;
                case 'a':
                    const href = node.getAttribute('href');
                    markdown += '[' + node.textContent.trim() + '](' + href + ')';
                    break;
                case 'ul':
                case 'ol':
                    markdown += '\n';
                    node.childNodes.forEach(traverse);
                    markdown += '\n';
                    break;
                case 'li':
                    markdown += '- ' + node.textContent.trim() + '\n';
                    break;
                case 'blockquote':
                    const lines = node.textContent.trim().split('\n');
                    markdown += '\n' + lines.map(l => '> ' + l).join('\n') + '\n\n';
                    break;
                case 'pre':
                case 'code':
                    markdown += '`' + node.textContent.trim() + '`';
                    break;
                default:
                    node.childNodes.forEach(traverse);
            }
        };

        traverse(element);

        // Clean up excessive whitespace
        return markdown.replace(/\n{3,}/g, '\n\n').trim();
    },

    /**
     * Suggest tags based on content
     */
    suggestTags(title, content) {
        const text = (title + ' ' + content).toLowerCase();
        const tags = [];

        // Common topic keywords
        const topicMap = {
            'technology': ['tech', 'software', 'code', 'programming', 'development'],
            'business': ['business', 'startup', 'entrepreneur', 'marketing', 'sales'],
            'science': ['science', 'research', 'study', 'experiment', 'data'],
            'design': ['design', 'ui', 'ux', 'interface', 'visual'],
            'productivity': ['productivity', 'workflow', 'tips', 'efficiency', 'tools'],
            'tutorial': ['tutorial', 'guide', 'how-to', 'learn', 'course'],
            'news': ['news', 'breaking', 'update', 'announcement', 'report'],
            'article': ['article', 'blog', 'post', 'opinion', 'essay'],
        };

        for (const [tag, keywords] of Object.entries(topicMap)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                tags.push(tag);
            }
        }

        // Add 'web-clip' tag
        tags.push('web-clip');

        return tags.slice(0, 5); // Limit to 5 tags
    },

    /**
     * Fetch and extract content from URL
     * Note: This will be limited by CORS in browser environment
     */
    async fetchFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            return this.extractFromHTML(html, url);
        } catch (error) {
            // CORS or network error
            return {
                success: false,
                error: 'Unable to fetch URL directly. Please paste the HTML content instead. (CORS limitation)',
                corsError: true,
            };
        }
    },
};

export default webClipperService;
