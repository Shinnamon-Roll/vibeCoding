// PDF Service for extracting text and metadata from PDF files
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use CDN for simplicity
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const pdfService = {
    /**
     * Extract text from PDF file
     * @param {File} file - PDF file object
     * @returns {Promise<Object>} Extracted data including text, metadata, and page count
     */
    async extractFromPDF(file) {
        try {
            // Validate file
            if (!file || file.type !== 'application/pdf') {
                throw new Error('Invalid PDF file');
            }

            // Check file size (limit to 50MB for performance)
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('PDF file is too large. Maximum size is 50MB.');
            }

            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Load PDF document
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            // Extract metadata
            const metadata = await pdf.getMetadata();
            const pageCount = pdf.numPages;

            // Extract text from all pages
            let fullText = '';
            const pages = [];

            for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');

                fullText += pageText + '\n\n';
                pages.push({
                    pageNumber: i,
                    text: pageText,
                });
            }

            return {
                success: true,
                text: fullText.trim(),
                pages,
                pageCount,
                metadata: {
                    title: metadata.info?.Title || file.name,
                    author: metadata.info?.Author || 'Unknown',
                    subject: metadata.info?.Subject || '',
                    keywords: metadata.info?.Keywords || '',
                    creationDate: metadata.info?.CreationDate || null,
                },
                fileName: file.name,
                fileSize: file.size,
            };
        } catch (error) {
            console.error('PDF extraction error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    },

    /**
     * Extract text from specific pages
     * @param {File} file - PDF file
     * @param {Array<number>} pageNumbers - Array of page numbers to extract
     */
    async extractPages(file, pageNumbers) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let text = '';
            for (const pageNum of pageNumbers) {
                if (pageNum > 0 && pageNum <= pdf.numPages) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    text += `--- Page ${pageNum} ---\n${pageText}\n\n`;
                }
            }

            return {
                success: true,
                text: text.trim(),
                pageNumbers,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    },

    /**
     * Chunk text for better processing
     * @param {string} text - Full text to chunk
     * @param {number} chunkSize - Maximum characters per chunk
     */
    chunkText(text, chunkSize = 2000) {
        const chunks = [];
        const paragraphs = text.split('\n\n');
        let currentChunk = '';

        for (const paragraph of paragraphs) {
            if ((currentChunk + paragraph).length > chunkSize && currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = paragraph;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    },

    /**
     * Extract headings and structure from text
     */
    extractStructure(text) {
        const lines = text.split('\n');
        const headings = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Simple heuristic: short lines (< 100 chars) in all caps or ending with colon
            if (line.length > 0 && line.length < 100) {
                const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
                const endsWithColon = line.endsWith(':');

                if (isAllCaps || endsWithColon) {
                    headings.push({
                        text: line,
                        lineNumber: i + 1,
                    });
                }
            }
        }

        return headings;
    },
};

export default pdfService;
