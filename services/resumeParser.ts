import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const pdf = require('pdf-parse');
const mammoth = require('mammoth');

interface ParsedResume {
    text: string;
    metadata?: any;
    error?: string;
}

export const parseResume = async (buffer: Buffer, mimeType: string): Promise<ParsedResume> => {
    try {
        console.log(`📄 resumeParser: Starting parse for mimeType: ${mimeType}`);

        if (mimeType === 'application/pdf') {
            console.log('📄 resumeParser: Using pdf-parse');
            // pdf is the function directly
            const data = await pdf(buffer);
            console.log('📄 resumeParser: PDF parsed successfully');
            return {
                text: cleanText(data.text),
                metadata: {
                    numpages: data.numpages,
                    info: data.info
                }
            };
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
            console.log('📄 resumeParser: Using mammoth');
            const result = await mammoth.extractRawText({ buffer });
            console.log('📄 resumeParser: DOCX parsed successfully');
            return {
                text: cleanText(result.value),
                metadata: {
                    messages: result.messages
                }
            };
        } else {
            console.warn(`📄 resumeParser: Unsupported mime type: ${mimeType}`);
            return {
                text: '',
                error: 'Unsupported file type. Please upload a PDF or DOCX file.'
            };
        }
    } catch (error: any) {
        console.error('❌ Error parsing resume:', error);
        return {
            text: '',
            error: `Failed to parse file content: ${error.message || String(error)}`
        };
    }
};

const cleanText = (text: string): string => {
    // Remove null bytes
    let cleaned = text.replace(/\0/g, '');
    // Replace multiple spaces/newlines with single space
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
};
