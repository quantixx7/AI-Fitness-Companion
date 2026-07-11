// config.js
// Global configuration settings for AI Fitness Companion frontend

const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname === '';

window.CONFIG = {
    API_BASE_URL: isLocal ? 'http://localhost:8000' : 'https://ai-fitness-companion.onrender.com'
};
Object.freeze(window.CONFIG); // Prevent accidental modification
