import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Middleware zum Injizieren der Konfiguration
app.get('/js/config.js', (req, res) => {
    // Debug: Zeige alle Umgebungsvariablen
    console.log('Server: Alle ENV Variablen:', Object.keys(process.env));
    
    const googleApiKey = process.env.GOOGLE_API_KEY;
    console.log('Server: GOOGLE_API_KEY Wert:', googleApiKey);
    
    // Erstelle das Konfigurations-Objekt
    const config = `
// Generierte Konfiguration - ${new Date().toISOString()}
const config = {
    API_KEY: "${googleApiKey || ''}",  // Für Abwärtskompatibilität
    GOOGLE_API_KEY: "${googleApiKey || ''}"  // Neuer Name
};
console.log('Client: Konfiguration geladen:', config);
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
    const apiKey = process.env.GOOGLE_API_KEY || '';
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
}); 