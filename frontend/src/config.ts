// ==========================================
// ENVIRONMENT CONTROLLER
// ==========================================
// Set this to TRUE if you are running the backend locally on your computer.
// Set this to FALSE if you want to connect to the live production server (Render).
export const IS_LOCAL = false;

// The app will automatically use the correct URL based on your switch above!
export const API_BASE_URL = IS_LOCAL
    ? 'http://localhost:5000'
    : 'https://matchchayn-backend.onrender.com';
