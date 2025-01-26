import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Middleware zum Injizieren der Konfiguration
app.get('/js/config.js', (req, res) => {
    // Stelle sicher, dass der API-Key korrekt formatiert ist
    const apiKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : '';
    
    if (!apiKey) {
        console.error('WARNUNG: GOOGLE_API_KEY ist nicht gesetzt!');
    }

    const config = `
        const config = {
            API_KEY: "${apiKey}"
        };
        export default config;
    `.trim();
    
    res.set('Content-Type', 'application/javascript');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(config);
});

// Serve static files with correct MIME types
app.get('/sw.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.set('Service-Worker-Allowed', '/');
    res.sendFile(join(__dirname, 'sw.js'));
});

// Serve other static files
app.use(express.static('.', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
}); 