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
    } else {
        console.log('Server: API-Key ist gesetzt (Länge:', apiKey.length, ')');
        console.log('Server: API-Key Start:', apiKey.substring(0, 4));
        console.log('Server: API-Key Ende:', apiKey.substring(apiKey.length - 4));
    }

    const configObject = {
        API_KEY: apiKey
    };

    const config = `
// Generierte Konfiguration
const config = ${JSON.stringify(configObject, null, 4)};
console.log('Config loaded with API key:', !!config.API_KEY, 'length:', config.API_KEY.length);
export default config;
`.trim();
    
    res.set({
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    res.send(config);
});

// API endpoint to check configuration
app.get('/api/check-config', (req, res) => {
    const apiKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : '';
    res.json({
        hasApiKey: !!apiKey,
        keyLength: apiKey.length,
        keyStart: apiKey ? apiKey.substring(0, 4) : '',
        keyEnd: apiKey ? apiKey.substring(apiKey.length - 4) : ''
    });
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
    console.log('API Key vorhanden:', !!process.env.GOOGLE_API_KEY);
    if (process.env.GOOGLE_API_KEY) {
        console.log('API Key Länge:', process.env.GOOGLE_API_KEY.length);
    }
}); 