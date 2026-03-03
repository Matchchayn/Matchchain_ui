// ==========================================
// ENVIRONMENT CONTROLLER
// ==========================================
// Set this to TRUE if you are running the backend locally on your computer.
// Set this to FALSE if you want to connect to the live production server (Railway).
// AUTOMATIC SWITCH: Connect to localhost dev server OR live Railway production server!
const IS_PRODUCTION = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

export const API_BASE_URL = IS_PRODUCTION
    ? 'https://zoological-celebration-production-e24f.up.railway.app'
    : 'http://localhost:5000';
