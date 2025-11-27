// OCR Service for extracting text from images
import Tesseract from 'tesseract.js';

export const ocrService = {
    /**
     * Extract text from image using OCR
     * @param {File} imageFile - Image file (PNG, JPG, WebP)
     * @param {string} language - OCR language (default: 'eng')
     * @param {Function} onProgress - Progress callback
     */
    async extractTextFromImage(imageFile, language = 'eng', onProgress = null) {
        try {
            // Validate file
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!imageFile || !validTypes.includes(imageFile.type)) {
                throw new Error('Invalid image file. Supported formats: PNG, JPG, WebP');
            }

            // Check file size (limit to 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (imageFile.size > maxSize) {
                throw new Error('Image file is too large. Maximum size is 10MB.');
            }

            // Create image URL
            const imageUrl = URL.createObjectURL(imageFile);

            // Perform OCR
            const result = await Tesseract.recognize(
                imageUrl,
                language,
                {
                    logger: (m) => {
                        if (onProgress && m.status === 'recognizing text') {
                            onProgress(Math.round(m.progress * 100));
                        }
                    },
                }
            );

            // Clean up
            URL.revokeObjectURL(imageUrl);

            // Extract structured data
            const extractedData = this.analyzeOCRResult(result.data);

            return {
                success: true,
                text: result.data.text,
                confidence: result.data.confidence,
                ...extractedData,
                fileName: imageFile.name,
                fileSize: imageFile.size,
            };
        } catch (error) {
            console.error('OCR error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    },

    /**
     * Analyze OCR result to extract structure
     */
    analyzeOCRResult(data) {
        const lines = data.lines || [];
        const words = data.words || [];

        // Extract potential headings (larger font, higher confidence)
        const headings = lines
            .filter(line => {
                const avgConfidence = line.words.reduce((sum, w) => sum + w.confidence, 0) / line.words.length;
                return avgConfidence > 80 && line.text.length < 100;
            })
            .map(line => line.text);

        // Detect bullet points or lists
        const bulletPoints = lines
            .filter(line => /^[\-\*\•]\s/.test(line.text))
            .map(line => line.text.replace(/^[\-\*\•]\s/, '').trim());

        // Detect potential tables (multiple words aligned)
        const hasTables = this.detectTables(data);

        return {
            headings,
            bulletPoints,
            hasTables,
            lineCount: lines.length,
            wordCount: words.length,
        };
    },

    /**
     * Simple table detection heuristic
     */
    detectTables(data) {
        const lines = data.lines || [];
        if (lines.length < 3) return false;

        // Check if multiple consecutive lines have similar word counts
        let tableLines = 0;
        for (let i = 0; i < lines.length - 2; i++) {
            const count1 = lines[i].words.length;
            const count2 = lines[i + 1].words.length;
            const count3 = lines[i + 2].words.length;

            if (count1 > 2 && Math.abs(count1 - count2) <= 1 && Math.abs(count2 - count3) <= 1) {
                tableLines++;
            }
        }

        return tableLines >= 3;
    },

    /**
     * Extract text from multiple images
     */
    async batchExtract(imageFiles, language = 'eng', onProgress = null) {
        const results = [];
        const total = imageFiles.length;

        for (let i = 0; i < imageFiles.length; i++) {
            const result = await this.extractTextFromImage(
                imageFiles[i],
                language,
                (progress) => {
                    if (onProgress) {
                        const overallProgress = ((i * 100 + progress) / total);
                        onProgress(Math.round(overallProgress));
                    }
                }
            );
            results.push(result);
        }

        return results;
    },

    /**
     * Supported languages
     */
    getSupportedLanguages() {
        return [
            { code: 'eng', name: 'English' },
            { code: 'spa', name: 'Spanish' },
            { code: 'fra', name: 'French' },
            { code: 'deu', name: 'German' },
            { code: 'ita', name: 'Italian' },
            { code: 'por', name: 'Portuguese' },
            { code: 'rus', name: 'Russian' },
            { code: 'jpn', name: 'Japanese' },
            { code: 'chi_sim', name: 'Chinese (Simplified)' },
            { code: 'chi_tra', name: 'Chinese (Traditional)' },
            { code: 'kor', name: 'Korean' },
            { code: 'ara', name: 'Arabic' },
            { code: 'hin', name: 'Hindi' },
        ];
    },
};

export default ocrService;
