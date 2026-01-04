import app from './api/index';

const PORT = 3001;

// Use '0.0.0.0' or just port to listen on all interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AI API Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 AI endpoint: http://localhost:${PORT}/api/ai`);
    console.log(`📏 Measure Resume endpoint: http://localhost:${PORT}/api/measure-resume`);

    // Log configuration status
    console.log(`🔑 OpenRouter configured: ${!!process.env.OPENROUTER_API_KEY}`);
    console.log(`🔑 Gemini configured: ${!!(process.env.API_KEY || process.env.GEMINI_API_KEY)}`);
});

// Force Keep-Alive to prevent premature exit
setInterval(() => { }, 1000 * 60 * 60);

process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection:', reason);
});
