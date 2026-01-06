// @ts-ignore
import { extractTextFromPDF } from './pdfService.js';
import mammoth from 'mammoth';

interface ParsedResume {
    text: string;
    metadata?: any;
    error?: string;
}

export const parseResume = async (buffer: Buffer, mimeType: string): Promise<ParsedResume> => {
    try {
        console.log(`📄 resumeParser: Starting parse for mimeType: ${mimeType}`);

        if (mimeType === 'application/pdf') {
            console.log('📄 resumeParser: Using pdfjs-dist');
            try {
                const text = await extractTextFromPDF(buffer);
                console.log('📄 resumeParser: PDF parsed successfully');
                return {
                    text: cleanText(text),
                    metadata: {
                        numpages: 0, // pdfjs returns this but we didn't extract it in the helper yet, acceptable trade-off
                    }
                };
            } catch (pdfError: any) {
                console.error('📄 resumeParser: PDF Parse Failed:', pdfError);
                throw new Error(`PDF Parsing failed: ${pdfError.message}`);
            }
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
    if (!text) return "";
    // Remove null bytes
    let cleaned = text.replace(/\0/g, '');
    // Replace multiple spaces/newlines with single space
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
};
