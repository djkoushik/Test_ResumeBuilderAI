// Use legacy build for Node.js compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure worker for Node.js environment
// We need to point to the worker file. In a serverless env, this can be tricky.
// However, for basic text extraction, we might not need a complex worker setup if we use the "fake worker" or main thread?
// Actually, pdfjs-dist 4.0+ enforces worker.

// Try to use the standard worker
// In Node, we can set workerSrc to the path of the worker file.
// Or we can just import it?
// A common pattern for Node is:
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'path/to/pdf.worker.min.js';

// BUT, since we are in a Vercel/Vite environment, simply importing it might work if the bundler handles it.
// Let's try to set it up dynamically.

/* 
 * NOTE: In serverless, loading the worker file from disk can fail (the original issue).
 * We will try to use the 'legacy' build or standard build.
 */

export const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
    // Convert Buffer to Uint8Array
    const data = new Uint8Array(buffer);

    try {
        // Load the document
        // We use 'standard' font mode to avoid needing standard_fonts/ directory mapping if possible?
        // disableFontFace: true might help reduce dependencies on canvas/fonts
        const loadingTask = pdfjsLib.getDocument({
            data,
            useSystemFonts: true,
            disableFontFace: true,
        });

        const doc = await loadingTask.promise;
        const numPages = doc.numPages;
        let fullText = '';

        for (let i = 1; i <= numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();

            // Join items with a space. 
            // hasEOL can be used to determine newlines, but basic space join is usually enough for resume analysis.
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error("PDFJS Extraction Error:", error);
        throw error;
    }
};
