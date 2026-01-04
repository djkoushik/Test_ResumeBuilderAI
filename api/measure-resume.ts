import { calculateATSScoreFromText } from '../services/atsService.js';
import { parseResume } from '../services/resumeParser.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    api: {
        bodyParser: false,
    },
};

// Start handler
export default async function handler(req: any, res: VercelResponse) {
    // enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log('⚡ Received Measure Resume Request (API Handler via Multer)');

    // Check if Multer middleware populated req.file and req.body
    if (!req.file) {
        console.error('❌ No file received from Multer');
        return res.status(400).json({ error: 'Missing resume file' });
    }

    const jobDescription = req.body.jobDescription;
    if (!jobDescription) {
        console.error('❌ Missing jobDescription');
        return res.status(400).json({ error: 'Missing jobDescription' });
    }

    try {
        console.log(`📂 Processing file: ${req.file.originalname} (${req.file.mimetype})`);

        const buffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        console.log('🔍 Parsing resume...');
        const parsedResult = await parseResume(buffer, mimeType);
        console.log('✅ Resume parsed, text length:', parsedResult.text?.length);

        if (parsedResult.error) {
            console.error('❌ Parse error:', parsedResult.error);
            return res.status(400).json({ error: parsedResult.error });
        }

        console.log('📊 Calculating ATS score...');
        const scoreResult = calculateATSScoreFromText(parsedResult.text, {
            description: jobDescription
        });
        console.log('✅ Score calculated:', scoreResult.score);

        res.status(200).json({
            success: true,
            data: scoreResult,
            text_preview: parsedResult.text.substring(0, 200) + '...'
        });

    } catch (error: any) {
        console.error('❌ Measure Resume Error (Caught in Handler):', error);
        console.error(error.stack);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Failed to measure resume' });
        }
    }
}
