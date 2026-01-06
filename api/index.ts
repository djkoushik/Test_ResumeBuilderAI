import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenRouter } from '@openrouter/sdk';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';

// API Handlers
import atsScoreHandler from './ats-score.js';
import measureResumeHandler from './measure-resume.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Also try loading .env.local if it exists (for local development variables)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (fs.existsSync(path.join(__dirname, '../.env.local'))) {
  const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env.local')));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize AI clients
const openRouterClient = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const geminiClient = new GoogleGenAI({
  apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY
});

// AI generation endpoint
app.post('/api/ai', async (req, res) => {
  console.log('📨 Received AI request:', {
    hasPrompt: !!req.body.prompt,
    type: req.body.type,
    promptLength: req.body.prompt?.length
  });

  try {
    const {
      prompt,
      systemMessage = "You are a professional resume writer. Output ONLY the enhanced polished professional text. No explanations, no additional commentary.",
      temperature = 0.4,
      maxTokens = 300,
      type
    } = req.body;

    if (!prompt) {
      console.error('❌ No prompt provided');
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    if (!process.env.OPENROUTER_API_KEY && !process.env.API_KEY && !process.env.GEMINI_API_KEY) {
      console.error('❌ No API keys configured');
      return res.status(500).json({
        success: false,
        error: 'No AI providers configured. Please check your environment variables.'
      });
    }

    let result;
    let usedProvider = 'openrouter';

    // Try OpenRouter first
    try {
      console.log('🚀 Trying OpenRouter...');
      const response = await openRouterClient.chat.send({
        model: "nex-agi/deepseek-v3.1-nex-n1:free",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        temperature,
        maxTokens: maxTokens,
        stream: false
      });
      const messageContent = response.choices[0]?.message?.content;
      result = Array.isArray(messageContent)
        ? messageContent.filter(item => item.type === 'text').map(item => (item as any).text || '').join(' ')
        : messageContent || "";

      if (!result) throw new Error("No content received from OpenRouter");
      console.log('✅ OpenRouter success');
    } catch (openRouterError: any) {
      console.warn("⚠️ OpenRouter failed, falling back to Gemini:", openRouterError.message);
      usedProvider = 'gemini';
      console.log('🔄 Trying Gemini fallback...');
      const response = await geminiClient.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemMessage,
          temperature: Math.min(temperature * 1.5, 1.0),
          topP: 1,
          topK: 1
        }
      });
      result = response.text.trim();
      console.log('✅ Gemini success');
    }

    res.json({ success: true, content: result, provider: usedProvider });

  } catch (error: any) {
    console.error("❌ AI API Error:", error.message);
    res.status(500).json({ success: false, error: `AI generation failed: ${error.message}` });
  }
});

// Helper to wrap Vercel handlers for Express
const wrapHandler = (handler: any) => (req: any, res: any) => {
  return handler(req, res);
};

// Route to Handlers
app.post('/api/ats-score', wrapHandler(atsScoreHandler));
app.post('/api/measure-resume', upload.single('resume'), wrapHandler(measureResumeHandler));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
    geminiConfigured: !!(process.env.API_KEY || process.env.GEMINI_API_KEY)
  });
});

export default app;
